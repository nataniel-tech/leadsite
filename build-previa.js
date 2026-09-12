/* Gera previa.html — versão standalone da app, sem servidor, com dados reais embutidos */
const fs = require('fs');
const path = require('path');
const R = __dirname;

const css = fs.readFileSync(path.join(R, 'public/style.css'), 'utf8');
const sitegen = fs.readFileSync(path.join(R, 'sitegen.js'), 'utf8');
const perfis = fs.readFileSync(path.join(R, 'public/perfis.js'), 'utf8');
const briefSchema = fs.readFileSync(path.join(R, 'brief-schema.js'), 'utf8');
let briefHtml = fs.readFileSync(path.join(R, 'public/brief.html'), 'utf8');
let appjs = fs.readFileSync(path.join(R, 'public/app.js'), 'utf8');
let html = fs.readFileSync(path.join(R, 'public/index.html'), 'utf8');
/* dataset de demonstração — fica no projeto para o build nunca depender de /tmp */
const CACHE = path.join(R, 'data', 'prospeccao-demo.json');
if (!fs.existsSync(CACHE)) {
  console.error('\n✗ Falta o arquivo data/prospeccao-demo.json');
  console.error('  Rode o servidor e execute:');
  console.error('  curl -s -X POST localhost:3000/api/prospectar -H "Content-Type: application/json" \\');
  console.error('    -d \'{"cidade":"Rondonópolis, Mato Grosso, Brasil","raioKm":6,"limite":230}\' \\');
  console.error('    -o data/prospeccao-demo.json\n');
  process.exit(1);
}
const dados = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

/* ---- mapeia cada empresa aos grupos de categoria (feito no build) ---- */
const CATEGORIAS = {
  restaurante:['restaurant','fast_food'], lanchonete:['fast_food','ice_cream'],
  cafe_bar:['cafe','bar','pub'], padaria:['bakery','pastry','confectionery'],
  mercado:['supermarket','convenience','greengrocer','butcher','grocery'],
  salao_beleza:['hairdresser','beauty','massage','tattoo'],
  academia:['fitness_centre','sports_centre','gym'],
  oficina:['car_repair','tyres','motorcycle_repair','car_parts'],
  autopecas:['car_parts','car','motorcycle'],
  clinica:['clinic','doctors','dentist','veterinary'],
  farmacia:['pharmacy','chemist'], petshop:['pet','pet_grooming','veterinary'],
  loja_roupas:['clothes','shoes','boutique','fashion_accessories','jewelry'],
  construcao:['hardware','doityourself','paint','trade','building_materials','electrical'],
  moveis:['furniture','interior_decoration','houseware','bed'],
  eletronicos:['electronics','computer','mobile_phone','hifi'],
  hotel:['hotel','guest_house','motel','hostel','apartment'],
  escola:['school','language_school','driving_school','college','kindergarten'],
  advocacia:['lawyer','accountant','insurance','estate_agent','financial','company'],
  imobiliaria:['estate_agent'], papelaria:['stationery','copyshop','books','printing'],
  floricultura:['florist','garden_centre'], lavanderia:['laundry','dry_cleaning'],
  otica:['optician','hearing_aids'],
};

const empresas = dados.empresas.map(e => {
  const g = Object.entries(CATEGORIAS).filter(([, vs]) => vs.includes(e.categoria)).map(([k]) => k);
  return { ...e, grupos: g.length ? g : ['outros'] };
});

/* ---- leads pré-carregados para o CRM não abrir vazio ---- */
const sts = ['contatado','negociando','novo','fechado','novo','contatado','negociando','perdido'];
const seed = empresas.filter(e => !e.temSite).slice(0, 8).map((e, i) => ({
  ...e, id: 'seed' + i, status: sts[i], notas: i === 1 ? 'Pediu para retornar na quinta de manhã.' : '',
  criadoEm: new Date(Date.now() - (9 - i) * 864e5).toISOString(),
  atualizadoEm: new Date().toISOString(),
  historico: [
    { data: new Date(Date.now() - (9 - i) * 864e5).toISOString(), texto: 'Lead capturado na prospecção' },
    ...(sts[i] !== 'novo' ? [{ data: new Date(Date.now() - 2 * 864e5).toISOString(), texto: 'Mensagem enviada' }] : []),
  ],
}));

