const http = require('http');
const fs = require('fs');
const path = require('path');
const SiteGen = require('./sitegen.js');
const Brief = require('./brief-schema.js');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'data', 'db.json');
const UA = 'LeadSite/1.0 (prospeccao-local)';

/* ---------------- login opcional ----------------
   Defina a variável de ambiente LEADSITE_SENHA para exigir login no CRM.
   Sem essa variável, o sistema funciona exatamente como antes (sem senha).
   As páginas públicas (formulário do cliente e sites publicados em /s/) NUNCA pedem senha. */
const SENHA = process.env.LEADSITE_SENHA || '';
const sessoes = new Set(); // tokens válidos em memória (reinicia ao reiniciar o servidor)
function novoToken() { return require('crypto').randomBytes(24).toString('hex'); }
function cookies(req) {
  const h = req.headers.cookie || '';
  const m = {};
  h.split(';').forEach(p => { const i = p.indexOf('='); if (i > -1) m[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return m;
}
function autenticado(req) {
  if (!SENHA) return true; // login desligado
  const t = cookies(req).leadsite_sessao;
  return !!t && sessoes.has(t);
}
const PAGINA_LOGIN = (erro) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>LeadSite — Login</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#0f1115;color:#eee;display:flex;
align-items:center;justify-content:center;height:100vh;margin:0}
form{background:#1a1d24;padding:32px;border-radius:12px;width:280px}
h1{font-size:18px;margin:0 0 16px}input{width:100%;padding:10px;margin-bottom:12px;border-radius:6px;
border:1px solid #333;background:#0f1115;color:#eee;box-sizing:border-box}
button{width:100%;padding:10px;border:0;border-radius:6px;background:#4f8cff;color:#fff;cursor:pointer;font-weight:600}
.erro{color:#ff6b6b;font-size:13px;margin:-6px 0 12px}</style></head><body>
<form method="POST" action="/login">
<h1>🔒 LeadSite</h1>
${erro ? '<div class="erro">Senha incorreta.</div>' : ''}
<input type="password" name="senha" placeholder="Senha" autofocus>
<button type="submit">Entrar</button>
</form></body></html>`;

/* ---------------- banco de dados (arquivo JSON) ---------------- */
function lerDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { leads: [], sites: [], config: {} }; }
}
function salvarDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  // escrita atômica: grava num arquivo temporário e só troca pelo definitivo se tudo deu certo,
  // assim uma queda de energia ou erro no meio da escrita nunca deixa o db.json corrompido/vazio.
  const tmp = DB_FILE + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------------- categorias -> filtros Overpass ---------------- */
const CATEGORIAS = {
  restaurante:  ['amenity~"^(restaurant|fast_food)$"'],
  lanchonete:   ['amenity~"^(fast_food|ice_cream)$"'],
  cafe_bar:     ['amenity~"^(cafe|bar|pub)$"'],
  padaria:      ['shop~"^(bakery|pastry|confectionery)$"'],
  mercado:      ['shop~"^(supermarket|convenience|greengrocer|butcher|grocery)$"'],
  salao_beleza: ['shop~"^(hairdresser|beauty|massage|tattoo)$"'],
  academia:     ['leisure~"^(fitness_centre|sports_centre)$"', 'amenity="gym"'],
  oficina:      ['shop~"^(car_repair|tyres|motorcycle_repair|car_parts)$"'],
  autopecas:    ['shop~"^(car_parts|car|motorcycle)$"'],
  clinica:      ['amenity~"^(clinic|doctors|dentist|veterinary)$"'],
  farmacia:     ['amenity="pharmacy"', 'shop="chemist"'],
  petshop:      ['shop="pet"', 'shop="pet_grooming"', 'amenity="veterinary"'],
  loja_roupas:  ['shop~"^(clothes|shoes|boutique|fashion_accessories|jewelry)$"'],
  construcao:   ['shop~"^(hardware|doityourself|paint|trade|building_materials|electrical)$"'],
  moveis:       ['shop~"^(furniture|interior_decoration|houseware|bed)$"'],
  eletronicos:  ['shop~"^(electronics|computer|mobile_phone|hifi)$"'],
  hotel:        ['tourism~"^(hotel|guest_house|motel|hostel|apartment)$"'],
  escola:       ['amenity~"^(school|language_school|driving_school|college|kindergarten)$"'],
  advocacia:    ['office~"^(lawyer|accountant|insurance|estate_agent|financial|company)$"'],
  imobiliaria:  ['office="estate_agent"', 'shop="estate_agent"'],
  papelaria:    ['shop~"^(stationery|copyshop|books|printing)$"'],
  floricultura: ['shop~"^(florist|garden_centre)$"'],
  lavanderia:   ['shop~"^(laundry|dry_cleaning)$"'],
  otica:        ['shop~"^(optician|hearing_aids)$"'],
  outros:       ['shop', 'craft', 'office'],
};

function get(req, tags) {
  for (const k of tags) if (tags && req[k]) return req[k];
  return null;
}

/* ---------------- HTTP helpers ---------------- */
// timeout real: sem isso, uma API pública lenta ou fora do ar deixa a requisição
// pendurada pra sempre e o usuário fica olhando o "Buscando..." sem nunca dar erro.
function fetchComTimeout(url, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}
function fetchJSON(url, opts = {}) {
  return fetchComTimeout(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) } })
    .then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${new URL(url).hostname}`);
      return r.json();
    })
    .catch(e => {
      if (e.name === 'AbortError') throw new Error(`Tempo esgotado ao contatar ${new URL(url).hostname}`);
      throw e;
    });
}

/* ---------------- cache simples em memória ----------------
   Evita bater de novo nas APIs públicas (Nominatim/Overpass) pra buscas repetidas
   e faz a mesma busca ficar instantânea por um tempo. */
const cache = new Map(); // chave -> { valor, expira }
function cacheGet(k) {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.expira) { cache.delete(k); return null; }
  return v.valor;
}
function cacheSet(k, valor, ttlMs) { cache.set(k, { valor, expira: Date.now() + ttlMs }); }

/* ---------------- limite de requisições (rate limit) ----------------
   Protege as APIs públicas do OpenStreetMap (e o próprio servidor) contra uso
   abusivo/acidental — por exemplo um clique duplicado ou um script automatizado. */
const janelasReq = new Map(); // ip -> lista de timestamps recentes
function limiteExcedido(ip, janelaMs, max) {
  const agora = Date.now();
  const lista = (janelasReq.get(ip) || []).filter(t => agora - t < janelaMs);
  lista.push(agora);
  janelasReq.set(ip, lista);
  return lista.length > max;
}

/* ---------------- geocoding via Nominatim ---------------- */
async function geocodificar(cidade) {
  const chave = 'geo:' + cidade.toLowerCase().trim();
  const cacheado = cacheGet(chave);
  if (cacheado) return cacheado;

  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=' +
    encodeURIComponent(cidade);
  const r = await fetchJSON(url);
  if (!r || !r.length) throw new Error(`Cidade "${cidade}" não encontrada no OpenStreetMap.`);
  const b = r[0].boundingbox.map(Number); // [minLat, maxLat, minLon, maxLon]
  const end = r[0].address || {};
  const resultado = {
    nome: r[0].display_name,
    lat: Number(r[0].lat),
    lon: Number(r[0].lon),
    bbox: [b[0], b[2], b[1], b[3]], // Overpass: S,W,N,E
    uf: end.state_code || end.state || '',   // a busca com IA precisa do estado
  };
  cacheSet(chave, resultado, 7 * 24 * 60 * 60 * 1000); // coordenadas de cidade não mudam: 7 dias
  return resultado;
}

/* ---------------- busca no Overpass ---------------- */
const ESPELHOS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

async function overpass(query) {
  const chave = 'ov:' + query;
  const cacheado = cacheGet(chave);
  if (cacheado) return cacheado;

  let ultimoErro;
  for (const url of ESPELHOS) {
    try {
      const r = await fetchComTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: 'data=' + encodeURIComponent(query),
      }, 45000); // consultas grandes no Overpass podem demorar
      if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + new URL(url).hostname);
      const json = await r.json();
      cacheSet(chave, json, 6 * 60 * 60 * 1000); // 6h: resultados de empresas não mudam de hora em hora
      return json;
    } catch (e) {
      ultimoErro = e.name === 'AbortError' ? new Error('Tempo esgotado em ' + new URL(url).hostname) : e;
    }
  }
  throw new Error('Todos os servidores Overpass falharam: ' + ultimoErro.message);
}

