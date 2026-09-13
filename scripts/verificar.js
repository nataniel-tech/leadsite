#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   verificar.js — confere o projeto antes de enviar pro GitHub

   Faz quatro coisas, e qualquer uma falhando devolve código de saída 1:

     1. sintaxe     node --check em todos os .js, e nos blocos <script>
                    embutidos no index.html (que é onde mora o app)
     2. build       os arquivos GERADOS estão iguais ao que a fonte produz?
                    public/celular.html (← index.html), previa.html e
                    previa-formulario.html (← public/ + sitegen + dataset)
     3. caminhos    nenhum HTML publicado aponta para arquivo que não existe,
                    nem usa caminho absoluto que quebra no GitHub Pages
    3b. cópias      os blocos sitegen / perfis / qrcode embutidos no index.html
                    são idênticos às fontes? (o gerador já divergiu: o celular
                    ficou no v2 enquanto o sitegen.js ia no v3)
    3c. segredos    nenhuma chave de API escrita no que o Pages publica
    3d. IA          a caixa de descrição, as duas IAs e o sanitizador estão lá
    3e. prova social nenhum depoimento de exemplo dos perfis vazou para um site
                    publicado (demo/ e raiz; os shells do app ficam de fora
                    porque embutem o perfis.js como matéria-prima)
     4. integração  sobe o servidor numa porta livre e testa as duas
                    interfaces num DOM de verdade: cada aba abre? o site
                    é gerado? os botões funcionam com pop-up bloqueado?

   Uso:
       npm test                     tudo
       npm run test:rapido          só sintaxe e build (não sobe servidor)

   Sem dependências externas: usa só o que já vem no Node 18+.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const R = path.join(__dirname, '..');   // o projeto mora um nível acima de scripts/
const RAPIDO = process.argv.includes('--rapido');

let passou = 0, falhou = 0;
const ok = (rotulo, detalhe) => { console.log(`  ✔ ${rotulo}${detalhe ? ' — ' + detalhe : ''}`); passou++; };
const erro = (rotulo, detalhe) => { console.log(`  ✘ ${rotulo}${detalhe ? ' — ' + detalhe : ''}`); falhou++; };

/* ─────────────────────────── 1. sintaxe ─────────────────────────── */
function checarSintaxe() {
  console.log('\n── 1. Sintaxe ──');

  const js = ['server.js', 'sitegen.js', 'brief-schema.js',
              'scripts/build.js', 'scripts/build-previa.js', 'scripts/verificar.js',
              'scripts/testar-navegador.js',
              'public/app.js', 'public/perfis.js', 'public/qrcode.js'];
  for (const f of js) {
    const p = path.join(R, f);
    if (!fs.existsSync(p)) { erro(f, 'arquivo não existe'); continue; }
    const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
    r.status === 0 ? ok(f) : erro(f, (r.stderr || '').split('\n').slice(0, 3).join(' | '));
  }

  /* O app celular mora dentro do index.html, em blocos <script>. Um erro de
     sintaxe ali não aparece em lugar nenhum até a aba quebrar no celular. */
  const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  const blocos = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocos.length) { erro('index.html', 'nenhum bloco <script> encontrado'); return; }
  let ruins = 0;
  blocos.forEach((b, i) => {
    const tmp = path.join(R, `.tmp-bloco-${i}.js`);
    fs.writeFileSync(tmp, b);
    const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    fs.unlinkSync(tmp);
    if (r.status !== 0) {
      ruins++;
      erro(`index.html bloco <script> #${i}`, (r.stderr || '').split('\n').slice(0, 3).join(' | '));
    }
  });
  if (!ruins) ok(`index.html: ${blocos.length} blocos <script>`, 'sintaxe válida em todos');
}

/* ─────────────────────────── 2. build ─────────────────────────── */
function checarBuild() {
  console.log('\n── 2. Build (arquivos gerados) ──');

  const r = spawnSync(process.execPath, [path.join(R, 'scripts', 'build.js'), '--check'], { encoding: 'utf8' });
  const saida = ((r.stdout || '') + (r.stderr || '')).trim();
  r.status === 0 ? ok('public/celular.html', 'igual ao index.html') : erro('public/celular.html', saida.split('\n').pop());

  /* As prévias são o que o GitHub Pages publica. Elas reempacotam public/,
     sitegen.js, brief-schema.js e o dataset — ou seja, mudam toda vez que a
     fonte muda. Sem esta checagem elas envelhecem em silêncio (já aconteceu:
     o previa.html ficou sem a correção do rascunho que estava no app.js). */
  const rp = spawnSync(process.execPath, [path.join(R, 'scripts', 'build-previa.js'), '--check'], { encoding: 'utf8' });
  const sp = ((rp.stdout || '') + (rp.stderr || '')).trim().split('\n');
  if (rp.status === 0) {
    ok('previa.html', 'igual ao que o build gera');
    ok('previa-formulario.html', 'igual ao que o build gera');
  } else {
    sp.filter(l => l.includes('✘')).forEach(l => erro('prévia desatualizada', l.replace(/^\s*✘\s*/, '')));
    if (!sp.some(l => l.includes('✘'))) erro('prévias', sp[sp.length - 1]);
  }
}