/* ---- shim: troca a chamada de rede por um mock local ---- */
const shim = `
/* ===== MODO PRÉVIA: sem servidor, dados reais embutidos ===== */
const DEMO = ${JSON.stringify({ local: dados.local, empresas })};
const SEED = ${JSON.stringify(seed)};
const CATS_LISTA = ${JSON.stringify([...Object.keys(CATEGORIAS), 'outros'])};

let _mem = null;
const _ler = () => { try { const v = localStorage.getItem('ls_leads'); if (v) return JSON.parse(v); } catch(e){} return _mem || (_mem = JSON.parse(JSON.stringify(SEED))); };
const _grav = v => { _mem = v; try { localStorage.setItem('ls_leads', JSON.stringify(v)); } catch(e){} };
const _uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const _slug = s => String(s||'site').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const api = async (url, opts = {}) => {
  const met = opts.method || 'GET';
  const b = opts.body ? JSON.parse(opts.body) : {};
  await new Promise(r => setTimeout(r, 420));   // simula latência da rede

  if (url === '/api/categorias') return CATS_LISTA;

  if (url === '/api/prospectar') {
    let e = DEMO.empresas.slice();
    if (b.categorias && b.categorias.length) {
      const s = new Set(b.categorias);
      e = e.filter(x => x.grupos.some(g => s.has(g)));
    }
    if (b.apenasSemSite)   e = e.filter(x => !x.temSite);
    if (b.exigirTelefone)  e = e.filter(x => x.telefone);
    if (b.raioKm) {
      const R = 6371, rad = d => d * Math.PI / 180;
      e = e.filter(x => {
        const dLat = rad(x.lat - DEMO.local.lat), dLon = rad(x.lon - DEMO.local.lon);
        const a = Math.sin(dLat/2)**2 + Math.cos(rad(DEMO.local.lat)) * Math.cos(rad(x.lat)) * Math.sin(dLon/2)**2;
        return 2 * R * Math.asin(Math.sqrt(a)) <= b.raioKm;
      });
    }
    return { local: DEMO.local, total: e.length,
      semSite: e.filter(x => !x.temSite).length, comSite: e.filter(x => x.temSite).length,
      empresas: e.slice(0, b.limite || 120) };
  }

  if (url === '/api/leads' && met === 'GET') return _ler();

  if (url === '/api/leads' && met === 'POST') {
    const db = _ler(), ex = new Set(db.map(l => l.osmId));
    let n = 0;
    for (const e of (b.empresas || [])) {
      if (ex.has(e.osmId)) continue;
      db.push({ ...e, id: _uid(), status:'novo', notas:'', criadoEm:new Date().toISOString(),
        atualizadoEm:new Date().toISOString(),
        historico:[{ data:new Date().toISOString(), texto:'Lead capturado na prospecção' }] });
      ex.add(e.osmId); n++;
    }
    _grav(db);
    return { salvos:n, duplicados:(b.empresas||[]).length - n, total: db.length };
  }

  if (url.startsWith('/api/leads/')) {
    const id = url.split('/')[3], db = _ler(), i = db.findIndex(l => l.id === id);
    if (i < 0) throw new Error('Lead não encontrado');
    if (met === 'DELETE') { db.splice(i,1); _grav(db); return { ok:true }; }
    const antes = db[i].status;
    Object.assign(db[i], b, { atualizadoEm: new Date().toISOString() });
    db[i].historico = db[i].historico || [];
    if (b.status && b.status !== antes) db[i].historico.push({ data:new Date().toISOString(), texto:'Status: '+antes+' → '+b.status });
    if (b.novaInteracao) { db[i].historico.push({ data:new Date().toISOString(), texto:b.novaInteracao }); delete db[i].novaInteracao; }
    _grav(db);
    return db[i];
  }

  if (url === '/api/sites' && met === 'POST') {
    const s = _slug(b.config && b.config.nome);
    const db = _ler(), l = db.find(x => x.id === b.leadId);
    if (l) { l.siteSlug = s; _grav(db); }
    return { ok:true, slug:s, url:'/s/'+s };
  }
  if (url === '/api/sites') return [];
  return {};
};
`;