/* Qual fonte vai ser usada. A IA é a mais rica: com a chave no servidor ela
   assume sozinha, e o cliente pode pedir outra explicitamente com fonte:"osm". */
function fonteDaProspeccao(fontePedida) {
  if (fontePedida === 'osm') return 'osm';
  if (fontePedida === 'gemini') return 'gemini';
  return geminiPronto() ? 'gemini' : 'osm';
}

async function prospectar(opts = {}) {
  const fonte = fonteDaProspeccao(opts.fonte);
  if (fonte === 'gemini') {
    if (!geminiPronto()) {
      throw new Error('Fonte "gemini" pedida, mas o servidor está sem GEMINI_API_KEY.');
    }
    return prospectarGemini(opts);
  }
  return prospectarOSM(opts);
}

async function prospectarOSM({ cidade, categorias, raioKm, limite, apenasSemSite, exigirTelefone }) {
  const local = await geocodificar(cidade);
  const cats = (categorias && categorias.length) ? categorias : Object.keys(CATEGORIAS);
  const filtros = [];
  for (const c of cats) for (const f of (CATEGORIAS[c] || [])) filtros.push(f);

  let area;
  if (raioKm && raioKm > 0) {
    area = `(around:${Math.round(raioKm * 1000)},${local.lat},${local.lon})`;
  } else {
    area = `(${local.bbox.join(',')})`;
  }

  const partes = [];
  for (const f of [...new Set(filtros)]) {
    partes.push(`node[${f}]${area};`);
    partes.push(`way[${f}]${area};`);
  }

  const q = `[out:json][timeout:60];\n(${partes.join('\n')});\nout center ${Math.min(Number(limite) || 120, 600) * 3};`;
  const json = await overpass(q);

  const vistos = new Set();
  const resultados = [];

  for (const el of (json.elements || [])) {
    const t = el.tags || {};
    const nome = t.name || t['name:pt'] || t.brand;
    if (!nome) continue;

    const chave = nome.toLowerCase().trim() + '|' + (t['addr:street'] || '').toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    const site = t.website || t['contact:website'] || t.url || t['contact:url'] || null;
    const fb = t['contact:facebook'] || t.facebook || null;
    const ig = t['contact:instagram'] || t.instagram || null;
    const temSite = !!site;

    if (apenasSemSite && temSite) continue;

    const telefone = t.phone || t['contact:phone'] || t['contact:mobile'] || t.mobile || null;
    if (exigirTelefone && !telefone) continue;

    const cat = t.shop || t.amenity || t.office || t.craft || t.tourism || t.leisure || 'outro';
    const rua = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ');
    const bairro = t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:district'] || null;
    const cidadeLead = t['addr:city'] || t['addr:municipality'] || null;
    const endereco = [rua, bairro, cidadeLead].filter(Boolean).join(' - ');
    const p = el.center || el;

    resultados.push({
      osmId: el.type + '/' + el.id,
      nome, categoria: cat, telefone,
      email: t.email || t['contact:email'] || null,
      endereco: endereco || null, bairro, cidade: cidadeLead,
      site, temSite,
      redes: { facebook: fb, instagram: ig },
      temRedeSocial: !!(fb || ig),
      horario: t.opening_hours || null,
      lat: p.lat, lon: p.lon,
      mapa: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    });
  }

  // pontuação: quem tem telefone e nenhuma presença online é o melhor lead
  const score = (b) => (b.telefone ? 40 : 0) + (!b.temSite ? 35 : 0) + (!b.temRedeSocial ? 15 : 0) +
    (b.endereco ? 10 : 0) + (b.email ? 10 : 0) + (b.horario ? 5 : 0);
  resultados.forEach(b => { b.score = score(b); });
  resultados.sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome));

  const lim = Math.min(Number(limite) || 120, 600);
  return {
    local: { nome: local.nome, lat: local.lat, lon: local.lon },
    fonte: 'osm',
    total: resultados.length,
    semSite: resultados.filter(b => !b.temSite).length,
    comSite: resultados.filter(b => b.temSite).length,
    empresas: resultados.slice(0, lim),
  };
}

/* ═══════════════ busca com IA: Gemini + Google Maps ═══════════════
   Mesma estratégia do app celular (index.html), só que rodando no servidor.
   Numa chamada só o Gemini consulta o Google Maps E a busca do Google e
   devolve a empresa com telefone, Instagram, dono, nota e gancho de venda.

   Ative com a variável de ambiente:
       GEMINI_API_KEY=AIza...  node server.js
   Sem ela, /api/prospectar continua no OpenStreetMap como sempre.

   As três regras que este código segue (e que não são óbvias):
   1. prompt em INGLÊS — o Maps grounding ignora prompt em outro idioma e aí o
      modelo inventa empresa;
   2. SEM responseMimeType — JSON estruturado e grounding não combinam;
   3. nada entra na lista sem telefone, endereço ou lugar confirmado no Maps.
   ══════════════════════════════════════════════════════════════════════ */
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.LEADSITE_GEMINI_KEY || '';
const GEMINI_MODELOS = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.7-flash',
                        'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
let geminiModeloOk = null;          // o que respondeu por último neste processo

const geminiPronto = () => !!GEMINI_KEY;

/* Categorias do app em inglês — ver regra 1 acima. */
const CATEGORIAS_EN = {
  restaurante: 'restaurants', lanchonete: 'fast food outlets, snack bars and ice cream shops',
  cafe_bar: 'cafes, bars and pubs', padaria: 'bakeries and pastry shops',
  mercado: 'supermarkets, grocery stores, greengrocers and butcher shops',
  salao: 'hair salons, beauty salons, massage studios and tattoo studios',
  academia: 'gyms and fitness centers',
  oficina: 'car repair shops, tire shops and motorcycle repair shops',
  autopecas: 'auto parts stores and vehicle dealerships',
  clinica: 'medical clinics, doctors, dentists and veterinarians',
  farmacia: 'pharmacies and drugstores', petshop: 'pet shops and pet grooming services',
  roupas: 'clothing, shoes, boutique and jewelry stores',
  construcao: 'building materials, hardware, DIY and paint stores',
  moveis: 'furniture and home decoration stores',
  eletronicos: 'electronics, computer and mobile phone stores',
  hotel: 'hotels, guest houses, motels and hostels',
  escola: 'schools, language schools and driving schools',
  advocacia: 'law firms, accounting offices and insurance brokers',
  imobiliaria: 'real estate agencies', papelaria: 'stationery stores, copy shops and bookstores',
  floricultura: 'florists and garden centers', lavanderia: 'laundries and dry cleaners',
  otica: 'opticians and eyewear stores',
};

const semAcento = (t) => String(t || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(ltda|me|epp|eireli|sa|company|empresa|negocios|servicos)\b/g, ' ')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const soDigitos = (t) => String(t || '').replace(/\D/g, '');
function telefoneBR(v) {
  const n = soDigitos(v);
  if (!n) return '';
  if (n.length === 10 || n.length === 11) return '55' + n;
  if ((n.length === 12 || n.length === 13) && n.startsWith('55')) return n;
  return n;
}
function urlLimpa(v) {
  let s = String(v || '').trim().replace(/^["'<>\s]+|["'<>\s]+$/g, '');
  if (!s || /^(null|undefined|none|n\/a|nao|não|desconhecido|-|@)$/i.test(s)) return '';
  if (!/^https?:\/\//i.test(s)) {
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)) return '';
    s = 'https://' + s;
  }
  return s;
}
/* Rede social que veio disfarçada de site. Empresa cujo "site" é o Instagram
   continua sendo lead quente — é justamente quem mais precisa de um site. */
