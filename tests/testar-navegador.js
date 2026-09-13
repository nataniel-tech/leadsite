#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   testar-navegador.js — testa o LeadSite num navegador de verdade (DOM)

   verificar.js confere sintaxe, rotas e cabeçalhos. Este arquivo vai além:
   abre as páginas num DOM que executa o JavaScript do app, e clica nas abas
   e nos botões como o usuário faz. É o que pega bug do tipo "a aba não abre".

   O que ele cobre:
     · cada aba das duas interfaces abre de verdade (classe de visível + conteúdo)
     · o botão "Criar site" de um lead leva para a aba de criar
     · o site é gerado e leva o nome, os serviços e o WhatsApp do formulário
     · "ver o site" funciona com pop-up BLOQUEADO (celular, WebView, prévia)
     · um rascunho velho no celular não derruba o app, e um rascunho bom é
       recuperado sem perder nada

   Instala uma vez (só para rodar os testes, o app não depende disto):
       npm i --no-save jsdom
   Roda:
       node testar-navegador.js                 tudo
       node testar-navegador.js celular         só o app celular
       node testar-navegador.js desktop         só o app de 3 abas
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const R = path.join(__dirname, "..");
const FILTRO = (process.argv[2] || '').toLowerCase();

let passou = 0, falhou = 0;
const chk = (ok, rotulo, detalhe) => {
  console.log(`  ${ok ? '✔' : '✘'} ${rotulo}${detalhe ? ' — ' + detalhe : ''}`);
  ok ? passou++ : falhou++;
};
const secao = t => console.log('\n  — ' + t + ' —');

/* ─────────────── servidor de teste (porta livre, banco à parte) ─────────────── */
function subirServidor(porta) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(R, 'server.js')], {
      cwd: R, env: { ...process.env, PORT: String(porta) }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    p.stdout.on('data', d => { log += d; });
    p.stderr.on('data', d => { log += d; });
    const estouro = setTimeout(() => reject(new Error('servidor não subiu. Log:\n' + log)), 8000);
    const tentar = () => {
      const req = http.get({ host: '127.0.0.1', port: porta, path: '/', timeout: 1000 }, res => {
        res.resume(); clearTimeout(estouro); resolve(p);
      });
      req.on('error', () => setTimeout(tentar, 250));
      req.on('timeout', () => { req.destroy(); setTimeout(tentar, 250); });
    };
    setTimeout(tentar, 400);
  });
}

/* ─────────── lead de teste: cria e apaga, nunca mexe nos seus dados ─────────── */
const OSM_TESTE = 'way/teste-automatizado-' + process.pid;

async function criarLeadDeTeste(base) {
  await fetch(base + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresas: [{
        osmId: OSM_TESTE, nome: 'Padaria Pao Dourado (teste)', telefone: '(66) 99999-8888',
        cidade: 'Rondonopolis', categoria: 'padaria', endereco: 'Rua das Flores, 100', bairro: 'Centro',
      }],
    }),
  }).catch(() => {});
  const lista = await (await fetch(base + '/api/leads')).json().catch(() => []);
  const achado = lista.find(l => l.osmId === OSM_TESTE);
  return achado ? achado.id : null;
}

async function apagarLeadDeTeste(base, id) {
  if (!id) return;
  try { await fetch(base + '/api/leads/' + id, { method: 'DELETE' }); } catch (e) {}
}