/* remove o api() original e injeta o mock */
appjs = appjs.replace(
  /const api = async \(url, opts\) => \{[\s\S]*?\n\};/,
  () => shim.trim()
);

/* aviso de publicação adaptado ao modo prévia */
appjs = appjs.replace(
  /\$\('#avisoPub'\)\.innerHTML = `<div class="msg carregando"[\s\S]*?<\/div>`;/,
  "$('#avisoPub').innerHTML = `<div class=\"msg carregando\" style=\"margin-top:12px\">🚀 Publicado! No sistema completo o site fica no ar em <b>seu-dominio.com/s/${r.slug}</b> — link pronto pra mandar no WhatsApp. Nesta prévia, use <b>Baixar HTML</b> para ver o arquivo final.</div>`;"
);

/* clipboard e window.open podem ser bloqueados dentro do iframe do visualizador */
appjs = appjs.replace(
  "$('#copiar').onclick = () => { navigator.clipboard.writeText($('#msgTexto').value); toast('Copiado!'); };",
  "$('#copiar').onclick = () => { try { navigator.clipboard.writeText($('#msgTexto').value); toast('Copiado!'); } catch(e) { $('#msgTexto').select(); toast('Selecionado — use Ctrl+C'); } };"
);
appjs = appjs.replace(/window\.open\(/g, 'abrirLink(');
appjs += `
function abrirLink(u, t) {
  try { const w = window.open(u, t || '_blank'); if (!w) throw 0; return w; }
  catch (e) { toast('Link bloqueado no preview — abra o app completo'); return { document:{ write(){}, close(){} } }; }
}
`;

/* CRÍTICO: sitegen/app contêm a string "</script>" dentro de templates.
   Se embutida crua, ela fecha a tag <script> da página e quebra tudo. */
const seguro = s => s.replace(/<\/script>/g, '<\\/script>');

/* faixa de aviso da prévia */
const faixa = `<div style="background:linear-gradient(90deg,#3b82f6,#a855f7);color:#fff;padding:9px 22px;font-size:.85rem;font-weight:600;text-align:center">
  🔎 PRÉVIA INTERATIVA — 230 empresas reais de Rondonópolis já carregadas. Clique nas 3 abas acima. Para busca ao vivo em qualquer cidade, rode <code style="background:rgba(0,0,0,.25);padding:2px 7px;border-radius:5px">node server.js</code>
</div>`;

html = html
  .replace('<link rel="stylesheet" href="/style.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="/sitegen.js"></script>', () => `<script>\n${seguro(sitegen)}\n</script>`)
  .replace('<script src="/perfis.js"></script>', () => `<script>\n${seguro(perfis)}\n</script>`)
  .replace('<script src="/brief-schema.js"></script>', () => `<script>\n${seguro(briefSchema)}\n</script>`)
  .replace('<script src="/app.js"></script>', () => `<script>\n${seguro(appjs)}\n</script>`)
  .replace('</header>', '</header>\n' + faixa)
  .replace('<title>LeadSite — Prospecção, CRM e Criação de Sites</title>',
           '<title>LeadSite — Prévia Interativa</title>');

fs.writeFileSync(path.join(R, 'previa.html'), html);
console.log('previa.html gerado:', (fs.statSync(path.join(R, 'previa.html')).size / 1024).toFixed(0) + ' KB');
console.log('empresas embutidas:', empresas.length, '| leads no CRM:', seed.length);

/* ═══════ previa-formulario.html — questionário standalone, sem servidor ═══════ */
const demoLead = empresas.find(e => !e.temSite && e.categoria === 'bakery')
              || empresas.find(e => !e.temSite);

briefHtml = briefHtml
  .replace('<script src="/sitegen.js"></script>', () => `<script>\n${seguro(sitegen)}\n</script>`)
  .replace('<script src="/perfis.js"></script>', () => `<script>\n${seguro(perfis)}\n</script>`)
  .replace('<script src="/brief-schema.js"></script>', () => `<script>\n${seguro(briefSchema)}\n</script>`);

/* sem rede: prefill direto e geração local do site */
briefHtml = briefHtml.replace(
  /const params = new URLSearchParams\(location\.search\);\nconst LEAD = params\.get\('lead'\);/,
  () => "const LEAD = 'demo';"
);
briefHtml = briefHtml.replace(
  /\/\/ pré-preenche com o que já sabemos do lead\nif \(LEAD\) fetch[\s\S]*?\.catch\(\(\)=>\{\}\);/,
  () => `/* MODO PRÉVIA: prefill embutido, sem rede */
const DEMO_LEAD = ${JSON.stringify({
    nome: demoLead.nome, telefone: demoLead.telefone, email: demoLead.email,
    bairro: demoLead.bairro, cidade: demoLead.cidade || 'Rondonópolis - MT',
    segmento: 'padaria',
  })};
setTimeout(() => {
  const l = DEMO_LEAD;
  R.nome = l.nome || ''; R.whatsapp = l.telefone || '';
  R.endereco = (l.bairro ? l.bairro + ' - ' : '') + (l.cidade || '');
  R.segmento = l.segmento; semearServicos(l.segmento);
  document.querySelector('#tTitulo').textContent = 'Briefing — ' + l.nome;
  desenhar();
}, 60);`
);
briefHtml = briefHtml.replace(
  /const r = await fetch\('\/api\/brief', \{\n[\s\S]*?\n      const j = await r\.json\(\);\n      if \(!r\.ok\) throw new Error[\s\S]*?\n      concluir\(j\);/,
  () => `const cfg = Brief.briefParaConfig(R, Perfis);
      const j = { html: SiteGen.gerar(cfg), url: '#', slug: '' };
      concluir(j);`
);
briefHtml = briefHtml
  .replace("const url = location.origin + j.url;",
           "const dom = String(R.dominio||'').trim().replace(/^https?:\\/\\//,'').replace(/\\/$/,'');\n  const url = 'https://' + (dom || String(R.nome||'seusite').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'') + '.com.br');")
  .replace('<iframe src="${esc(j.url)}" title="Seu site"></iframe>',
           '<iframe srcdoc="${esc(j.html)}" title="Seu site"></iframe>')
  .replace('<a class="bt pri" href="${esc(j.url)}" target="_blank" rel="noopener">↗ Abrir meu site</a>',
           '<button class="bt pri" onclick="try{const w=window.open();w.document.write(decodeURIComponent(this.dataset.h));w.document.close();}catch(e){alert(\'Abra o arquivo baixado para ver em tela cheia.\')}" data-h="${encodeURIComponent(j.html)}">↗ Abrir meu site em tela cheia</button>')
  .replace('<a class="bt" href="${esc(url)}" target="_blank" rel="noopener">📱 Ver página de aprovação</a>', '');

/* faixa de aviso */
briefHtml = briefHtml.replace('<div class="topo">', `<div style="background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff;padding:9px 18px;font-size:.82rem;font-weight:600;text-align:center;border-radius:11px;margin-bottom:20px">
  📝 PRÉVIA — este é o formulário que o cliente recebe. Preencha até o fim para ver o site sendo gerado.
</div>
<div class="topo">`);

fs.writeFileSync(path.join(R, 'previa-formulario.html'), briefHtml);
console.log('previa-formulario.html gerado:', (fs.statSync(path.join(R,'previa-formulario.html')).size/1024).toFixed(0)+' KB');