function redeDe(url) {
  const u = String(url || '');
  if (/instagram\.com\//i.test(u)) return 'instagram';
  if (/facebook\.com\//i.test(u) || /fb\.com\//i.test(u) || /fb\.me\//i.test(u)) return 'facebook';
  if (/wa\.me\//i.test(u) || /whatsapp/i.test(u)) return 'whatsapp';
  return '';
}

/* Casa o nome escrito pela IA com um lugar do grounding do Google Maps. */
function casarLugar(nome, lugares) {
  const alvo = semAcento(nome);
  if (!alvo || !lugares.length) return null;
  const palavras = alvo.split(' ').filter(p => p.length > 2);
  let melhor = null, melhorPonto = 0;
  for (const l of lugares) {
    const cand = semAcento(l.titulo);
    if (!cand) continue;
    let ponto = 0;
    if (cand === alvo) ponto = 100;
    else if (cand.includes(alvo) || alvo.includes(cand)) ponto = 82;
    else if (palavras.length) {
      const acertos = palavras.filter(p => cand.includes(p)).length;
      ponto = Math.round(78 * acertos / palavras.length);
    }
    if (ponto > melhorPonto) { melhorPonto = ponto; melhor = l; }
  }
  return melhorPonto >= 60 ? melhor : null;
}

/* Extrai a lista mesmo quando a resposta vem com texto em volta ou cortada no
   meio por falta de token — sem isso perde-se tudo por causa do último item. */
function pescarObjetos(s) {
  const saida = [];
  let pilha = 0, inicio = -1, emString = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (emString) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') emString = false;
      continue;
    }
    if (c === '"') { emString = true; continue; }
    if (c === '{') { if (pilha === 0) inicio = i; pilha++; continue; }
    if (c === '}') {
      if (pilha > 0) pilha--;
      if (pilha === 0 && inicio >= 0) {
        const trecho = s.slice(inicio, i + 1); inicio = -1;
        if (trecho.length < 8) continue;
        try { const o = JSON.parse(trecho); if (o && (o.nome || o.name)) saida.push(o); } catch { /* descarta só ele */ }
      }
    }
  }
  return saida;
}
function extrairLista(texto) {
  const s = String(texto || '').trim();
  const semCerca = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  for (const c of [semCerca, s]) {
    try {
      const j = JSON.parse(c);
      const arr = Array.isArray(j) ? j : (j && (j.empresas || j.businesses || j.results || j.places));
      if (Array.isArray(arr) && arr.length) return arr;
    } catch { /* próxima */ }
  }
  const colchete = s.indexOf('[');
  return pescarObjetos(colchete >= 0 ? s.slice(colchete) : s);
}
function extrairObjeto(texto) {
  const s = String(texto || '').trim();
  try {
    const j = JSON.parse(s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    if (Array.isArray(j) && j.length) return j[0];
    if (j && typeof j === 'object') return j;
  } catch { /* plano B */ }
  const ini = s.indexOf('{');
  if (ini < 0) throw new Error('A IA não devolveu uma ficha legível.');
  const t = s.slice(ini);
  const cortes = [];
  let emStr = false, fugiu = false, prof = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (emStr) {
      if (fugiu) fugiu = false; else if (c === '\\') fugiu = true; else if (c === '"') emStr = false;
      continue;
    }
    if (c === '"') emStr = true;
    else if (c === '{' || c === '[') prof++;
    else if (c === '}' || c === ']') prof--;
    else if (c === ',' && prof === 1) cortes.push(i);
  }
  for (let k = cortes.length - 1; k >= 0; k--) {
    const trecho = t.slice(0, cortes[k]);
    const colchete = (trecho.match(/\[/g) || []).length - (trecho.match(/\]/g) || []).length;
    try {
      const o = JSON.parse(trecho + (colchete > 0 ? ']' : '') + '}');
      if (o && typeof o === 'object') return o;
    } catch { /* corte anterior */ }
  }
  throw new Error('A IA devolveu a ficha incompleta. Tente de novo.');
}

function erroGemini(status, msg) {
  const m = String(msg || '');
  if (status === 400 && /API key not valid|invalid api key/i.test(m))
    return 'A GEMINI_API_KEY do servidor é inválida.';
  if (status === 403) return 'A GEMINI_API_KEY foi bloqueada (403). Ative a "Generative Language API" no projeto.';
  if (status === 429) return 'Limite do Gemini atingido (5.000 buscas com Maps por mês na cota grátis). Aguarde.';
  if (status === 404) return 'Nenhum modelo do Gemini disponível nesta chave.';
  return `Gemini respondeu erro ${status}${m ? ': ' + m.slice(0, 200) : ''}`;
}

/* Uma chamada com Google Maps + Google Search ligados. */
async function geminiComMaps(prompt, lat, lon, maxTokens = 8192) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  const fila = [...new Set([geminiModeloOk, process.env.GEMINI_MODEL, ...GEMINI_MODELOS].filter(Boolean))];
  let ultimoErro = null;

  for (let i = 0; i < fila.length; i++) {
    const modelo = fila[i];
    const corpo = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: Number(lat), longitude: Number(lon) }, languageCode: 'en-US' } },
      generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
      // SEM responseMimeType: JSON estruturado e grounding brigam (ver regra 2)
    };
    let r;
    try {
      r = await fetchComTimeout(GEMINI_URL + encodeURIComponent(modelo) + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
        body: JSON.stringify(corpo),
      }, 120000);
    } catch (e) { ultimoErro = e; continue; }

    if (!r.ok) {
      const bruto = await r.text().catch(() => '');
      let msg = ''; try { msg = JSON.parse(bruto).error.message; } catch { /* sem corpo */ }
      ultimoErro = new Error(erroGemini(r.status, msg));
      if ((r.status === 404 || /googleMaps|googleSearch|not supported/i.test(msg)) && i < fila.length - 1) continue;
      throw ultimoErro;
    }

    const j = await r.json();
    const cand = (j.candidates || [])[0] || {};
    const texto = ((cand.content || {}).parts || []).map(p => p.text || '').join('');
    const gm = cand.groundingMetadata || {};
    const lugares = (gm.groundingChunks || [])
      .map(c => (c && c.maps) || null).filter(Boolean)
      .map(m => ({ placeId: String(m.placeId || '').replace(/^places\//, ''), titulo: m.title || '', uri: m.uri || '' }))
      .filter(m => m.placeId || m.uri);

    if (!texto) {
      ultimoErro = new Error('A IA respondeu vazio.');
      if (i < fila.length - 1) continue;
      throw ultimoErro;
    }
    geminiModeloOk = modelo;
    return { texto, lugares, modelo, consultas: gm.webSearchQueries || [] };
  }
  throw ultimoErro || new Error('Nenhum modelo do Gemini disponível.');
}

const promptBusca = (cidade, uf, cats, raioKm) => {
  const tipos = cats.map(c => CATEGORIAS_EN[c] || String(c));
  const onde = raioKm > 0
    ? `within ${raioKm} km of the coordinates given in the tool configuration`
    : 'across the whole city';
  return [
    'You are a local-business prospecting researcher.',
    `Use the Google Maps tool to find REAL, currently operating businesses in ${cidade}${uf ? ', ' + uf : ''}, Brazil, ${onde}.`,
    `Categories wanted: ${tipos.join('; ')}.`,
    '',
    'Return ONLY a JSON object. No markdown fence, no commentary:',
    '{"empresas":[{"nome":"","categoria":"","endereco":"","bairro":"","telefone":"",',
    '"whatsapp":"","email":"","site":"","instagram":"","facebook":"","horario":"",',
    '"nota":0,"avaliacoes":0,"dono":"","servicos":[],"gancho":"","problema":""}]}',
    '',
    'HARD RULES:',
    '- Only businesses you actually found. NEVER invent, guess or complete a name, phone,',
    '  address or handle. Unknown field = "" (0 for numbers, [] for lists).',
    '- Write "nome", "endereco", "bairro" and "horario" exactly as they appear locally, in Portuguese.',
    '- "telefone" and "whatsapp" in digits with country code, e.g. 556634210000.',
    '- "site" is the business OWN website only. If it has none, use "" — never put Instagram,',
    '  Facebook or a Google Maps link there.',
    '- Use Google Search to fill "instagram", "facebook", "email", "site", "dono" (owner name)',
    '  and "servicos" (up to 6 short items, in Portuguese).',
    '- "nota" = Google rating as a number. "avaliacoes" = review count.',
    '- "gancho": ONE sentence IN PORTUGUESE, max 140 chars, with a concrete sales angle for someone',
    '  who builds websites for local businesses, mentioning something you really observed.',
    '- "problema": IN PORTUGUESE, max 120 chars, the biggest online weakness. "" if none.',
    '- Skip closed businesses and big national chains; prefer independent local businesses.',
    '- Return up to 40, best prospects first. If you find none, return {"empresas":[]}.',
  ].join('\n');
};

/* Converte um item da IA no formato que /api/prospectar já devolve, pra o app
   de computador não precisar saber de onde os dados vieram. */
function empresaDaIA(e, cidade, local, rotulo, lugares) {
  const nome = String(e.nome || e.name || '').trim();
  if (!nome || nome.length < 2 || /^(unknown|desconhecido|null|n\/a)$/i.test(nome)) return null;

  const siteBruto = urlLimpa(e.site || e.website);
  const rede = redeDe(siteBruto);
  const site = rede ? '' : siteBruto;
  const instagram = urlLimpa(e.instagram) || (rede === 'instagram' ? siteBruto : '');
  const facebook = urlLimpa(e.facebook) || (rede === 'facebook' ? siteBruto : '');
  const lugar = casarLugar(nome, lugares);
  const placeId = lugar ? String(lugar.placeId || '').replace(/^places\//, '') : '';
  const telefone = telefoneBR(e.telefone || e.phone);
  const whatsapp = telefoneBR(e.whatsapp) || telefone;
  const temRedeSocial = !!(instagram || facebook);

  const b = {
    osmId: 'ia:' + (placeId || (semAcento(nome) + '|' + semAcento(cidade))),
    nome,
    categoria: rotulo || String(e.categoria || 'outro'),
    telefone: telefone || null,
    email: String(e.email || '').trim() || null,
    endereco: String(e.endereco || '').trim() || null,
    bairro: String(e.bairro || '').trim() || null,
    cidade,
    site: site || null, temSite: !!site,
    redes: { facebook: facebook || null, instagram: instagram || null },
    temRedeSocial,
    horario: String(e.horario || '').trim() || null,
    lat: local ? local.lat : null, lon: local ? local.lon : null,
    mapa: (lugar && lugar.uri) || urlLimpa(e.maps) || null,
    // ── campos exclusivos da busca com IA ──
    whatsapp: whatsapp || null,
    nota: Number(e.nota) > 0 ? Number(e.nota) : null,
    avaliacoes: Number(e.avaliacoes) > 0 ? Math.round(Number(e.avaliacoes)) : null,
    dono: String(e.dono || '').trim() || null,
    servicos: Array.isArray(e.servicos) ? e.servicos.map(String).slice(0, 8) : [],
    gancho: String(e.gancho || '').trim() || null,
    problema: String(e.problema || '').trim() || null,
    placeId: placeId || null,
    confirmado: !!lugar,
    fonte: 'gemini',
  };
  b.score = pontuarEmpresa(b);
  return b;
}

/* Mesma base do OpenStreetMap + bônus pelo que só a IA descobre. Quem vem do
   OSM não tem estes campos, então o score antigo não muda nada. */
function pontuarEmpresa(b) {
  let p = (b.telefone ? 40 : 0) + (!b.temSite ? 35 : 0) + (!b.temRedeSocial ? 15 : 0) +
    (b.endereco ? 10 : 0) + (b.email ? 10 : 0) + (b.horario ? 5 : 0);
  if (b.fonte === 'gemini') {
    if (b.confirmado) p += 10;
    if (b.whatsapp) p += 8;
    if (b.dono) p += 5;
    if (b.gancho) p += 5;
    if (b.nota && b.avaliacoes && b.avaliacoes < 30) p += 7;
    if ((b.redes && b.redes.instagram) && !b.temSite) p += 5;
  }
  return p;
}

async function prospectarGemini({ cidade, categorias, raioKm, limite, apenasSemSite, exigirTelefone }) {
  const local = await geocodificar(cidade);
  const cats = (categorias && categorias.length) ? categorias : Object.keys(CATEGORIAS);
  const rotulo = cats.length === 1 && CATEGORIAS[cats[0]] ? cats[0] : null;

  const res = await geminiComMaps(promptBusca(cidade, local.uf, cats, Number(raioKm) || 0), local.lat, local.lon);
  const vistos = new Set();
  let resultados = [];
  for (const e of extrairLista(res.texto)) {
    const b = empresaDaIA(e, cidade, local, rotulo, res.lugares);
    if (!b || vistos.has(b.osmId)) continue;
    vistos.add(b.osmId);
    if (apenasSemSite && b.temSite) continue;
    if (exigirTelefone && !b.telefone) continue;
    resultados.push(b);
  }

  /* Respondeu sem consultar o Maps de verdade? Melhor avisar do que encher o
     CRM de empresa fantasma. */
  const confirmados = resultados.filter(b => b.confirmado).length;
  if (resultados.length && !confirmados && !res.lugares.length &&
      !resultados.some(b => b.telefone || b.endereco)) {
    throw new Error(`A IA respondeu sem consultar o Google Maps (modelo ${res.modelo}). Tente de novo.`);
  }

  resultados.sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome));
  const lim = Math.min(Number(limite) || 120, 600);
  resultados = resultados.slice(0, lim);
  return {
    local: { nome: local.nome, lat: local.lat, lon: local.lon },
    fonte: 'gemini', modelo: res.modelo, confirmados,
    total: resultados.length,
    semSite: resultados.filter(b => !b.temSite).length,
    comSite: resultados.filter(b => b.temSite).length,
    empresas: resultados,
  };
}

/* ---------------- dossiê: tudo sobre UMA empresa ---------------- */
function promptDossie(b) {
  return [
    'Research ONE business in depth. Use the Google Maps tool first, then Google Search.',
    `Business name: "${b.nome}"`,
    b.categoria ? `Category: ${b.categoria}` : '',
    b.endereco ? `Address on file: ${b.endereco}` : '',
    b.cidade ? `City: ${b.cidade}, Brazil` : 'Country: Brazil',
    b.placeId ? `Google Maps place_id: ${b.placeId}` : '',
    b.mapa ? `Google Maps link: ${b.mapa}` : '',
    b.telefone ? `Phone on file: ${b.telefone}` : '',
    '',
    'Return ONLY a JSON object. No markdown fence:',
    '{"resumo":"","dono":"","cnpj":"","abertaEm":0,"funcionarios":"",',
    '"endereco":"","bairro":"","telefone":"","whatsapp":"","email":"","site":"",',
    '"instagram":"","facebook":"","horario":"","nota":0,"avaliacoes":0,"fotos":0,',
    '"instagramAtivo":"","reclamacoes":"","elogios":"","concorrentes":[],',
    '"presenca":{"site":false,"instagram":false,"facebook":false,"maps":false},',
    '"oportunidades":[],"gancho":"","mensagem":""}',
    '',
    'HARD RULES:',
    '- Only facts you actually found. NEVER invent or guess. Unknown string = "", number = 0,',
    '  list = [], boolean = false.',
    '- Every human-readable value IN PORTUGUESE (Brazilian).',
    '- "resumo": 2 sentences on what the business does and how it stands locally.',
    '- "dono": owner/founder/manager name. "cnpj": only if you really found it.',
    '- "abertaEm": year it opened. "fotos": photos on its Google Maps listing.',
    '- "reclamacoes" / "elogios": what customers REPEAT in the reviews. "" if no reviews.',
    '- "instagramAtivo": when it last posted ("ontem", "há 3 meses", "parado desde 2023").',
    '- "concorrentes": up to 3 real nearby competitors.',
    '- "oportunidades": 3 to 5 concrete gaps a professional local website would fix.',
    '- "gancho": ONE sentence, max 140 characters, strongest sales angle.',
    '- "mensagem": a WhatsApp opener, max 350 chars, from a web designer to this owner. Friendly,',
    '  direct, at most one emoji, and it MUST mention one specific thing you really found.',
    '- "site" is the OWN website only. Instagram or Facebook is NOT a website.',
  ].filter(Boolean).join('\n');
}

async function dossieEmpresa(empresa) {
  const local = await geocodificar(empresa.cidade || empresa.cidadePadrao || 'Rondonópolis');
  const res = await geminiComMaps(promptDossie(empresa), local.lat, local.lon, 6000);
  const d = extrairObjeto(res.texto);
  return {
    modelo: res.modelo,
    resumo: String(d.resumo || ''), dono: String(d.dono || ''), cnpj: String(d.cnpj || ''),
    abertaEm: Number(d.abertaEm) || 0, funcionarios: String(d.funcionarios || ''),
    endereco: String(d.endereco || ''), bairro: String(d.bairro || ''),
    telefone: telefoneBR(d.telefone), whatsapp: telefoneBR(d.whatsapp) || telefoneBR(d.telefone),
    email: String(d.email || ''), site: redeDe(urlLimpa(d.site)) ? '' : urlLimpa(d.site),
    instagram: urlLimpa(d.instagram) || (redeDe(urlLimpa(d.site)) === 'instagram' ? urlLimpa(d.site) : ''),
    facebook: urlLimpa(d.facebook) || (redeDe(urlLimpa(d.site)) === 'facebook' ? urlLimpa(d.site) : ''),
    horario: String(d.horario || ''),
    nota: Number(d.nota) > 0 ? Number(d.nota) : null,
    avaliacoes: Number(d.avaliacoes) > 0 ? Math.round(Number(d.avaliacoes)) : null,
    fotos: Number(d.fotos) || 0, instagramAtivo: String(d.instagramAtivo || ''),
    reclamacoes: String(d.reclamacoes || ''), elogios: String(d.elogios || ''),
    concorrentes: Array.isArray(d.concorrentes) ? d.concorrentes.map(String) : [],
    presenca: (d.presenca && typeof d.presenca === 'object') ? d.presenca : {},
    oportunidades: Array.isArray(d.oportunidades) ? d.oportunidades.map(String) : [],
    gancho: String(d.gancho || ''), mensagem: String(d.mensagem || ''),
    lugares: res.lugares,
  };
}

/* ---------------- servidor ---------------- */
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };

