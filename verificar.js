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
     4. integração  sobe o servidor numa porta livre e testa as duas
                    interfaces num DOM de verdade: cada aba abre? o site
                    é gerado? os botões funcionam com pop-up bloqueado?

   Uso:
       node verificar.js            tudo
       node verificar.js --rapido   só sintaxe e build (não sobe servidor)

   Sem dependências externas: usa só o que já vem no Node 18+.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const R = __dirname;
const RAPIDO = process.argv.includes('--rapido');

let passou = 0, falhou = 0;
const ok = (rotulo, detalhe) => { console.log(`  ✔ ${rotulo}${detalhe ? ' — ' + detalhe : ''}`); passou++; };
const erro = (rotulo, detalhe) => { console.log(`  ✘ ${rotulo}${detalhe ? ' — ' + detalhe : ''}`); falhou++; };

/* ─────────────────────────── 1. sintaxe ─────────────────────────── */
function checarSintaxe() {
  console.log('\n── 1. Sintaxe ──');

  const js = ['server.js', 'sitegen.js', 'build-previa.js', 'build.js', 'verificar.js',
              'brief-schema.js', 'public/app.js', 'public/perfis.js', 'public/qrcode.js'];
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

  const r = spawnSync(process.execPath, [path.join(R, 'build.js'), '--check'], { encoding: 'utf8' });
  const saida = ((r.stdout || '') + (r.stderr || '')).trim();
  r.status === 0 ? ok('public/celular.html', 'igual ao index.html') : erro('public/celular.html', saida.split('\n').pop());

  /* As prévias são o que o GitHub Pages publica. Elas reempacotam public/,
     sitegen.js, brief-schema.js e o dataset — ou seja, mudam toda vez que a
     fonte muda. Sem esta checagem elas envelhecem em silêncio (já aconteceu:
     o previa.html ficou sem a correção do rascunho que estava no app.js). */
  const rp = spawnSync(process.execPath, [path.join(R, 'build-previa.js'), '--check'], { encoding: 'utf8' });
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
function checarCaminhos() {
  console.log('\n── 3. Caminhos nos HTML publicados ──');

  const htmls = fs.readdirSync(R).filter(f => f.endsWith('.html'));
  let ruins = 0;

  for (const f of htmls) {
    const txt = fs.readFileSync(path.join(R, f), 'utf8');

    /* (a) caminho relativo tem que existir no disco — senão a imagem some */
    const relativos = new Set([...txt.matchAll(/["'(]\.?\/((?:public\/)?fotos\/[^"')\s]+)/g)].map(m => m[1]));
    for (const ref of relativos) {
      if (!fs.existsSync(path.join(R, ref))) {
        ruins++;
        erro(f, `aponta para "${ref}" e esse arquivo não existe`);
      }
    }

    /* (b) caminho absoluto só funciona com o node server.js na raiz do domínio.
       No GitHub Pages o projeto mora em /leadsite/, então "/fotos/..." escapa
       da pasta e dá 404. Por isso as prévias usam caminho relativo. */
    const absolutos = new Set([...txt.matchAll(/["'(]\/(fotos\/[^"')\s]+)/g)].map(m => '/' + m[1]));
    for (const ref of absolutos) {
      ruins++;
      erro(f, `usa caminho absoluto "${ref}" — quebra no GitHub Pages (use public/fotos/...)`);
    }
  }

  if (!ruins) ok(`${htmls.length} HTML da raiz`, 'todas as fotos que eles citam existem, e nada de caminho absoluto');
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
      ['/padaria-pao-dourado.html', 200, 'demo de site (era 404)'],
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
