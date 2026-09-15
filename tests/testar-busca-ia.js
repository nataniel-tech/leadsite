#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   testar-busca-ia.js — testa a busca com IA (Gemini + Google Maps)

   POR QUE ESTE ARQUIVO EXISTE
   ---------------------------
   A busca com IA tem três armadilhas que NÃO aparecem como erro: elas
   aparecem como uma lista bonita de empresas que não existem. Nenhum
   teste de sintaxe pega isso. Então aqui o Gemini é fingido com respostas
   copiadas do formato real da API (groundingMetadata incluído) e cada
   armadilha vira uma asserção:

     1. prompt em português → o Maps grounding é IGNORADO e o modelo inventa
     2. responseMimeType junto com grounding → a API recusa ou devolve vazio
     3. resposta cortada no meio → sem o plano B, perde-se a lista inteira

   Roda sem internet e sem gastar cota: nada aqui chama a API de verdade.

       node tests/testar-busca-ia.js
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const R = path.join(__dirname, '..');

let passou = 0, falhou = 0;
const chk = (ok, rotulo, detalhe) => {
  console.log(`  ${ok ? '✔' : '✘'} ${rotulo}${detalhe ? ' — ' + detalhe : ''}`);
  ok ? passou++ : falhou++;
};
const secao = t => console.log('\n  — ' + t + ' —');

/* ─────────── Google Maps de mentira ───────────
   placeId vem com o prefixo "places/" exatamente como a API devolve. */
const LUGARES = [
  { placeId: 'places/ChIJPadaria01', title: 'Padaria Pão Dourado', uri: 'https://maps.google.com/?cid=1001' },
  { placeId: 'places/ChIJPanific02', title: 'Panificadora Central', uri: 'https://maps.google.com/?cid=1002' },
  { placeId: 'places/ChIJSalao0003', title: 'Salão Bela Vida', uri: 'https://maps.google.com/?cid=1003' },
];

/* Resposta no formato real de generateContent com grounding. */
function respostaGemini(texto, lugares) {
  return {
    candidates: [{
      content: { role: 'model', parts: [{ text: texto }] },
      groundingMetadata: {
        groundingChunks: (lugares || []).map(m => ({ maps: m })),
        webSearchQueries: ['bakeries in Rondonopolis Mato Grosso Brazil'],
      },
    }],
  };
}

const GEOCODE = [{
  lat: '-16.4673', lon: '-54.6371',
  display_name: 'Rondonópolis, Microrregião de Rondonópolis, Mato Grosso, Região Centro-Oeste, Brasil',
  boundingbox: ['-16.60', '-16.33', '-54.78', '-54.50'],
  address: { state_code: 'MT', state: 'Mato Grosso', country_code: 'BR' },
}];

/* O que o app vai mandar pra API. Guardado pra inspecionar no teste. */
let ULTIMO_PEDIDO = null;
let PROXIMA_RESPOSTA = null;   /* cada teste troca isto */

async function fetchFingido(url, opcoes) {
  const u = String(url);
  const corpo = (resposta) => ({
    ok: true, status: 200,
    json: () => Promise.resolve(resposta),
    text: () => Promise.resolve(JSON.stringify(resposta)),
  });

  if (u.includes('nominatim.openstreetmap.org')) return corpo(GEOCODE);

  if (u.includes('generativelanguage.googleapis.com')) {
    ULTIMO_PEDIDO = { url: u, opcoes: opcoes || {}, corpo: JSON.parse(opcoes.body) };
    if (PROXIMA_RESPOSTA && PROXIMA_RESPOSTA.__erro) {
      return { ok: false, status: PROXIMA_RESPOSTA.status, json: () => Promise.resolve({}),
               text: () => Promise.resolve(JSON.stringify({ error: { message: PROXIMA_RESPOSTA.msg } })) };
    }
    return corpo(PROXIMA_RESPOSTA || respostaGemini('{"empresas":[]}', []));
  }

  /* qualquer outra coisa (analytics, foto, etc.): responde vazio e segue */
  return { ok: false, status: 404, json: () => Promise.resolve({}), text: () => Promise.resolve('') };
}