function json(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(b) });
  res.end(b);
}
function corpo(req) {
  return new Promise((ok, err) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 8e6) req.destroy(); });
    req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { err(e); } });
  });
}

/* ---------------- fotos ---------------- */
const DIR_FOTOS = path.join(ROOT, 'data', 'fotos');
fs.mkdirSync(DIR_FOTOS, { recursive: true });

/* salva um data URI (jpeg/png/webp) e devolve a URL pública — mantém o HTML leve */
function salvarDataURI(dataURI) {
  const m = String(dataURI || '').match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
  if (!m) throw new Error('Imagem inválida.');
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 3e6) throw new Error('Imagem grande demais (máx. 3 MB).');
  const nome = uid() + '.' + ext;
  fs.writeFileSync(path.join(DIR_FOTOS, nome), buf);
  return { url: '/fotos/' + nome };
}

/* varre o config do site e troca qualquer data URI por arquivo salvo no servidor */
function limparFotosDoConfig(cfg) {
  const salvarSe = (v) => v && String(v).startsWith('data:image/');
  const alvos = [['logo'], ['heroImagem'], ['sobreImagem']];
  for (const [k] of alvos) if (salvarSe(cfg[k])) cfg[k] = salvarDataURI(cfg[k]).url;
  if (Array.isArray(cfg.galeria)) cfg.galeria = cfg.galeria.map(g => salvarSe(g) ? salvarDataURI(g).url : g);
  if (Array.isArray(cfg.fotos)) {
    cfg.fotos = cfg.fotos.map(f => {
      if (typeof f === 'string') return salvarSe(f) ? salvarDataURI(f) : { url: f };
      if (f && f.data && String(f.data).startsWith('data:image/')) return salvarDataURI(f.data);
      return f;
    }).filter(f => f && (f.url || f.banco));
  }
  return cfg;
}