/* ─────────────────────── 3. caminhos dos arquivos ─────────────────────── */

/* Páginas estáticas publicadas no GitHub Pages: elas mesmas mostram as fotos,
   então precisam de caminho relativo (o projeto mora na subpasta /leadsite/).
   index.html e questionario.html ficam FORA desta regra: as URLs absolutas que
   aparecem neles estão dentro do gerador de sites e valem para o site do
   cliente servido pelo node em /s/:slug — lá o caminho absoluto é o certo. */
const PAGINAS_PUBLICADAS = ['previa.html', 'previa-formulario.html',
                            'padaria-pao-dourado.html', 'oficina-mecanica-confianca.html'];

function checarCaminhos() {
  console.log('\n── 3. Caminhos nos HTML publicados ──');

  const htmls = fs.readdirSync(R).filter(f => f.endsWith('.html'));
  let ruins = 0;

  for (const f of htmls) {
    const txt = fs.readFileSync(path.join(R, f), 'utf8');

    /* (a) caminho RELATIVO tem que existir no disco — senão a imagem some.
       (Os absolutos são regra separada, logo abaixo.) */
    const relativos = new Set(
      [...txt.matchAll(/["'(](?!\/)\.?\/?((?:public\/)?fotos\/[^"')\s]+)/g)].map(m => m[1])
    );
    for (const ref of relativos) {
      if (!fs.existsSync(path.join(R, ref))) {
        ruins++;
        erro(f, `aponta para "${ref}" e esse arquivo não existe`);
      }
    }

    /* (b) nas páginas publicadas, caminho absoluto só funciona com o node
       server.js na raiz do domínio. No GitHub Pages ele escapa da pasta
       /leadsite/ e dá 404 — já aconteceu com as duas prévias. */
    if (PAGINAS_PUBLICADAS.includes(f)) {
      const absolutos = new Set([...txt.matchAll(/["'(]\/(fotos\/[^"')\s]+)/g)].map(m => '/' + m[1]));
      for (const ref of absolutos) {
        ruins++;
        erro(f, `usa caminho absoluto "${ref}" — quebra no GitHub Pages (use public/fotos/...)`);
      }
    }
    /* (c) redirect tem que apontar para um arquivo que existe — um redirect
       para o nada é pior que um 404, porque o navegador fica girando. */
    const alvos = [...txt.matchAll(/http-equiv="refresh"\s+content="[^"]*url=([^">]+)/gi)].map(m => m[1].trim());
    for (const alvo of alvos) {
      if (/^https?:/i.test(alvo)) continue;
      const rel = alvo.replace(/^\.\//, '').replace(/^\//, '').split('#')[0].split('?')[0];
      if (!fs.existsSync(path.join(R, rel))) {
        ruins++;
        erro(f, `redireciona para "${alvo}" e esse arquivo não existe`);
      }
    }
  }

  if (!ruins) ok(`${htmls.length} HTML da raiz`, 'fotos existem, redirects apontam para algo real, e as páginas publicadas não usam caminho absoluto');
}

/* ─────────── 3b. cópias embutidas no index.html = a fonte ───────────
   O app de celular é um arquivo só (funciona offline e é o que o GitHub Pages
   publica), então ele carrega qrcode, perfis e o gerador embutidos em blocos
   <script>/* nome *\/. qrcode e perfis estavam idênticos às fontes; o gerador
   NÃO estava — o index.html seguia com o "Gerador de sites v2" (6 funções)
   enquanto o sitegen.js já ia no v3 (28 funções, com as seções por ramo).
   Nenhum build sincroniza os dois, então esta checagem é o que impede a
   cópia de envelhecer de novo em silêncio. */
function checarCopiasEmbutidas() {
  console.log('\n── 3b. Cópias embutidas no index.html ──');
  const fontes = [
    ['sitegen', path.join(R, 'sitegen.js')],
    ['perfis', path.join(R, 'public', 'perfis.js')],
    ['qrcode', path.join(R, 'public', 'qrcode.js')],
  ];
  const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  const norm = s => s.replace(/\r/g, '').trim();

  for (const [nome, arquivo] of fontes) {
    const marca = `<script>/* ${nome} */`;
    const i = idx.indexOf(marca);
    if (i < 0) { erro(`bloco /* ${nome} */ no index.html`, 'não foi encontrado'); continue; }
    const ini = i + marca.length;
    const fim = idx.indexOf('</' + 'script>', ini);
    const copia = norm(idx.slice(ini, fim));
    const fonte = norm(fs.readFileSync(arquivo, 'utf8'));

    copia === fonte
      ? ok(`${nome} embutido no index.html`, `idêntico a ${path.relative(R, arquivo)}`)
      : erro(`${nome} embutido no index.html`,
             `DIVERGE de ${path.relative(R, arquivo)} (${copia.length} vs ${fonte.length} chars) — ` +
             'copie o conteúdo da fonte para dentro do bloco <script>/* ' + nome + ' */ e rode npm run build');
  }
}


/* ─────────── 3c. segredo nenhum dentro do que é publicado ───────────
   index.html e public/ vão para o GitHub Pages: qualquer chave ali é pública
   para quem abrir o site. A IA é configurada pelo usuário em Ajustes e fica no
   localStorage do aparelho dele — nunca no código. */
function checarSegredos() {
  console.log('\n── 3c. Chaves de API no código publicado ──');

  const PADROES = [
    [/sk-or-v1-[A-Za-z0-9-]{20,}/g, 'OpenRouter'],
    [/AIza[A-Za-z0-9_-]{30,}/g, 'Google/Gemini'],
    [/AQ\.[A-Za-z0-9_-]{20,}/g, 'Google (formato novo)'],
    [/gsk_[A-Za-z0-9]{30,}/g, 'Groq'],
    [/xai-[A-Za-z0-9]{20,}/g, 'x.ai'],
    [/sk-[A-Za-z0-9_-]{30,}/g, 'OpenAI'],
    [/github_pat_[A-Za-z0-9_]{20,}/g, 'GitHub'],
  ];
  const alvos = ['index.html', 'public/celular.html', 'public/index.html', 'public/app.js',
                 'public/perfis.js', 'public/brief.html', 'questionario.html',
                 'previa.html', 'previa-formulario.html', 'demo/padaria-pao-dourado.html',
                 'demo/oficina-mecanica-confianca.html'];
  let vazios = 0, achados = 0;

  for (const f of alvos) {
    const caminho = path.join(R, f);
    if (!fs.existsSync(caminho)) { vazios++; continue; }
    const txt = fs.readFileSync(caminho, 'utf8');
    for (const [re, rotulo] of PADROES) {
      const m = txt.match(re);
      if (m) { achados++; erro(f, `chave ${rotulo} à vista no código publicado (${m[0].slice(0, 8)}…) — revogue agora`); }
    }
  }
  if (!achados) ok(`${alvos.length - vazios} arquivos publicados`, 'nenhuma chave de API escrita no código');

  /* O app tem uma chave do Groq montada em pedaços base64 (_PX + atob), posta
     lá a pedido do dono. Não é detectada pelos padrões acima justamente por
     estar picada — então fica o aviso visível em toda execução, sem reprovar:
     quem decide se ela continua lá é o dono, não o teste. */
  const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  if (/const _PX = \[/.test(idx) && /atob\(_PX/.test(idx)) {
    console.log('  ⚠ aviso (não reprova): index.html ainda carrega a chave do Groq montada em');
    console.log('    pedaços base64 (_PX + atob). Está pública para quem abrir o site —');
    console.log('    qualquer um decodifica em segundos. Se um dia ela aparecer na sua');
    console.log('    fatura com uso estranho, é por aí. Trocar por "chave só em Ajustes"');
    console.log('    resolve; eu removo se você pedir.');
  }
}

/* ─────────── 3d. a IA da descrição está montada como deveria ─────────── */
function checarIaDaDescricao() {
  console.log('\n── 3d. IA da caixa de descrição ──');
  const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  const itens = [
    [/openrouter:\s*\{[\s\S]{0,200}?openrouter\.ai\/api\/v1\/chat\/completions/, 'provedor OpenRouter cadastrado no módulo IA'],
    [/id="iaDescricao"/, 'caixa de descrição na tela de criar site'],
    [/async function montarSitePelaDescricao/, 'função que monta o site pela descrição'],
    [/function configIA2\(/, 'segunda IA configurável (é com ela que a primeira conversa)'],
    [/promptCritica\(/, 'rodada de crítica entre as duas IAs'],
    [/function sanitizarDaIA\(/, 'sanitizador do que a IA devolve'],
    [/PROIBIDO inventar: depoimento/, 'prompt proíbe inventar prova social'],
    [/iaChave2/, 'campo para a chave da segunda IA'],
  ];
  let faltou = 0;
  for (const [re, rotulo] of itens) {
    if (re.test(idx)) ok(rotulo);
    else { faltou++; erro('index.html', 'faltou: ' + rotulo); }
  }
}


/* ─── 3e. depoimento de mentira não pode vazar para site publicado ───
   Os 25 perfis de public/perfis.js trazem 2 depoimentos cada, com autores
   inventados (50 no total: "Marcos Pereira", "Juliana Alves"…). Servem de
   esqueleto para o dono trocar pelos reais — mas se um site for gerado e
   publicado sem trocar, o cliente fica com elogio falso de pessoa que não
   existe. Para escritório de advocacia, então, é publicidade vedada pela OAB.
   Esta checagem pega o vazamento antes do push. */
function checarProvaSocialInventada() {
  console.log('\n── 3e. Depoimento inventado nos sites publicados ──');

  let Perfis;
  try { Perfis = require(path.join(R, 'public', 'perfis.js')); }
  catch (e) { erro('public/perfis.js', 'não deu para carregar: ' + e.message); return; }

  const falsos = new Set();
  Object.values((Perfis && Perfis.PERFIS) || {}).forEach(p => {
    (p.depoimentos || []).forEach(d => { if (d && d.autor) falsos.add(String(d.autor).trim()); });
  });
  if (!falsos.size) { erro('perfis', 'nenhum depoimento de exemplo encontrado — a checagem perdeu o sentido'); return; }

  /* O alvo é o site que vai PRO CLIENTE. Os shells do app (index, previa,
     questionario) embutem public/perfis.js inteiro — e lá os depoimentos de
     exemplo são matéria-prima legítima para o dono trocar. Checá-los seria
     falso positivo; checar demo/ e qualquer site publicado na raiz não. */
  const SHELLS = ['index.html', 'previa.html', 'previa-formulario.html', 'questionario.html'];
  const alvos = fs.readdirSync(R).filter(f => f.endsWith('.html') && !SHELLS.includes(f))
    .concat(fs.existsSync(path.join(R, 'demo'))
      ? fs.readdirSync(path.join(R, 'demo')).filter(f => f.endsWith('.html')).map(f => 'demo/' + f)
      : []);

  let vazou = 0;
  for (const f of alvos) {
    const caminho = path.join(R, f);
    if (!fs.existsSync(caminho)) continue;
    const txt = fs.readFileSync(caminho, 'utf8');
    const achados = [...falsos].filter(nome => txt.includes(nome));
    if (achados.length) {
      vazou++;
      erro(f, 'publica depoimento inventado: ' + achados.slice(0, 3).join(', ') +
              (achados.length > 3 ? ' (+' + (achados.length - 3) + ')' : '') +
              ' — troque pelos reais do cliente ou tire a seção');
    }
  }
  if (!vazou) ok(alvos.length + ' páginas publicadas',
    'nenhum dos ' + falsos.size + ' depoimentos de exemplo dos perfis vazou para site');
}

/* ─────────────────────── 4. integração ─────────────────────── */
function subirServidor(porta) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(R, 'server.js')], {
      cwd: R, env: { ...process.env, PORT: String(porta) }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    p.stdout.on('data', d => { log += d; });
    p.stderr.on('data', d => { log += d; });
    const fim = setTimeout(() => reject(new Error('servidor não subiu em 8s. Log:\n' + log)), 8000);
    const tentar = () => {
      const req = http.get({ host: '127.0.0.1', port: porta, path: '/', timeout: 1000 }, res => {
        res.resume();
        clearTimeout(fim);
        resolve({ proc: p, log });
      });
      req.on('error', () => setTimeout(tentar, 250));
      req.on('timeout', () => { req.destroy(); setTimeout(tentar, 250); });
    };
    setTimeout(tentar, 400);
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let b = '';
      res.on('data', d => { b += d; });
      res.on('end', () => resolve({ status: res.statusCode, corpo: b, cab: res.headers }));
    }).on('error', reject);
  });
}

async function testarIntegracao(porta) {
  console.log('\n── 4. Integração (servidor de verdade) ──');
  const base = `http://127.0.0.1:${porta}`;
  let srv;
  try {
    srv = await subirServidor(porta);
  } catch (e) {
    erro('servidor', e.message);
    return;
  }
  ok('servidor subiu', `porta ${porta}`);

  try {
    /* Rotas: as que existiam, as que estavam dando 404 sem motivo, e o 404 de verdade. */
    const rotas = [
      ['/', 200, 'app de 3 abas'],
      ['/celular.html', 200, 'app celular'],
      ['/app.js', 200, 'lógica do app'],
      ['/style.css', 200, 'tema'],
      ['/sitegen.js', 200, 'gerador de sites'],
      ['/perfis.js', 200, 'perfis de segmento'],
      ['/previa.html', 200, 'prévia do CRM (era 404)'],
      ['/previa-formulario.html', 200, 'prévia do formulário (era 404)'],
      /* As demos moram em demo/. No endereço antigo ficou um redirect — quem
         já tinha o link antigo (WhatsApp, mensagem pro cliente) não pode dar
         com a cara num 404. */
      ['/demo/padaria-pao-dourado.html', 200, 'demo de site no endereço novo'],
      ['/padaria-pao-dourado.html', 200, 'endereço antigo da demo continua de pé (redirect)'],
      /* Os demos apontam para "public/fotos/banco/..." (caminho relativo, que
         é o que funciona no GitHub Pages). O servidor precisa achar a imagem
         pelos dois endereços, senão o demo abre sem foto num mundo ou no outro. */
      ['/public/fotos/banco/padaria.jpg', 200, 'foto do demo pelo caminho relativo'],
      ['/fotos/banco/padaria.jpg', 200, 'foto do banco pelo caminho do servidor'],
      ['/nao-existe-mesmo.html', 404, '404 continua funcionando'],
    ];
    for (const [rota, espera, rotulo] of rotas) {
      const r = await get(base + rota);
      r.status === espera
        ? ok(`${rota}`, `${rotulo} · HTTP ${r.status} · ${r.corpo.length} bytes`)
        : erro(`${rota}`, `esperava HTTP ${espera}, veio ${r.status} (${rotulo})`);
    }

    /* O app servido tem que ser o corrigido, não uma cópia velha. */
    const cel = await get(base + '/celular.html');
    /window\.iaPronta/.test(cel.corpo)
      ? ok('correção da aba "Criar site"', 'window.iaPronta presente no que o servidor entrega')
      : erro('correção da aba "Criar site"', 'window.iaPronta NÃO está no HTML servido');
    /Esse cliente não existe mais/.test(cel.corpo)
      ? ok('proteção do criarSitePara', 'presente no HTML servido')
      : erro('proteção do criarSitePara', 'ausente no HTML servido');

    /* Sem cache nos arquivos do app: é o que fazia o celular mostrar versão velha. */
    const cabJs = (await get(base + '/app.js')).cab['cache-control'] || '';
    /no-store/.test(cabJs)
      ? ok('cache dos arquivos do app', `Cache-Control: ${cabJs}`)
      : erro('cache dos arquivos do app', `esperava no-store, veio "${cabJs}"`);

    const cabFoto = (await get(base + '/fotos/banco/padaria.jpg')).cab['cache-control'] || '';
    /max-age=86400/.test(cabFoto)
      ? ok('cache das fotos continua longo', cabFoto)
      : erro('cache das fotos', `virou "${cabFoto}"`);

    /* A API tem que responder — é o que alimenta o app de 3 abas. */
    const cats = await get(base + '/api/categorias');
    let n = 0;
    try { n = JSON.parse(cats.corpo).length; } catch (e) { n = 0; }
    n > 10 ? ok('/api/categorias', `${n} segmentos`) : erro('/api/categorias', `devolveu ${n} itens`);
  } finally {
    srv.proc.kill('SIGTERM');
  }
}

/* ─────────────────────────── main ─────────────────────────── */
(async () => {
  console.log('Verificando o LeadSite…');
  checarSintaxe();
  checarBuild();
  checarCaminhos();
  checarCopiasEmbutidas();
  checarSegredos();
  checarIaDaDescricao();
  checarProvaSocialInventada();
  if (!RAPIDO) {
    const porta = 3100 + Math.floor(Math.random() * 400);
    await testarIntegracao(porta);
  }
  console.log(`\n════════ ${passou} passaram, ${falhou} falharam ════════`);
  if (falhou) {
    console.log('Não envie pro GitHub antes de resolver isto.');
    process.exit(1);
  }
  console.log('Pode enviar.');
  process.exit(0);
})();