async function subirApp(JSDOM, VirtualConsole) {
  const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => erros.push((e.stack || e.message || '').split('\n')[0]));
  vc.on('error', (...a) => erros.push(a.map(String).join(' ')));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    url: 'https://example.test/celular.html',
    beforeParse(w) {
      w.fetch = fetchFingido;
      w.scrollTo = () => {};
      w.addEventListener('error', e => erros.push((e.error && e.error.message) || e.message));
    },
  });
  await new Promise(r => setTimeout(r, 1200));
  return { window: dom.window, doc: dom.window.document, erros };
}

(async () => {
  let JSDOM, VirtualConsole;
  try {
    ({ JSDOM, VirtualConsole } = require('jsdom'));
  } catch (e) {
    console.error('Estes testes precisam do jsdom. Instale uma vez com:\n\n    npm i --no-save jsdom\n');
    process.exit(2);
  }

  console.log('Testando a busca com IA (Gemini + Google Maps)…');
  const { window: w, erros } = await subirApp(JSDOM, VirtualConsole);

  secao('o app sobe limpo');
  chk(erros.length === 0, 'nenhum erro de JavaScript na inicialização', erros.slice(0, 3).join(' | '));
  chk(typeof w.buscarGeminiEm === 'function', 'buscarGeminiEm existe no escopo global');
  chk(typeof w.investigar === 'function', 'investigar (dossiê) existe no escopo global');
  chk(typeof w.geminiComMaps === 'function', 'geminiComMaps existe no escopo global');

  w.BD.config.geminiChave = 'AIzaTesteFalso123';
  w.BD.config.buscaFonte = 'auto';

  /* ═══════════ 1. O PROMPT (armadilha nº 1: inglês obrigatório) ═══════════ */
  secao('prompt vai em inglês, como o Maps grounding exige');

  /* Toda categoria precisa ter tradução. Uma categoria nova sem tradução manda
     português pro Maps grounding — e aí ele é ignorado e o modelo INVENTA
     empresas. É a falha silenciosa mais cara que existe aqui. */
  const semTraducao = Object.keys(w.CATEGORIAS).filter(c => !w.GEMINI_CAT_EN[c]);
  chk(semTraducao.length === 0, 'toda categoria tem nome em inglês',
    semTraducao.length ? 'faltam: ' + semTraducao.join(', ') : `${Object.keys(w.CATEGORIAS).length} categorias`);

  const prompt = w.promptBuscaGemini('Rondonópolis', 'MT', ['padaria', 'salao'], 0);
  chk(/Use the Google Maps tool/i.test(prompt), 'manda usar a ferramenta do Maps');
  chk(/Rondonópolis/.test(prompt) && /MT/.test(prompt) && /Brazil/.test(prompt), 'leva cidade, estado e país');
  chk(/bakeries and pastry shops/i.test(prompt), 'traduziu "padaria" pro inglês');
  chk(/hair salons/i.test(prompt), 'traduziu "salão" pro inglês');
  chk(/NEVER invent/i.test(prompt), 'proíbe inventar dado');
  chk(!/^\s*(Você|Liste|Procure|Encontre)\b/im.test(prompt), 'não começa instrução em português');
  chk(/max 140 characters/.test(prompt) && /IN PORTUGUESE/.test(prompt),
    'o gancho de venda é pedido em português');

  const promptRaio = w.promptBuscaGemini('Rondonópolis', 'MT', ['padaria'], 6);
  chk(/within 6 km/.test(promptRaio), 'o raio escolhido entra no prompt', promptRaio.match(/within \d+ km/) && promptRaio.match(/within \d+ km/)[0]);
  chk(/whole city/.test(prompt), 'sem raio, pede a cidade toda');

  /* ═══════════ 2. O CORPO DO PEDIDO (armadilha nº 2) ═══════════ */
  secao('corpo do pedido liga os dois groundings e não usa responseMimeType');

  PROXIMA_RESPOSTA = respostaGemini('{"empresas":[]}', LUGARES);
  await w.geminiComMaps('test', -16.46, -54.63, 1000);
  chk(!!ULTIMO_PEDIDO, 'a chamada chegou até o fetch');

  const corpo = ULTIMO_PEDIDO.corpo;
  const tools = JSON.stringify(corpo.tools || []);
  chk(/googleMaps/.test(tools), 'tools inclui googleMaps');
  chk(/googleSearch/.test(tools), 'tools inclui googleSearch (acha Instagram e site)');
  chk(corpo.generationConfig && corpo.generationConfig.responseMimeType === undefined,
    'NÃO manda responseMimeType — JSON estruturado e grounding brigam');
  const ll = corpo.toolConfig && corpo.toolConfig.retrievalConfig && corpo.toolConfig.retrievalConfig.latLng;
  chk(ll && typeof ll.latitude === 'number' && typeof ll.longitude === 'number',
    'latLng vai como número', ll ? `${ll.latitude},${ll.longitude}` : 'ausente');
  chk(ULTIMO_PEDIDO.opcoes.headers['x-goog-api-key'] === 'AIzaTesteFalso123', 'a chave vai no cabeçalho certo');
  chk(/:generateContent$/.test(ULTIMO_PEDIDO.url.split('?')[0]), 'usa o endpoint generateContent');

  /* A resposta crua do Google vem com title (inglês) e placeId prefixado.
     Se essa tradução não acontecer, nenhuma empresa casa com o Maps e a lista
     inteira aparece como "não confirmada" — sem erro nenhum no console. */
  const res = await w.geminiComMaps('test', -16.46, -54.63, 1000);
  chk(res.lugares.length === LUGARES.length, 'leu todos os lugares do groundingMetadata', `${res.lugares.length}`);
  chk(res.lugares[0].titulo === 'Padaria Pão Dourado', 'traduziu title → titulo', res.lugares[0].titulo);
  chk(res.lugares[0].placeId === 'ChIJPadaria01', 'tirou o prefixo "places/" do placeId', res.lugares[0].placeId);
  chk(Array.isArray(res.consultas) && res.consultas.length > 0, 'guarda as buscas que o modelo fez na web');
  chk(/gemini-/.test(res.modelo), 'informa qual modelo respondeu de fato', res.modelo);

  /* ═══════════ 3. PARSE TOLERANTE (armadilha nº 3) ═══════════ */
  secao('extrai a lista mesmo quando a resposta vem suja ou cortada');

  const limpo = '{"empresas":[{"nome":"Padaria A","telefone":"556634210001"},{"nome":"Padaria B"}]}';
  chk(w.extrairListaIA(limpo).length === 2, 'JSON limpo');
  chk(w.extrairListaIA('```json\n' + limpo + '\n```').length === 2, 'embrulhado em ```json');
  chk(w.extrairListaIA('Claro! Aqui está:\n' + limpo + '\nEspero ter ajudado.').length === 2,
    'com texto antes e depois');
  chk(w.extrairListaIA('[{"nome":"A"},{"nome":"B"}]').length === 2, 'lista sem o objeto em volta');

  /* O caso que mais dói: o limite de tokens acabou no meio da última empresa.
     Sem o plano B, o usuário perde as 39 que vieram antes. */
  const cortado = '{"empresas":[{"nome":"Padaria A","telefone":"556634210001"},' +
    '{"nome":"Padaria B","endereco":"Rua X, 10"},{"nome":"Padaria C","telef';
  const salvos = w.extrairListaIA(cortado);
  chk(salvos.length === 2, 'resposta cortada: salva as completas e descarta só a última',
    `salvou ${salvos.length}`);
  chk(salvos.length > 0 && salvos[0].nome === 'Padaria A', 'a primeira vem inteira');
  chk(w.extrairListaIA('').length === 0, 'resposta vazia não quebra');
  chk(w.extrairListaIA('não achei nada').length === 0, 'texto sem JSON não quebra');
  chk(w.extrairListaIA('{"empresas":[]}').length === 0, 'lista vazia devolve vazio');

  /* ═══════════ 4. LIMPEZA DOS CAMPOS ═══════════ */
  secao('limpa telefone, URL e a pegadinha do "site que é Instagram"');

  chk(w.iaTel('+55 (66) 3421-1234') === '556634211234', 'telefone formatado vira só dígitos com DDI', w.iaTel('+55 (66) 3421-1234'));
  chk(w.iaTel('66999887766') === '5566999887766', 'celular sem DDI ganha o 55', w.iaTel('66999887766'));
  chk(w.iaTel('') === '' && w.iaTel('não tem') === '', 'telefone desconhecido vira vazio');

  chk(w.iaUrl('padariapaodourado.com.br') === 'https://padariapaodourado.com.br', 'URL sem https ganha https');
  chk(w.iaUrl('https://x.com.br/a') === 'https://x.com.br/a', 'URL completa passa igual');
  chk(w.iaUrl('@padariadourada') === '', 'só o @ não vira link (sem domínio não dá pra confiar)');
  chk(w.iaUrl('null') === '' && w.iaUrl('não tem') === '' && w.iaUrl('') === '', 'lixo vira vazio');

  /* A regra mais importante da prospecção: empresa cujo "site" é o Instagram
     NÃO tem site. Marcar temSite aqui tira o melhor lead da lista. */
  const soInstagram = w.achadoDeGemini({
    nome: 'Salão Bela Vida', categoria: 'Salão',
    site: 'https://www.instagram.com/salaobelavida',
    telefone: '5566999887766',
  }, 'Rondonópolis', 'Salão', LUGARES);
  chk(soInstagram.temSite === false, 'Instagram no campo "site" NÃO conta como site');
  chk(soInstagram.instagram === 'https://www.instagram.com/salaobelavida', 'o Instagram foi pro campo certo');
  chk(soInstagram.site === '', 'o campo site ficou vazio');

  const soFace = w.achadoDeGemini({ nome: 'Mercado Bom Preço', site: 'https://facebook.com/xptoon' }, 'Rondonópolis', '', LUGARES);
  chk(soFace.temSite === false && soFace.facebook.indexOf('facebook.com') > 0, 'Facebook no campo "site" também não é site');

  const comSite = w.achadoDeGemini({ nome: 'Padaria Real', site: 'padariareal.com.br' }, 'Rondonópolis', '', LUGARES);
  chk(comSite.temSite === true && comSite.site === 'https://padariareal.com.br', 'site de verdade continua contando');

  /* ═══════════ 5. CONFIRMAÇÃO NO MAPAS (armadilha da alucinação) ═══════════ */
  secao('casa o nome com o grounding do Google Maps');

  chk(soInstagram.confirmado === true, 'nome que bate com um lugar do Maps vem confirmado');
  chk(soInstagram.placeId === 'ChIJSalao0003', 'o prefixo "places/" foi tirado do placeId', soInstagram.placeId);
  chk(soInstagram.mapsUrl === 'https://maps.google.com/?cid=1003', 'ganhou o link real do Maps');
  chk(soInstagram.osmId === 'ia:ChIJSalao0003', 'o id do lead é o placeId (estável entre buscas)', soInstagram.osmId);

  /* Acento, maiúscula e "LTDA" não podem impedir o casamento. */
  const acentuado = w.achadoDeGemini({ nome: 'PADARIA PAO DOURADO LTDA' }, 'Rondonópolis', '', LUGARES);
  chk(acentuado.confirmado === true, 'casa ignorando acento, caixa e LTDA');

  const inventado = w.achadoDeGemini({ nome: 'Padaria Que Nao Existe no Mapa' }, 'Rondonópolis', '', LUGARES);
  chk(inventado.confirmado === false, 'nome fora do grounding NÃO se passa por confirmado');
  chk(inventado.osmId.indexOf('ia:') === 0, 'mesmo sem placeId ganha id estável', inventado.osmId);

  chk(w.achadoDeGemini({ nome: '' }, 'X', '', LUGARES) === null, 'empresa sem nome é descartada');
  chk(w.achadoDeGemini({ nome: 'unknown' }, 'X', '', LUGARES) === null, '"unknown" é descartado');
  chk(w.achadoDeGemini({ nome: 'Padaria Boa', nota: '4,7', avaliacoes: '12' }).nota === null,
    'nota que não é número não vira NaN');
  chk(w.achadoDeGemini({ nome: 'X' }, 'Rondonópolis', '', LUGARES) === null,
    'nome de 1 letra é descartado (modelo devolve isso quando não achou nada)');

  /* ═══════════ 6. SCORE ═══════════ */
  secao('pontuação: as fontes antigas não mudam, a IA soma');

  const velho = { telefone: '5566999887766', temSite: false, temRedeSocial: false,
                  endereco: 'Rua A', email: 'a@b.com', horario: '8h-18h' };
  chk(w.pontuar(Object.assign({}, velho)) === 115,
    'lead do OpenStreetMap continua valendo 115 (nada mudou pra trás)', w.pontuar(Object.assign({}, velho)));

  const novo = w.pontuar(Object.assign({ fonte: 'gemini', confirmado: true, whatsapp: '5566999887766',
    dono: 'João', gancho: 'Sem site e com 8 avaliações', nota: 4.2, avaliacoes: 8, instagram: 'x' }, velho));
  chk(novo > 115, 'lead confirmado pela IA pontua mais', `${novo} pontos`);
  chk(w.pontuar({ fonte: 'gemini', telefone: '', temSite: true, temRedeSocial: true }) === 0,
    'lead ruim continua zerado');

  /* ═══════════ 7. ESCOLHA DA FONTE ═══════════ */
  secao('qual fonte o app escolhe');

  w.BD.config.geminiChave = ''; w.BD.config.geoapifyChave = '';
  w.BD.config.gmapsChave = ''; w.BD.config.iaProvedor = 'groq'; w.BD.config.iaChave = '';
  chk(w.fonteBuscaAtiva() === 'osm', 'sem chave nenhuma: OpenStreetMap');

  w.BD.config.geoapifyChave = 'geo-falsa';
  chk(w.fonteBuscaAtiva() === 'geoapify', 'com Geoapify: Geoapify');

  w.BD.config.geminiChave = 'AIzaFalsa';
  chk(w.fonteBuscaAtiva() === 'gemini', 'com Gemini: a IA vem primeiro (é a mais rica)');

  w.BD.config.buscaFonte = 'osm';
  chk(w.fonteBuscaAtiva() === 'osm', 'o usuário forçou OpenStreetMap: obedece');

  w.BD.config.buscaFonte = 'gemini'; w.BD.config.geminiChave = '';
  chk(w.fonteBuscaAtiva() === 'geoapify',
    'forçou Gemini mas não tem chave: cai pra próxima em vez de quebrar');

  /* mesma chave de IA, sem colar duas vezes */
  w.BD.config.buscaFonte = 'auto'; w.BD.config.iaProvedor = 'gemini'; w.BD.config.iaChave = 'AIzaDaIA';
  chk(w.geminiChaveBusca() === 'AIzaDaIA', 'aproveita a chave de IA quando o provedor é Gemini');
  chk(w.fonteBuscaAtiva() === 'gemini', 'e a busca liga sozinha');

  w.BD.config.iaProvedor = 'groq'; w.BD.config.iaChave = ''; w.BD.config.geminiChave = 'AIzaFalsa';

  /* ═══════════ 8. BUSCA COMPLETA (integração com o Gemini fingido) ═══════════ */
  secao('busca uma cidade inteira de ponta a ponta');

  PROXIMA_RESPOSTA = respostaGemini(JSON.stringify({
    empresas: [
      { nome: 'Padaria Pão Dourado', categoria: 'Padaria', endereco: 'Av. Bandeirantes, 1200',
        bairro: 'Centro', telefone: '+55 (66) 3421-0001', whatsapp: '66999110001',
        site: '', instagram: 'https://instagram.com/paodourado.roo', facebook: '',
        horario: 'Seg a Sáb 05:30–19:00', nota: 4.6, avaliacoes: 312, dono: 'Marcos Aurélio',
        servicos: ['pães', 'bolos', 'café'], gancho: 'Tem 312 avaliações e nenhum site.',
        problema: 'Só atende por telefone.' },
      { nome: 'Panificadora Central', categoria: 'Padaria', endereco: 'Rua Dom Pedro II, 45',
        telefone: '6634235566', site: 'https://www.instagram.com/centralpães', nota: 3.9,
        avaliacoes: 14, gancho: 'Nota 3,9 com 14 avaliações: reputação frágil.' },
      { nome: 'Padaria Pão Dourado', categoria: 'Padaria', telefone: '6634210001' },  /* duplicada */
    ],
  }), LUGARES);

  w.GEO_CACHE = {};
  const achados = await w.buscarGeminiEm('Rondonópolis', ['padaria'], null, 0);
  chk(achados.length === 2, 'deduplica a empresa que veio duas vezes', `${achados.length} achados`);
  chk(achados[0].confirmado === true && achados[1].confirmado === true, 'as duas casaram com lugares do Maps');
  chk(achados[0].telefone === '556634210001', 'telefone normalizado', achados[0].telefone);
  chk(achados[0].whatsapp === '5566999110001', 'WhatsApp separado do telefone');
  chk(achados[0].nota === 4.6 && achados[0].avaliacoes === 312, 'nota e nº de avaliações');
  chk(achados[0].dono === 'Marcos Aurélio', 'nome do dono');
  chk(achados[0].gancho.indexOf('nenhum site') > 0, 'gancho de venda veio pronto');
  chk(achados[0].bairro === 'Centro', 'bairro');
  chk(achados[0].score >= 75, 'lead completo vira "bom lead"', `${achados[0].score} pontos`);
  chk(achados[1].temSite === false && achados[1].instagram.indexOf('instagram.com') > 0,
    'a segunda tinha Instagram no lugar do site e continuou sem site');
  chk(achados.meta && achados.meta.modelo, 'guarda qual modelo respondeu', achados.meta && achados.meta.modelo);
  chk(w.GEMINI_CHAMADAS >= 1, 'conta as chamadas (a cota grátis é mensal)');

  /* A busca não pode vir sem nenhuma prova de que consultou o Maps. */
  secao('recusa resposta que veio sem consultar o Maps');
  PROXIMA_RESPOSTA = respostaGemini(JSON.stringify({
    empresas: [{ nome: 'Padaria Fantasma Um' }, { nome: 'Padaria Fantasma Dois' }],
  }), []);
  let estourou = '';
  try { await w.buscarGeminiEm('Rondonópolis', ['padaria'], null, 0); }
  catch (e) { estourou = e.message; }
  chk(/sem consultar o Google Maps/i.test(estourou),
    'empresa sem lugar no Maps E sem telefone/endereço é recusada', estourou || 'não recusou');

  /* Mas se tiver telefone ou endereço, aproveita: nem toda resposta traz chunks. */
  PROXIMA_RESPOSTA = respostaGemini(JSON.stringify({
    empresas: [{ nome: 'Padaria Sem Chunk', telefone: '6634219999', endereco: 'Rua Z, 9' }],
  }), []);
  const aproveitados = await w.buscarGeminiEm('Rondonópolis', ['padaria'], null, 0);
  chk(aproveitados.length === 1 && aproveitados[0].confirmado === false,
    'com telefone/endereço aproveita, mas marca como não confirmada');

  /* chave recusada tem que dar recado em português, não o erro cru da API */
  secao('erros viram recado que o usuário entende');
  PROXIMA_RESPOSTA = { __erro: true, status: 400, msg: 'API key not valid. Please pass a valid API key.' };
  estourou = '';
  try { await w.geminiComMaps('x', -16, -54, 100); } catch (e) { estourou = e.message; }
  chk(/recusou a chave/i.test(estourou), 'chave inválida (400)', estourou);

  PROXIMA_RESPOSTA = { __erro: true, status: 429, msg: 'Quota exceeded' };
  estourou = '';
  try { await w.geminiComMaps('x', -16, -54, 100); } catch (e) { estourou = e.message; }
  chk(/limite atingido|cota grátis/i.test(estourou), 'cota estourada (429)', estourou);

  PROXIMA_RESPOSTA = { __erro: true, status: 404, msg: 'models/gemini-3.6-flash is not found' };
  estourou = '';
  try { await w.geminiComMaps('x', -16, -54, 100); } catch (e) { estourou = e.message; }
  chk(estourou.length > 0, 'modelo aposentado desce a fila e, se todos falharem, avisa', estourou.slice(0, 70));
  PROXIMA_RESPOSTA = null;

  /* ═══════════ 9. DOSSIÊ ═══════════ */
  secao('dossiê: a ficha completa de uma empresa');

  const fichaCheia = {
    resumo: 'Padaria de bairro com 12 anos de casa e clientela fiel.',
    dono: 'Marcos Aurélio', cnpj: '12.345.678/0001-90', abertaEm: 2013, funcionarios: '6 a 9',
    endereco: 'Av. Bandeirantes, 1200', bairro: 'Centro', telefone: '556634210001',
    whatsapp: '5566999110001', email: 'contato@paodourado.com.br', site: '',
    instagram: 'https://instagram.com/paodourado.roo', facebook: '',
    horario: 'Seg a Sáb 05:30–19:00', nota: 4.6, avaliacoes: 312, fotos: 41,
    instagramAtivo: 'parado desde 2024',
    reclamacoes: 'Demora no atendimento às 7h.', elogios: 'Pão de queijo elogiado.',
    concorrentes: ['Panificadora Central', 'Padaria Real'],
    presenca: { site: false, instagram: true, facebook: false, maps: true },
    oportunidades: ['Cardápio online', 'Encomenda pelo WhatsApp', 'Horário visível no Google'],
    gancho: '312 avaliações e Instagram parado desde 2024.',
    mensagem: 'Oi, Marcos! Vi a Padaria Pão Dourado no Google — 312 avaliações e nota 4,6. ' +
      'Notei que o Instagram está parado desde 2024 e vocês não têm site. Faço sites pra ' +
      'padarias aqui de Rondonópolis. Posso te mostrar uma ideia?',
  };

  const d = w.extrairObjetoIA(JSON.stringify(fichaCheia));
  chk(d.dono === 'Marcos Aurélio', 'ficha completa é lida inteira');

  /* ficha cortada no meio: perde o último campo, não a ficha inteira */
  const textoCortado = JSON.stringify(fichaCheia).slice(0, JSON.stringify(fichaCheia).length - 90);
  let recuperada = null;
  try { recuperada = w.extrairObjetoIA(textoCortado); } catch (e) { recuperada = null; }
  chk(recuperada && recuperada.dono === 'Marcos Aurélio',
    'ficha cortada no fim ainda é aproveitada', recuperada ? 'recuperou ' + Object.keys(recuperada).length + ' campos' : 'perdeu tudo');

  let erroFicha = '';
  try { w.extrairObjetoIA('não veio nada'); } catch (e) { erroFicha = e.message; }
  chk(/não devolveu uma ficha/i.test(erroFicha), 'resposta sem JSON dá erro legível', erroFicha);

  /* fundir: o dossê PREENCHE buraco, nunca apaga o que a busca já sabia */
  const base = { nome: 'Padaria Pão Dourado', cidade: 'Rondonópolis', telefone: '556634210001',
                 email: 'velho@certo.com', temSite: false, fonte: 'gemini' };
  const fundido = w.fundirDossie(base, Object.assign({}, fichaCheia, { telefone: '556699999999', email: '' }));
  chk(fundido.telefone === '556634210001', 'não sobrescreve telefone que já existia');
  chk(fundido.email === 'velho@certo.com', 'não sobrescreve e-mail que já existia');
  chk(fundido.dono === 'Marcos Aurélio', 'preenche o que estava vazio');
  chk(fundido.nota === 4.6 && fundido.avaliacoes === 312, 'traz nota e avaliações');

  const fundidoInsta = w.fundirDossie({ nome: 'Mercado Bom Preço', cidade: 'Rondonópolis' },
    Object.assign({}, fichaCheia, { site: 'https://instagram.com/x', instagram: '' }));
  chk(fundidoInsta.temSite === false, 'dossiê com Instagram no campo site não marca como "tem site"');
  chk(fundidoInsta.instagram === 'https://instagram.com/x', 'o Instagram foi pro campo certo');

  /* ═══════════ 10. LEAD ═══════════ */
  secao('o lead guarda tudo e se atualiza sem perder nada');

  const lead = w.viraLead(achados[0]);
  chk(lead.dono === 'Marcos Aurélio' && lead.instagram && lead.nota === 4.6, 'lead nasce com os dados da IA');
  chk(lead.dossie === null, 'campo do dossiê existe e começa vazio');
  chk(lead.fonte === 'gemini', 'lead sabe que veio da IA');
  chk(lead.historico[0].texto.indexOf('IA') > 0, 'histórico diz que veio da busca com IA');
  chk('whatsapp' in lead && 'gancho' in lead && 'mapsUrl' in lead && 'confirmado' in lead,
    'todos os campos novos existem no lead');

  /* lead antigo (sem os campos novos) não pode quebrar */
  const antigo = w.viraLead({ nome: 'Oficina do Zé', telefone: '556634210000', osmId: 'way/1' });
  chk(antigo.dono === '' && antigo.nota === null && Array.isArray(antigo.servicos),
    'achado do OpenStreetMap vira lead com os campos novos vazios');

  const mudancas = w.enriquecerLead(antigo, {
    fonte: 'gemini', telefone: '556699999999',       /* já tinha: não mexe */
    instagram: 'https://instagram.com/oficinadoze',  /* novo: entra */
    dono: 'José Carlos', gancho: 'Sem site há 10 anos.', nota: 4.1, confirmado: true,
  });
  chk(antigo.telefone === '556634210000', 'enriquecer NÃO sobrescreve o telefone que já existia');
  chk(antigo.instagram === 'https://instagram.com/oficinadoze', 'enriquecer preenche o Instagram');
  chk(antigo.dono === 'José Carlos', 'enriquecer preenche o dono');
  chk(mudancas.length >= 4, 'devolve a lista do que mudou', mudancas.join(', '));
  chk(antigo.historico.some(h => /Atualizado pela IA/.test(h.texto)), 'registra no histórico do lead');
  chk(antigo.score > 0, 'recalcula o score depois de enriquecer', antigo.score + ' pontos');
  chk(w.enriquecerLead(antigo, { dono: 'José Carlos' }).length === 0,
    'rodar de novo sem nada novo não suja o histórico');

  /* ═══════════ 11. TELA ═══════════ */
  secao('o cartão mostra o que a IA achou (e escapa texto malicioso)');

  const cartao = w.cartaAchado(achados[0], 0);
  chk(/Gancho pra abordar/.test(cartao), 'mostra o gancho de venda');
  chk(/Marcos Aurélio/.test(cartao), 'mostra o nome do dono');
  chk(/⭐ 4\.6/.test(cartao), 'mostra a nota');
  chk(/Instagram/.test(cartao), 'mostra atalho pro Instagram');
  chk(/No mapa|maps\.google/.test(cartao), 'mostra atalho pro Google Maps');
  chk(/SEM SITE/.test(cartao), 'marca que não tem site');
  chk(/lugar no Google Maps/.test(cartao), 'mostra o selo de confirmado');
  chk(/Investigar a fundo/.test(cartao), 'oferece o dossiê');

  /* A resposta da IA é texto de terceiros indo pro innerHTML. Sem esc, um nome
     de empresa malicioso viraria script no celular do usuário. */
  const malicioso = { nome: '<img src=x onerror=alert(1)>', categoria: 'Padaria',
                      gancho: '"><script>alert(2)</script>', telefone: '', score: 0, fonte: 'gemini' };
  const cartaoMau = w.cartaAchado(malicioso, 0);
  chk(cartaoMau.indexOf('<img') === -1 && cartaoMau.indexOf('<script>') === -1,
    'nome e gancho maliciosos são escapados, não viram HTML');
  chk(/&lt;img/.test(cartaoMau), 'o texto aparece escapado na tela');

  chk(typeof w.rotuloFonte('gemini') === 'string' && /Gemini/.test(w.rotuloFonte('gemini')),
    'rotuloFonte descreve a fonte em português');

  /* ═══════════ 12. AJUSTES ═══════════ */
  secao('a tela de Ajustes tem onde colar a chave');

  w.ir('ajustes');
  await new Promise(r => setTimeout(r, 200));
  const doc = w.document;
  chk(!!doc.querySelector('#aGemini'), 'campo da chave do Gemini existe');
  chk(!!doc.querySelector('#aGeminiModelo'), 'campo do modelo existe');
  chk(!!doc.querySelector('#aBuscaFonte'), 'seletor de fonte existe');
  chk(/aistudio\.google\.com\/apikey/.test(doc.querySelector('#tela-ajustes').innerHTML),
    'diz onde pegar a chave de graça');
  chk(/5\.000/.test(doc.querySelector('#tela-ajustes').innerHTML),
    'diz qual é a cota grátis');

  doc.querySelector('#aGemini').value = 'AIzaColadaNaMao';
  doc.querySelector('#aBuscaFonte').value = 'gemini';
  w.salvarAjustes();
  chk(w.BD.config.geminiChave === 'AIzaColadaNaMao', 'salvarAjustes guarda a chave');
  chk(w.BD.config.buscaFonte === 'gemini', 'salvarAjustes guarda a fonte escolhida');

  const fonteTxt = (doc.querySelector('#fonteBusca') || {}).textContent || '';
  chk(/Gemini/.test(fonteTxt), 'a tela de busca avisa que está usando a IA', fonteTxt.slice(0, 60));

  chk(erros.length === 0, 'nenhum erro de JavaScript durante todos os testes',
    erros.slice(0, 3).join(' | '));

  w.close();
  console.log(`\n════════ ${passou} passaram, ${falhou} falharam ════════`);
  process.exit(falhou ? 1 : 0);
})().catch(e => { console.error('\nFALHA:', e); process.exit(1); });