/* ─────────────────────────── os testes ─────────────────────────── */
async function testarCelular(JSDOM, VirtualConsole, base) {
  console.log('\n═══ APP CELULAR · /celular.html ═══');
  const url = base + '/celular.html';
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => erros.push((e.stack || e.message || '').split('\n')[0]));
  vc.on('error', (...a) => erros.push(a.map(String).join(' ')));

  const html = await (await fetch(url)).text();
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc, url,
    beforeParse(w) {
      w.fetch = (u, o) => fetch(new URL(String(u), url).href, o).catch(() => ({ ok: false, status: 0, json: () => Promise.resolve([]) }));
      w.scrollTo = () => {};
      w.addEventListener('error', e => erros.push((e.error && e.error.message) || e.message));
    },
  });
  const { window } = dom, doc = window.document;
  await new Promise(r => setTimeout(r, 1500));

  secao('cada aba abre de verdade');
  for (const aba of ['buscar', 'clientes', 'site', 'ajustes']) {
    const b = doc.querySelector(`.abas button[data-aba="${aba}"]`);
    if (!b) { chk(false, `aba "${aba}"`, 'o botão não existe'); continue; }
    b.click();
    await new Promise(r => setTimeout(r, 250));
    const t = doc.querySelector('#tela-' + aba);
    const visivel = t.classList.contains('ativa');
    chk(visivel && t.innerHTML.trim().length > 0, `aba "${aba}"`,
      `visível=${visivel} conteúdo=${t.innerHTML.trim().length} chars`);
  }

  secao('criar site a partir de um lead');
  window.BD.leads.push({
    id: 'ld_teste', nome: 'Padaria Pao Dourado', telefone: '(66) 99999-8888',
    cidade: 'Rondonopolis', categoria: 'padaria', endereco: 'Rua das Flores, 100',
    etapa: 'novo', criadoEm: new Date().toISOString(), notas: [],
  });
  let estourou = '';
  try { window.criarSitePara('ld_teste'); } catch (e) { estourou = e.message; }
  chk(!estourou, 'criarSitePara(lead existente)', estourou || 'abriu a aba do site');
  chk(doc.querySelector('#tela-site').classList.contains('ativa'), 'foi para a aba Site');
  chk((doc.querySelector('#sNome') || {}).value === 'Padaria Pao Dourado', 'nome do lead preenchido');

  estourou = '';
  try { window.criarSitePara('lead-que-nao-existe'); } catch (e) { estourou = e.message; }
  chk(!estourou, 'criarSitePara(lead apagado) não explode', estourou || 'avisa e volta para Clientes');
  chk(doc.querySelector('#tela-clientes').classList.contains('ativa'), 'volta para a aba Clientes');

  secao('o site gerado leva os dados do formulário');
  window.ir('site');
  await new Promise(r => setTimeout(r, 200));
  doc.querySelector('#sNome').value = 'Padaria Pao Dourado';
  doc.querySelector('#sWhats').value = '66999998888';
  doc.querySelector('#sServicos').value = 'Bolos de aniversario\nPao frances';
  const gerado = window.htmlDoSite();
  chk(/<!DOCTYPE html>/i.test(gerado), 'gera um documento HTML', gerado.length + ' chars');
  chk(/Padaria Pao Dourado/.test(gerado), 'nome entrou no site');
  chk(/wa\.me\/5566999998888/.test(gerado), 'WhatsApp entrou no site');
  chk(/<footer/.test(gerado), 'site tem rodapé');

  secao('ver o site quando o navegador bloqueia pop-up');
  window.open = () => null;
  window.verSite();
  await new Promise(r => setTimeout(r, 120));
  chk(!!doc.querySelector('#folha iframe'), 'window.open devolve null: prévia aparece dentro do app');

  window.open = () => { throw new Error('bloqueado'); };
  window.fechar(); window.verSite();
  await new Promise(r => setTimeout(r, 120));
  chk(!!doc.querySelector('#folha iframe'), 'window.open lança erro: prévia aparece dentro do app');

  window.open = () => ({ close() {}, document: { open() { throw new Error('sem escrita'); }, write() {}, close() {} } });
  window.fechar(); window.verSite();
  await new Promise(r => setTimeout(r, 120));
  chk(!!doc.querySelector('#folha iframe'), 'janela que não aceita escrita: prévia aparece dentro do app');

  let escrito = 0;
  window.open = () => ({ document: { open() {}, write(h) { escrito = h.length; }, close() {} } });
  window.fechar(); window.verSite();
  chk(escrito > 5000, 'pop-up liberado: site abre em outra aba', escrito + ' chars');

  const reais = erros.filter(e => !/Not implemented: Window's (scrollTo|open)/.test(e));
  chk(reais.length === 0, 'nenhum erro de JavaScript durante tudo isso',
    reais.length ? reais.slice(0, 3).join(' | ') : '0 erros');
  window.close();
}