/* ---------------- página de aprovação do cliente (/ver/:slug) ---------------- */
const PAGINA_VER = (site, url) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seu site está pronto — ${site.config.nome}</title>
<script src="/qrcode.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0f1115;color:#eee;min-height:100vh;display:flex;flex-direction:column}
.barra{background:#161a22;border-bottom:1px solid #262c38;padding:12px 16px;display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap}
.barra b{font-size:1rem}
.barra small{color:#8b98a5;display:block;font-size:.78rem}
.botoes{display:flex;gap:10px;flex-wrap:wrap}
.bt{border:0;border-radius:10px;padding:12px 20px;font:inherit;font-weight:700;font-size:.92rem;cursor:pointer}
.bt.ok{background:#22c55e;color:#052e12}
.bt.aj{background:#4f8cff;color:#fff}
.bt.sec{background:#232a36;color:#ddd}
iframe{flex:1;width:100%;border:0;background:#fff;min-height:70vh}
.painel{position:fixed;inset:0;background:rgba(5,8,12,.8);display:none;align-items:center;justify-content:center;z-index:50;padding:16px}
.painel.on{display:flex}
.cartao{background:#161a22;border:1px solid #2a3140;border-radius:16px;padding:26px;width:100%;max-width:520px;max-height:88vh;overflow:auto}
.cartao h2{font-size:1.15rem;margin-bottom:14px}
.ajs{display:grid;gap:10px;margin-bottom:16px}
.aj{border:1px solid #2a3140;border-radius:12px;padding:13px 15px}
.aj b{display:block;font-size:.85rem;margin-bottom:9px;color:#cbd5e1}
input{width:100%;padding:11px 12px;border-radius:9px;border:1px solid #333d4d;background:#0f1115;color:#eee;font:inherit;font-size:.92rem;box-sizing:border-box}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{border:1px solid #333d4d;border-radius:99px;padding:7px 13px;font-size:.82rem;cursor:pointer;background:#0f1115}
.chip.on{border-color:#4f8cff;background:#1b2a4a}
.tog{display:flex;align-items:center;justify-content:space-between;border:1px solid #2a3140;border-radius:12px;padding:13px 15px;cursor:pointer;font-size:.88rem;font-weight:600}
.tog .sw{width:42px;height:24px;border-radius:99px;background:#333d4d;position:relative}
.tog .sw::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}
.tog.on .sw{background:#4f8cff}
.tog.on .sw::after{left:21px}
.qr{background:#fff;border-radius:14px;padding:14px;width:190px;margin:0 auto 10px}
.qr img,.qr canvas{width:100%;display:block}
.fim{text-align:center;padding:30px 10px}
.fim .ico{font-size:3rem;margin-bottom:12px}
.fim p{color:#8b98a5;margin-bottom:8px;font-size:.92rem}
.link{background:#0f1115;border:1px solid #2a3140;border-radius:10px;padding:12px;font-family:ui-monospace,monospace;font-size:.82rem;word-break:break-all;margin:12px 0;color:#9ec5ff}
a{color:#7fb0ff}
</style></head><body>
<div class="barra">
 <div><b>✅ Seu site está pronto!</b><small>${site.config.nome} — veja abaixo e aprove</small></div>
 <div class="botoes">
  <button class="bt sec" onclick="painel('qr')">📱 QR code</button>
  <button class="bt aj" onclick="painel('ajustar')">✏️ Quero ajustar</button>
  <button class="bt ok" onclick="aprovar()">👍 Gostei, pode publicar</button>
 </div>
</div>
<iframe src="/s/${site.slug}" title="Prévia do site"></iframe>

<div class="painel" id="p_qr"><div class="cartao" style="max-width:340px;text-align:center">
 <h2>📱 Mostre no seu celular</h2>
 <p style="color:#8b98a5;font-size:.86rem;margin-bottom:14px">Aponte a câmera para o QR code:</p>
 <div class="qr"><div id="qrcode"></div></div>
 <div class="link" id="qrlink"></div>
 <button class="bt sec" style="width:100%" onclick="fecharPainel()">Fechar</button>
</div></div>

<div class="painel" id="p_ajustar"><div class="cartao">
 <h2>✏️ O que você quer mudar?</h2>
 <div class="ajs">
  <div class="aj"><b>Slogan / frase</b><input id="a_slogan" value="${site.config.slogan || ''}"></div>
  <div class="aj"><b>Cor</b><div class="chips" id="a_cores">${Object.entries(require('./sitegen.js').PALETAS).map(([k, v]) => `<div class="chip${site.config.paleta === k ? ' on' : ''}" data-c="${k}" style="background:linear-gradient(135deg,${v.p},${v.a})">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>`).join('')}</div></div>
  <div class="tog${site.config.mostrarPrecos === false ? '' : ' on'}" id="a_precos" onclick="this.classList.toggle('on')"><span>Mostrar preços</span><div class="sw"></div></div>
  <div class="tog${site.config.promoTexto ? ' on' : ''}" id="a_promo" onclick="this.classList.toggle('on')"><span>Faixa de promoção</span><div class="sw"></div></div>
  <div class="aj"><b>Texto da promoção</b><input id="a_promotxt" value="${site.config.promoTexto || ''}" placeholder="Ex.: 10% OFF na primeira compra"></div>
  <div class="aj"><b>Horário (seg a sex)</b><input id="a_hsemana" value="${(site.config.horarios || []).find(h => /semana|a sext/i.test(h.dia))?.hora || ''}" placeholder="Ex.: 08:00 - 18:00"></div>
 </div>
 <div class="botoes" style="justify-content:flex-end">
  <button class="bt sec" onclick="fecharPainel()">Cancelar</button>
  <button class="bt aj" onclick="salvarAjustes()">💾 Salvar ajustes</button>
 </div>
</div></div>

<div class="painel" id="p_fim"><div class="cartao fim">
 <div class="ico">🎉</div>
 <h2>Aprovado!</h2>
 <p>Obrigado! Seu site fica no ar neste endereço:</p>
 <div class="link">${url}</div>
 <p>Já pode divulgar no WhatsApp, Instagram e onde quiser.<br>Qualquer mudança, fale com o Nataniel.</p>
 <button class="bt sec" onclick="fecharPainel()">Ver o site</button>
</div></div>

<script>
var SITE_URL = ${JSON.stringify(url)};
function painel(n){ document.querySelectorAll('.painel').forEach(p=>p.classList.remove('on')); document.getElementById('p_'+n).classList.add('on');
 if(n==='qr'){ document.getElementById('qrlink').textContent = SITE_URL;
  var el=document.getElementById('qrcode'); el.innerHTML='';
  try{ var q=qrcode(0,'M'); q.addData(SITE_URL); q.make(); el.innerHTML=q.createSvgTag({scalable:true}); }catch(e){ el.textContent='(sem QR)'; } } }
function fecharPainel(){ document.querySelectorAll('.painel').forEach(p=>p.classList.remove('on')); }
document.getElementById('a_cores').querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
 document.getElementById('a_cores').querySelectorAll('.chip').forEach(x=>x.classList.remove('on')); c.classList.add('on'); });
async function salvarAjustes(){
 var ajustes={ slogan:document.getElementById('a_slogan').value,
  cor:document.querySelector('#a_cores .chip.on')?.dataset.c,
  precos:document.getElementById('a_precos').classList.contains('on'),
  promo:document.getElementById('a_promo').classList.contains('on'),
  promotxt:document.getElementById('a_promotxt').value,
  hsemana:document.getElementById('a_hsemana').value };
 var r=await fetch('/api/aprovar/${site.slug}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ajustes})});
 var j=await r.json();
 if(!r.ok) return alert(j.erro||'Erro ao salvar.');
 location.reload();
}
async function aprovar(){
 var r=await fetch('/api/aprovar/${site.slug}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao:'gostei'})});
 var j=await r.json();
 if(!r.ok) return alert(j.erro||'Erro.');
 document.getElementById('p_fim').classList.add('on');
}
</script>
</body></html>`;

/* ---------------- página de edição rápida do cliente (/editar/:slug) ---------------- */
const PAGINA_EDITAR = (site) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Editar site — ${site.config.nome}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0f1115;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:18px}
.cartao{background:#161a22;border:1px solid #2a3140;border-radius:16px;padding:28px;width:100%;max-width:430px}
h1{font-size:1.2rem;margin-bottom:4px}
p{color:#8b98a5;font-size:.86rem;margin-bottom:20px}
label{display:block;font-size:.84rem;font-weight:700;color:#cbd5e1;margin:14px 0 6px}
input{width:100%;padding:12px;border-radius:10px;border:1px solid #333d4d;background:#0f1115;color:#eee;font:inherit;font-size:.95rem}
.bt{width:100%;margin-top:22px;border:0;border-radius:10px;padding:14px;font:inherit;font-weight:700;font-size:1rem;background:#4f8cff;color:#fff;cursor:pointer}
.ok{background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;border-radius:10px;padding:12px;font-size:.9rem;margin-top:16px;text-align:center;display:none}
a.voltar{display:inline-block;margin-top:14px;color:#7fb0ff;font-size:.86rem}
</style></head><body>
<form class="cartao" onsubmit="salvar(event)">
 <h1>🛠️ Ajustes rápidos</h1>
 <p>Mude horário, promoção ou WhatsApp sem chamar ninguém. O site é atualizado na hora.</p>
 <label>WhatsApp</label><input id="e_whatsapp" value="${site.config.whatsapp || ''}" placeholder="(66) 99999-9999">
 <label>Horário — segunda a sexta</label><input id="e_hsemana" value="${(site.config.horarios || []).find(h => /semana|a sext/i.test(h.dia))?.hora || ''}" placeholder="08:00 - 18:00">
 <label>Sábado e domingo</label><input id="e_hfds" value="${(site.config.horarios || []).filter(h => /s[aá]bado|domingo/i.test(h.dia)).map(h => h.dia + ' ' + h.hora).join(' · ')}" placeholder="Sábado 08:00 - 12:00 · Domingo fechado">
 <label>Promoção (faixa no topo)</label><input id="e_promo" value="${site.config.promoTexto || ''}" placeholder="Ex.: 10% OFF na primeira compra">
 <button class="bt" type="submit">💾 Salvar e atualizar o site</button>
 <div class="ok" id="ok">✅ Atualizado! As mudanças já estão no ar.</div>
 <a class="voltar" href="/s/${site.slug}">← ver meu site</a>
</form>
<script>
async function salvar(e){
 e.preventDefault();
 var r=await fetch('/api/editar/${site.slug}',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({whatsapp:document.getElementById('e_whatsapp').value,
   hsemana:document.getElementById('e_hsemana').value,
   hfds:document.getElementById('e_hfds').value,
   promo:document.getElementById('e_promo').value})});
 var j=await r.json();
 if(!r.ok) return alert(j.erro||'Erro ao salvar.');
 document.getElementById('ok').style.display='block';
}
</script>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    /* ---- login (só existe de verdade se LEADSITE_SENHA estiver definida) ---- */
    if (p === '/login' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGINA_LOGIN(false));
    }
    if (p === '/login' && req.method === 'POST') {
      const raw = await new Promise(ok => { let d = ''; req.on('data', c => d += c); req.on('end', () => ok(d)); });
      const params = new URLSearchParams(raw);
      if (SENHA && params.get('senha') === SENHA) {
        const t = novoToken(); sessoes.add(t);
        res.writeHead(302, { 'Location': '/', 'Set-Cookie': `leadsite_sessao=${t}; HttpOnly; Path=/; Max-Age=2592000` });
        return res.end();
      }
      res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGINA_LOGIN(true));
    }
    if (p === '/logout') {
      const t = cookies(req).leadsite_sessao; if (t) sessoes.delete(t);
      res.writeHead(302, { 'Location': '/login', 'Set-Cookie': 'leadsite_sessao=; Path=/; Max-Age=0' });
      return res.end();
    }

    /* ---- páginas/rotas internas do CRM exigem login quando LEADSITE_SENHA está definida ----
       Formulário do cliente, sites publicados e a API pública do briefing NUNCA exigem login.
       /api/config em modo leitura (GET) também é público: o formulário do cliente usa isso
       pra saber seu nome — só a escrita (POST) exige login. */
    const publico = p === '/formulario' || p === '/brief' || p.startsWith('/s/') ||
      p.startsWith('/ver/') || p.startsWith('/editar/') || p.startsWith('/fotos/') ||
      p.startsWith('/api/lead-publico/') || p === '/api/brief' || p.startsWith('/api/aprovar/') ||
      p.startsWith('/api/editar/') || p === '/api/fotos' ||
      (p === '/api/config' && req.method === 'GET') ||
      p === '/style.css' || p === '/perfis.js' || p === '/brief.html' || p === '/brief-schema.js' ||
      p === '/qrcode.js';
    if (SENHA && !publico && !autenticado(req)) {
      if (p.startsWith('/api/')) return json(res, 401, { erro: 'Login necessário.' });
      res.writeHead(302, { 'Location': '/login' });
      return res.end();
    }

    /* ---- API ---- */
    if (p === '/api/categorias') {
      return json(res, 200, Object.keys(CATEGORIAS));
    }

    /* ---- upload de foto (recebe data URI, devolve URL pública) ---- */
    if (p === '/api/fotos' && req.method === 'POST') {
      const b = await corpo(req);
      try {
        if (Array.isArray(b.fotos)) return json(res, 200, { fotos: b.fotos.map(f => salvarDataURI(f)) });
        return json(res, 200, salvarDataURI(b.foto));
      } catch (e) { return json(res, 400, { erro: e.message }); }
    }

    /* ---- configurações (seu nome/preço nos modelos de mensagem) ---- */
    if (p === '/api/config' && req.method === 'GET') {
      const db = lerDB();
      return json(res, 200, { meuNome: 'Nataniel', meuPreco: 'R$ 97', ...(db.config || {}) });
    }
    if (p === '/api/config' && req.method === 'POST') {
      const b = await corpo(req);
      const db = lerDB();
      db.config = { ...(db.config || {}), ...(b.meuNome !== undefined ? { meuNome: String(b.meuNome).slice(0, 60) } : {}),
        ...(b.meuPreco !== undefined ? { meuPreco: String(b.meuPreco).slice(0, 30) } : {}) };
      salvarDB(db);
      return json(res, 200, db.config);
    }

    if (p === '/api/prospectar' && req.method === 'POST') {
      const ip = req.socket.remoteAddress || 'desconhecido';
      if (limiteExcedido(ip, 10 * 60 * 1000, 20)) {
        return json(res, 429, { erro: 'Muitas buscas em pouco tempo. Aguarde alguns minutos e tente de novo.' });
      }
      const b = await corpo(req);
      if (!b.cidade) return json(res, 400, { erro: 'Informe a cidade.' });
      const fonte = fonteDaProspeccao(b.fonte);
      console.log(`[prospeccao:${fonte}] ${b.cidade} | cats: ${(b.categorias||[]).join(',') || 'todas'}`);
      const r = await prospectar({ ...b, fonte });
      console.log(`[prospeccao:${fonte}] ${r.total} encontradas, ${r.semSite} sem site` +
        (r.confirmados !== undefined ? `, ${r.confirmados} confirmadas no Maps` : ''));
      return json(res, 200, r);
    }

    /* Ficha completa de UMA empresa, feita pela IA. Gasta uma chamada, então é
       um botão explícito no app — nunca roda em lote sozinho. */
    if (p === '/api/dossie' && req.method === 'POST') {
      const ip = req.socket.remoteAddress || 'desconhecido';
      if (limiteExcedido(ip, 10 * 60 * 1000, 30)) {
        return json(res, 429, { erro: 'Muitas investigações em pouco tempo. Aguarde alguns minutos.' });
      }
      if (!geminiPronto()) {
        return json(res, 503, { erro: 'Busca com IA desligada: defina GEMINI_API_KEY ao subir o servidor.' });
      }
      const b = await corpo(req);
      if (!b.empresa || !b.empresa.nome) return json(res, 400, { erro: 'Informe a empresa.' });
      console.log(`[dossie] ${b.empresa.nome} (${b.empresa.cidade || 'sem cidade'})`);
      const d = await dossieEmpresa(b.empresa);
      return json(res, 200, d);
    }

    /* Diz ao app de computador o que o servidor consegue fazer agora — é o que
       ele usa pra mostrar ou esconder os botões de IA. */
    if (p === '/api/fontes' && req.method === 'GET') {
      return json(res, 200, {
        padrao: fonteDaProspeccao(null),
        gemini: geminiPronto(),
        modelo: geminiModeloOk || GEMINI_MODELOS[0],
      });
    }

    if (p === '/api/leads' && req.method === 'GET') {
      return json(res, 200, lerDB().leads);
    }

    if (p === '/api/leads' && req.method === 'POST') {
      const b = await corpo(req);
      const db = lerDB();
      const existentes = new Set(db.leads.map(l => l.osmId));
      let novos = 0;
      for (const e of (b.empresas || [])) {
        if (existentes.has(e.osmId)) continue;
        db.leads.push({
          ...e, id: uid(), status: 'novo', notas: '',
          criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
          historico: [{ data: new Date().toISOString(), texto: 'Lead capturado na prospecção' }],
        });
        existentes.add(e.osmId); novos++;
      }
      salvarDB(db);
      return json(res, 200, { salvos: novos, duplicados: (b.empresas || []).length - novos, total: db.leads.length });
    }

    if (p.startsWith('/api/leads/') && (req.method === 'PATCH' || req.method === 'DELETE')) {
      const id = p.split('/')[3];
      const db = lerDB();
      const i = db.leads.findIndex(l => l.id === id);
      if (i < 0) return json(res, 404, { erro: 'Lead não encontrado' });
      if (req.method === 'DELETE') {
        db.leads.splice(i, 1); salvarDB(db);
        return json(res, 200, { ok: true });
      }
      const b = await corpo(req);
      const antes = db.leads[i].status;
      Object.assign(db.leads[i], b, { atualizadoEm: new Date().toISOString() });
      if (b.status && b.status !== antes) {
        db.leads[i].historico = db.leads[i].historico || [];
        db.leads[i].historico.push({ data: new Date().toISOString(), texto: `Status: ${antes} → ${b.status}` });
      }
      if (b.novaInteracao) {
        db.leads[i].historico = db.leads[i].historico || [];
        db.leads[i].historico.push({ data: new Date().toISOString(), texto: b.novaInteracao });
        delete db.leads[i].novaInteracao;
      }
      salvarDB(db);
      return json(res, 200, db.leads[i]);
    }

    if (p === '/api/sites' && req.method === 'GET') {
      return json(res, 200, lerDB().sites.map(s => ({ id: s.id, slug: s.slug, nome: s.config.nome, criadoEm: s.criadoEm })));
    }

    if (p === '/api/sites' && req.method === 'POST') {
      const b = await corpo(req);
      limparFotosDoConfig(b.config || {});
      const db = lerDB();
      const base = (b.config?.nome || 'site').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'site';
      let slug = base, n = 1;
      while (db.sites.some(s => s.slug === slug && s.leadId !== b.leadId)) slug = base + '-' + (++n);
      const existente = db.sites.findIndex(s => b.leadId && s.leadId === b.leadId);
      const reg = { id: existente >= 0 ? db.sites[existente].id : uid(), slug, leadId: b.leadId || null,
        config: b.config, criadoEm: new Date().toISOString() };
      if (existente >= 0) db.sites[existente] = reg; else db.sites.push(reg);
      if (b.leadId) {
        const l = db.leads.find(x => x.id === b.leadId);
        if (l) { l.siteSlug = slug; l.atualizadoEm = new Date().toISOString(); }
      }
      salvarDB(db);
      return json(res, 200, { ok: true, slug, url: '/s/' + slug, ver: '/ver/' + slug, editar: '/editar/' + slug });
    }

    if (p.startsWith('/api/sites/') && req.method === 'DELETE') {
      const id = p.split('/')[3];
      const db = lerDB();
      db.sites = db.sites.filter(s => s.id !== id);
      salvarDB(db);
      return json(res, 200, { ok: true });
    }


    /* ---- questionário do cliente ---- */
    if (p === '/formulario' || p === '/brief') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(ROOT, 'public', 'brief.html')));
    }

    if (p.startsWith('/api/lead-publico/')) {
      const id = decodeURIComponent(p.split('/')[3] || '');
      const l = lerDB().leads.find(x => x.id === id);
      if (!l) return json(res, 404, { erro: 'não encontrado' });
      const Perfis = require('./public/perfis.js');
      return json(res, 200, {                       // só o necessário, nada sensível
        nome: l.nome, telefone: l.telefone, email: l.email,
        bairro: l.bairro, cidade: l.cidade,
        segmento: Perfis.paraCategoria(l.categoria),
      });
    }

    if (p === '/api/brief' && req.method === 'POST') {
      const b = await corpo(req);
      const r = b.respostas || {};
      if (!r.nome) return json(res, 400, { erro: 'Nome da empresa é obrigatório.' });

      const cfg = Brief.briefParaConfig(r);
      limparFotosDoConfig(cfg);   // fotos enviadas viram arquivos servidos (HTML leve)
      const db = lerDB();

      /* slug a partir do nome da empresa */
      const base = String(cfg.nome).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'site';
      let slug = base, n = 1;
      while (db.sites.some(s => s.slug === slug && s.leadId !== b.leadId)) slug = base + '-' + (++n);

      const idx = db.sites.findIndex(s => b.leadId && s.leadId === b.leadId);
      const reg = { id: idx >= 0 ? db.sites[idx].id : uid(), slug, leadId: b.leadId || null,
        config: cfg, brief: r, criadoEm: new Date().toISOString() };
      if (idx >= 0) db.sites[idx] = reg; else db.sites.push(reg);

      /* atualiza o lead automaticamente */
      const l = db.leads.find(x => x.id === b.leadId);
      if (l) {
        l.siteSlug = slug;
        l.brief = r;
        l.briefEm = new Date().toISOString();
        l.status = r.fechar === 'sim' ? 'fechado' : (l.status === 'novo' || l.status === 'contatado' ? 'negociando' : l.status);
        if (r.whatsapp && !l.telefone) l.telefone = r.whatsapp;
        if (r.email && !l.email) l.email = r.email;
        l.atualizadoEm = new Date().toISOString();
        l.historico = l.historico || [];
        l.historico.push({ data: new Date().toISOString(),
          texto: r.fechar === 'sim' ? '🎉 Formulário respondido — CLIENTE QUER FECHAR' : '📋 Formulário respondido — site gerado' });
      } else if (!b.leadId) {
        /* respondeu sem link de lead: entra como lead novo no CRM */
        const novoLead = { id: uid(), osmId: 'brief/' + slug, nome: cfg.nome,
          categoria: cfg.perfil || 'outro', telefone: r.whatsapp || null, email: r.email || null,
          endereco: cfg.endereco || null, bairro: r.bairro || null, cidade: r.cidade || null,
          site: null, temSite: false, redes: {}, temRedeSocial: false, score: 100,
          mapa: '', status: r.fechar === 'sim' ? 'fechado' : 'negociando',
          notas: '', siteSlug: slug, brief: r, briefEm: new Date().toISOString(),
          criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
          historico: [{ data: new Date().toISOString(), texto: '📋 Chegou pelo formulário público' }] };
        db.leads.push(novoLead);
        reg.leadId = novoLead.id;
      }

      salvarDB(db);
      console.log(`[briefing] ${cfg.nome} | fechar=${r.fechar} | site=/s/${slug}`);
      return json(res, 200, { ok: true, slug, url: '/s/' + slug, ver: '/ver/' + slug, editar: '/editar/' + slug });
    }

    /* ---- fotos salvas e banco ilustrativo ---- */
    if (p.startsWith('/fotos/banco/')) {
      const arq = path.basename(p);
      const full = path.join(ROOT, 'public', 'fotos', 'banco', arq);
      if (fs.existsSync(full)) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
        return res.end(fs.readFileSync(full));
      }
      res.writeHead(404); return res.end('404');
    }
    if (p.startsWith('/fotos/')) {
      const arq = path.basename(p);
      const full = path.join(DIR_FOTOS, arq);
      if (/^[a-z0-9]+\.(jpg|jpeg|png|webp)$/i.test(arq) && fs.existsSync(full)) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
        return res.end(fs.readFileSync(full));
      }
      res.writeHead(404); return res.end('404');
    }

    /* ---- página de aprovação do cliente ---- */
    if (p.startsWith('/ver/')) {
      const slug = decodeURIComponent(p.slice(5).replace(/\/$/, ''));
      const site = lerDB().sites.find(s => s.slug === slug);
      if (!site) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<h1>Site não encontrado</h1>'); }
      const url = (req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http') + '://' + (req.headers.host || 'localhost') + '/s/' + slug;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGINA_VER(site, url));
    }

    /* ---- ajustes do cliente na página de aprovação ---- */
    if (p.startsWith('/api/aprovar/') && req.method === 'POST') {
      const slug = decodeURIComponent(p.split('/')[3] || '');
      const b = await corpo(req);
      const db = lerDB();
      const i = db.sites.findIndex(s => s.slug === slug);
      if (i < 0) return json(res, 404, { erro: 'Site não encontrado' });
      const site = db.sites[i];
      const cfg = site.config || {};
      if (b.acao === 'gostei') {
        site.aprovado = true; site.aprovadoEm = new Date().toISOString();
        const l = site.leadId ? db.leads.find(x => x.id === site.leadId) : null;
        if (l) {
          if (l.status !== 'fechado') l.status = 'fechado';
          l.historico = l.historico || [];
          l.historico.push({ data: new Date().toISOString(), texto: '✅ Cliente aprovou o site na página /ver' });
          l.atualizadoEm = new Date().toISOString();
        }
        salvarDB(db);
        return json(res, 200, { ok: true });
      }
      const a = b.ajustes || {};
      if (typeof a.slogan === 'string' && a.slogan.trim()) cfg.slogan = a.slogan.trim().slice(0, 120);
      if (a.cor && SiteGen.PALETAS[a.cor]) cfg.paleta = a.cor;
      if (typeof a.precos === 'boolean') cfg.mostrarPrecos = a.precos;
      if (typeof a.promo === 'boolean') cfg.promoTexto = a.promo ? String(a.promotxt || cfg.promoTexto || 'Promoção especial').slice(0, 90) : '';
      if (typeof a.promotxt === 'string' && a.promo !== false && a.promotxt.trim()) cfg.promoTexto = a.promotxt.trim().slice(0, 90);
      if (typeof a.hsemana === 'string' && a.hsemana.trim()) {
        cfg.horarios = cfg.horarios || [];
        const idx = cfg.horarios.findIndex(h => /semana|a sext/i.test(h.dia));
        const reg = { dia: 'Segunda a Sexta', hora: a.hsemana.trim().slice(0, 40) };
        if (idx >= 0) cfg.horarios[idx] = reg; else cfg.horarios.unshift(reg);
      }
      site.atualizadoEm = new Date().toISOString();
      salvarDB(db);
      console.log(`[aprovação] ${cfg.nome} — ajustes aplicados`);
      return json(res, 200, { ok: true, url: '/s/' + slug });
    }

    /* ---- página de edição rápida (pós-venda) ---- */
    if (p.startsWith('/editar/')) {
      const slug = decodeURIComponent(p.slice(8).replace(/\/$/, ''));
      const site = lerDB().sites.find(s => s.slug === slug);
      if (!site) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<h1>Site não encontrado</h1>'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGINA_EDITAR(site));
    }
    if (p.startsWith('/api/editar/') && req.method === 'POST') {
      const slug = decodeURIComponent(p.split('/')[3] || '');
      const b = await corpo(req);
      const db = lerDB();
      const i = db.sites.findIndex(s => s.slug === slug);
      if (i < 0) return json(res, 404, { erro: 'Site não encontrado' });
      const cfg = db.sites[i].config || {};
      if (typeof b.whatsapp === 'string' && b.whatsapp.trim()) cfg.whatsapp = b.whatsapp.trim().slice(0, 25);
      const hs = [];
      if (typeof b.hsemana === 'string' && b.hsemana.trim()) hs.push({ dia: 'Segunda a Sexta', hora: b.hsemana.trim().slice(0, 40) });
      if (typeof b.hfds === 'string' && b.hfds.trim()) {
        const partes = b.hfds.split(/[;·•]/);
        for (const pt of partes) {
          const m = pt.match(/^\s*(s[aá]bado|domingo)\s*[-:]?\s*(.+)$/i);
          if (m) hs.push({ dia: m[1].charAt(0).toUpperCase() + m[1].slice(1), hora: m[2].trim().slice(0, 40) });
        }
      }
      if (hs.length) cfg.horarios = hs;
      cfg.promoTexto = typeof b.promo === 'string' ? b.promo.trim().slice(0, 90) : cfg.promoTexto;
      db.sites[i].atualizadoEm = new Date().toISOString();
      salvarDB(db);
      console.log(`[edição] ${cfg.nome} — horário/promo/whats atualizados`);
      return json(res, 200, { ok: true, url: '/s/' + slug });
    }

    /* ---- sites publicados ---- */
    if (p.startsWith('/s/')) {
      const slug = decodeURIComponent(p.slice(3).replace(/\/$/, ''));
      const site = lerDB().sites.find(s => s.slug === slug);
      if (!site) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<h1>Site não encontrado</h1>'); }
      const html = SiteGen.gerar(site.config);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    /* ---- arquivos estáticos ---- */
    let arq = p === '/' ? '/index.html' : p;
    if (arq === '/sitegen.js' || arq === '/brief-schema.js') {
      res.writeHead(200, { 'Content-Type': MIME['.js'] });
      return res.end(fs.readFileSync(path.join(ROOT, arq.slice(1))));
    }

    /* As páginas HTML que moram na RAIZ do projeto (previa.html,
       previa-formulario.html e as demos) não eram encontradas: o código só
       olhava dentro de public/ e devolvia 404. A exceção é /index.html, que
       continua sendo o app de 3 abas do public/ — o app de celular fica em
       /celular.html. */
    if (/\.html?$/i.test(arq) && arq !== '/index.html') {
      const raiz = path.join(ROOT, path.normalize(arq).replace(/^(\.\.[/\\])+/, ''));
      if (fs.existsSync(raiz) && fs.statSync(raiz).isFile()) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          /* sem cache: o celular guarda a versão antiga e você fica olhando um
             app quebrado que já foi consertado. */
          'Cache-Control': 'no-store, must-revalidate',
        });
        return res.end(fs.readFileSync(raiz));
      }
    }

    const full = path.join(ROOT, 'public', path.normalize(arq).replace(/^(\.\.[/\\])+/, ''));
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      const ext = path.extname(full);
      /* .js/.css do app sem cache: depois de uma correção, o celular pega a
         versão nova na hora em vez de esperar o cache vencer. */
      const semCache = ext === '.js' || ext === '.css' || ext === '.html';
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': semCache ? 'no-store, must-revalidate' : 'public, max-age=86400',
      });
      return res.end(fs.readFileSync(full));
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');

  } catch (e) {
    console.error('[erro]', e.message);
    json(res, 500, { erro: e.message });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log('LeadSite rodando na porta ' + PORT));