async function testarDesktop(JSDOM, VirtualConsole, base, leadId) {
  console.log('\n═══ APP DE 3 ABAS · / ═══');
  const url = base + '/';
  const html = await (await fetch(url)).text();

  const abrir = async (rascunho) => {
    const erros = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => erros.push((e.stack || e.message || '').split('\n')[0]));
    vc.on('error', (...a) => erros.push(a.map(String).join(' ')));
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc, url,
      beforeParse(w) {
        w.fetch = (u, o) => fetch(new URL(String(u), url).href, o).catch(() => ({ ok: false, status: 0, json: () => Promise.resolve([]) }));
        w.scrollTo = () => {};
        if (rascunho) w.localStorage.setItem('ls_rascunho', rascunho);
        w.addEventListener('error', e => erros.push((e.error && e.error.message) || e.message));
      },
    });
    await new Promise(r => setTimeout(r, 2000));
    return { window: dom.window, doc: dom.window.document, erros };
  };

  {
    const { window, doc, erros } = await abrir(null);

    secao('cada aba abre de verdade');
    for (const aba of ['buscar', 'crm', 'criar']) {
      const b = doc.querySelector(`.aba[data-aba="${aba}"]`);
      if (!b) { chk(false, `aba "${aba}"`, 'o botão não existe'); continue; }
      b.click();
      await new Promise(r => setTimeout(r, 400));
      const p = doc.querySelector('#painel-' + aba);
      const visivel = p.classList.contains('ativo');
      chk(visivel && p.innerHTML.trim().length > 0, `aba "${aba}"`,
        `visível=${visivel} conteúdo=${p.innerHTML.trim().length} chars`);
    }

    secao('botão "Criar site" vindo do CRM');
    doc.querySelector('.aba[data-aba="crm"]').click();
    await new Promise(r => setTimeout(r, 1200));
    const btn = doc.querySelector('[data-site]');
    if (btn) {
      btn.click();
      await new Promise(r => setTimeout(r, 400));
      chk(doc.querySelector('#painel-criar').classList.contains('ativo'), 'leva para a aba "Criar site"');
      chk(/Criando site para|respostas/.test(doc.querySelector('#paraQuem').innerHTML),
        'diz para quem é o site', doc.querySelector('#paraQuem').textContent.trim().slice(0, 55));
    } else {
      chk(false, 'botão "🎨 Criar site" no CRM',
        leadId ? 'o lead de teste não apareceu na lista' : 'não deu para criar o lead de teste na API');
    }

    secao('botão "Abrir" com pop-up bloqueado');
    window.open = () => null;
    doc.querySelector('#btnAbrir').click();
    await new Promise(r => setTimeout(r, 200));
    chk((doc.querySelector('#preview').srcdoc || '').length > 5000,
      'o site vai para o preview da página em vez de não fazer nada',
      (doc.querySelector('#preview').srcdoc || '').length + ' chars');

    const reais = erros.filter(e => !/Not implemented|Could not parse CSS/.test(e));
    chk(reais.length === 0, 'nenhum erro de JavaScript', reais.length ? reais.slice(0, 3).join(' | ') : '0 erros');
    window.close();
  }

  {
    secao('rascunho VELHO de outra versão não pode derrubar o app');
    const quebrado = JSON.stringify({ nome: 'Padaria Pao Dourado', secoes: null, servicos: 'nao e lista', paleta: 12345 });
    const { window, doc, erros } = await abrir(quebrado);
    for (const aba of ['buscar', 'crm', 'criar']) {
      const b = doc.querySelector(`.aba[data-aba="${aba}"]`);
      let ok = false, info = '';
      try {
        b.click();
        await new Promise(r => setTimeout(r, 350));
        const p = doc.querySelector('#painel-' + aba);
        ok = p.classList.contains('ativo') && p.innerHTML.trim().length > 0;
        info = p.innerHTML.trim().length + ' chars';
      } catch (e) { info = 'ERRO: ' + e.message; }
      chk(ok, `aba "${aba}" continua abrindo`, info);
    }
    await new Promise(r => setTimeout(r, 500));
    const toast = (doc.querySelector('#toast') || {}).textContent || '';
    chk(/descartad|erro/i.test(toast), 'o usuário é avisado', 'toast="' + toast.slice(0, 60) + '"');
    const reais = erros.filter(e => !/Not implemented|Could not parse CSS/.test(e));
    chk(reais.length === 0, 'nenhum erro de JavaScript', reais.length ? reais.slice(0, 2).join(' | ') : '0 erros');
    window.close();
  }

  {
    secao('rascunho BOM tem que voltar inteiro (sem perder o que o usuário digitou)');
    const bom = JSON.stringify({
      nome: 'Oficina Confianca', whatsapp: '66999112233',
      servicos: [{ titulo: 'Troca de oleo', descricao: 'Oleo e filtro', preco: 'R$ 120' }],
      horarios: [{ dia: 'Segunda a Sexta', hora: '08:00 - 18:00' }],
      secoes: { sobre: true, servicos: true, contato: true }, paleta: 'oceano',
    });
    const { window, doc } = await abrir(bom);
    const el = doc.querySelector('[data-c="nome"]');
    chk(el && el.value === 'Oficina Confianca', 'nome recuperado', el ? JSON.stringify(el.value) : 'campo não existe');
    const prev = doc.querySelector('#preview').srcdoc || '';
    chk(/Oficina Confianca/.test(prev), 'nome está no site');
    chk(/Troca de oleo/.test(prev), 'serviço do rascunho está no site');
    chk(/R\$ 120/.test(prev), 'preço do rascunho está no site');
    chk(/wa\.me\/5566999112233/.test(prev), 'WhatsApp do rascunho está no site');
    window.close();
  }
}

/* ─────────────────────────── main ─────────────────────────── */
(async () => {
  let JSDOM, VirtualConsole;
  try {
    ({ JSDOM, VirtualConsole } = require('jsdom'));
  } catch (e) {
    console.error('Estes testes precisam do jsdom. Instale uma vez com:\n\n    npm i --no-save jsdom\n');
    process.exit(2);
  }

  const porta = 3500 + Math.floor(Math.random() * 400);
  const base = `http://127.0.0.1:${porta}`;
  console.log(`Subindo o servidor na porta ${porta}…`);
  const proc = await subirServidor(porta);

  let leadId = null;
  try {
    if (FILTRO !== 'desktop') await testarCelular(JSDOM, VirtualConsole, base);
    if (FILTRO !== 'celular') {
      /* O teste do CRM precisa de um lead. Cria um e apaga no fim, para não
         deixar lixo no seu banco de verdade. */
      leadId = await criarLeadDeTeste(base);
      console.log(leadId ? '\n(lead de teste criado: ' + leadId + ' — será apagado no fim)'
                         : '\n(aviso: não consegui criar o lead de teste na API)');
      await testarDesktop(JSDOM, VirtualConsole, base, leadId);
    }
  } finally {
    await apagarLeadDeTeste(base, leadId);
    if (leadId) console.log('(lead de teste apagado)');
    proc.kill('SIGTERM');
  }

  console.log(`\n════════ ${passou} passaram, ${falhou} falharam ════════`);
  process.exit(falhou ? 1 : 0);
})().catch(e => { console.error('\nFALHA:', e); process.exit(1); });
