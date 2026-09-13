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
       npm ci
   Roda:
       npm run test:navegador                 tudo
       npm run test:navegador celular         só o app celular
       npm run test:navegador desktop         só o app de 3 abas
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const R = path.join(__dirname, '..');   // o projeto mora um nível acima de scripts/
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

  /* ─────────── descrição livre → duas IAs conversando ───────────
     Sem gastar crédito de API: a chamada de rede é substituída por respostas
     prontas. O que interessa aqui é o encadeamento (uma propõe, a outra
     critica, a primeira fecha) e o sanitizador, que é a parte que impede a IA
     de inventar depoimento ou de mandar campo que o gerador não conhece. */
  secao('descrever o site e deixar as duas IAs conversarem');

  window.BD.config.iaAtiva = true;
  window.BD.config.iaProvedor = 'gemini';
  window.BD.config.iaChave = 'chave-falsa-1';
  window.BD.config.iaProvedor2 = 'openrouter';
  window.BD.config.iaChave2 = 'chave-falsa-2';
  window.criarSitePara('ld_teste');
  await new Promise(r => setTimeout(r, 200));

  const caixa = doc.querySelector('#iaDescricao');
  chk(!!caixa, 'a caixa de descrição existe na tela de criar site');
  const botaoMontar = doc.querySelector('[onclick="montarSitePelaDescricao()"]');
  chk(!!botaoMontar, 'o botão "Montar o site com a IA" existe');

  /* vocabulário real do gerador — o teste não chuta nome de paleta/perfil.
     (Perfis é um módulo: Object.keys(Perfis) devolve PERFIS, MAPA, faqPara…
     e não serve de gabarito. Quem sabe os nomes é vocabularioDoSite.) */
  const vocab = window.vocabularioDoSite();
  const paletaOk = vocab.paletas[0];
  const perfilOk = vocab.perfis[0];
  chk(vocab.perfis.length > 5 && vocab.perfis.indexOf('PERFIS') < 0,
      'o vocabulário de perfis traz perfis de verdade, não nome de função',
      vocab.perfis.length + ' perfis, ex.: ' + vocab.perfis.slice(0, 3).join('/'));

  /* --- sanitizador isolado: prova social inventada tem que cair --- */
  const v = window.vocabularioDoSite ? window.vocabularioDoSite() : null;
  if (v) {
    const s1 = window.sanitizarDaIA({
      titulo: 'Barbearia do Zé',
      paleta: 'dourado-real-que-nao-existe',
      perfil: perfilOk,
      secoes: ['servicos', 'sobre', 'depoimentos', 'secao-que-nao-existe', 'faq', 'contato'],
      depoimentos: [{ autor: 'Fulano', texto: 'Ótimo' }],
      nota: '4,9', anos: '15',
    }, v, {});
    chk(s1.limpo.paleta === undefined, 'paleta inventada não entra no site');
    chk(s1.limpo.perfil === perfilOk, 'perfil válido entra');
    chk(!('depoimentos' in s1.limpo) && !('nota' in s1.limpo) && !('anos' in s1.limpo),
        'depoimento, nota e anos inventados são bloqueados');
    chk(s1.avisos.some(a => /bloqueado/i.test(a)), 'o usuário é avisado do que foi bloqueado',
        s1.avisos.length + ' avisos');
    chk(s1.limpo.secoes && s1.limpo.secoes.indexOf('depoimentos') < 0 &&
        s1.limpo.secoes.indexOf('secao-que-nao-existe') < 0,
        'seção desconhecida e seção de prova social vazia são descartadas');
  } else { chk(false, 'vocabularioDoSite exposto para teste', 'não está no window'); }

  /* --- a conversa inteira, com a rede substituída --- */
  const provaAntes = {
    depoimentos: JSON.stringify(window.cfg.depoimentos),
    nota: JSON.stringify(window.cfg.nota),
  };
  const falas = [];
  window.IA.chamarBruto = async (c, prompt) => {
    falas.push({ provedor: c.provedor, prompt });
    const n = falas.length;
    if (n === 1) return JSON.stringify({
      resumo: 'Entendi: barbearia séria, preto e dourado, destaque no degradê.',
      titulo: 'Barbearia do Zé', perfil: perfilOk, paleta: paletaOk,
      secoes: ['servicos', 'sobre', 'depoimentos', 'faq'],
      servicos: [{ nome: 'Degradê', descricao: 'Na tesoura e na máquina' }],
      nota: '5,0', depoimentos: [{ autor: 'Inventado', texto: 'Perfeito' }],
    });
    if (n === 2) return JSON.stringify({
      critica: 'Tirei a nota e o depoimento que ninguém deu, e o título estava genérico.',
      titulo: 'Barbearia do Zé — corte na régua', perfil: perfilOk, paleta: paletaOk,
      secoes: ['servicos', 'sobre', 'faq', 'horario'],
      servicos: [{ nome: 'Degradê', descricao: 'Na tesoura e na máquina', preco: 'R$ 45' }],
    });
    return JSON.stringify({
      acordo: 'Aceitei o título da segunda IA; mantive o degradê em primeiro.',
      titulo: 'Barbearia do Zé — corte na régua', subtitulo: 'Barba, cabelo e horário cumprido',
      perfil: perfilOk, paleta: paletaOk, fonte: Object.keys(window.SiteGen.FONTES)[0],
      secoes: ['servicos', 'sobre', 'faq', 'horario', 'contato'],
      servicos: [{ nome: 'Degradê', descricao: 'Na tesoura e na máquina', preco: 'R$ 45' },
                 { nome: 'Barba', descricao: 'Toalha quente', preco: 'R$ 30' }],
      faq: [{ p: 'Precisa agendar?', r: 'Sim, pelo WhatsApp' }],
      horario: 'Seg a sáb, 9h às 19h',
      /* sujeira de propósito na rodada FINAL: é ela que passa pelo sanitizador.
         Se isto entrar no cfg, o gerador publica nota e depoimento inventados. */
      paleta: 'dourado-real-que-nao-existe',
      nota: '5,0', depoimentos: [{ autor: 'Cliente Inventado', texto: 'Perfeito!' }],
    });
  };

  caixa.value = 'Site pra minha barbearia, tom sério, preto e dourado, destaque pro degradê e pro horário, sem texto enrolado';
  window.ULTIMA_DESC_IA = '';
  let estourouMontar = '';
  try { await window.montarSitePelaDescricao(); } catch (e) { estourouMontar = e.message; }
  await new Promise(r => setTimeout(r, 250));
  chk(!estourouMontar, 'montarSitePelaDescricao não explode', estourouMontar || 'rodou até o fim');

  chk(falas.length === 3, 'as duas IAs conversaram em 3 rodadas', falas.length + ' chamadas');
  chk(falas[0] && falas[0].provedor === 'gemini', 'rodada 1: a primeira IA propõe');
  chk(falas[1] && falas[1].provedor === 'openrouter', 'rodada 2: a segunda IA critica');
  chk(falas[2] && falas[2].provedor === 'gemini', 'rodada 3: a primeira responde e fecha');
  chk(/Barbearia do Zé"[\s\S]*?corte na régua/.test(falas[2].prompt) || /critic/i.test(falas[2].prompt),
      'a rodada 3 recebe a crítica da rodada 2 no prompt');

  const painel = (doc.querySelector('#iaConversaPainel') || {}).innerHTML || '';
  chk(/1ª IA/.test(painel) && /2ª IA/.test(painel), 'a conversa aparece na tela, com quem falou');
  chk(/Entrou no site/.test(painel), 'o painel lista o que entrou no site');
  chk(/bloqueado|Barrado/i.test(painel), 'o painel diz o que foi barrado');

  chk(window.cfg.titulo === 'Barbearia do Zé — corte na régua',
      'valeu a versão FINAL da conversa, não a primeira proposta', String(window.cfg.titulo));
  chk((window.cfg.servicos || []).length === 2, 'os serviços da rodada final entraram',
      (window.cfg.servicos || []).length + ' serviços');
  /* o cfg já vem com depoimentos de exemplo desde antes (problema antigo do app,
     não desta feature): o que importa aqui é que a IA não tenha ACRESCENTADO nada */
  chk(JSON.stringify(window.cfg.depoimentos) === provaAntes.depoimentos &&
      JSON.stringify(window.cfg.nota) === provaAntes.nota,
      'a IA não acrescentou prova social nenhuma ao cfg');
  chk(window.cfg.paleta !== 'dourado-real-que-nao-existe',
      'paleta inventada na rodada final não entrou no cfg', 'paleta=' + window.cfg.paleta);

  /* --- sem segunda IA: funciona, mas avisa que trabalhou sozinha --- */
  falas.length = 0;
  window.BD.config.iaProvedor2 = '';
  window.BD.config.iaChave2 = '';
  window.criarSitePara('ld_teste');
  await new Promise(r => setTimeout(r, 150));
  const caixa2 = doc.querySelector('#iaDescricao');
  caixa2.value = 'Site simples pra minha barbearia, tom sério e direto';
  try { await window.montarSitePelaDescricao(); } catch (e) { estourouMontar = e.message; }
  await new Promise(r => setTimeout(r, 200));
  chk(falas.length === 1, 'com uma IA só, é uma chamada só (sem conversa fingida)', falas.length + ' chamadas');
  chk(/sozinha/i.test((doc.querySelector('#iaConversaPainel') || {}).innerHTML || ''),
      'e o painel diz que ela trabalhou sozinha');

  /* --- IA fora do ar: nada muda no site e o usuário é avisado --- */
  const tituloAntes = window.cfg.titulo;
  window.BD.config.iaProvedor2 = 'openrouter';
  window.BD.config.iaChave2 = 'chave-falsa-2';
  window.IA.chamarBruto = async () => { throw new Error('401 chave inválida'); };
  try { await window.montarSitePelaDescricao(); } catch (e) { estourouMontar = e.message; }
  await new Promise(r => setTimeout(r, 200));
  chk(!estourouMontar, 'IA falhando não derruba o app', estourouMontar || 'capturou o erro');
  chk(window.cfg.titulo === tituloAntes, 'com a IA falhando, nada foi alterado no site');
  chk(/Deu errado|falhou/i.test((doc.querySelector('#iaConversaPainel') || {}).innerHTML || ''),
      'e o painel mostra o que aconteceu');

  /* --- sem IA nenhuma: a caixa continua lá, o botão não --- */
  window.BD.config.iaAtiva = false;
  window.BD.config.iaChave = '';
  window.BD.config.iaProvedor = 'openai';   /* sem chave embutida */
  window.criarSitePara('ld_teste');
  await new Promise(r => setTimeout(r, 200));
  chk(!!doc.querySelector('#iaDescricao'), 'sem IA a caixa de descrição continua visível');
  chk(!doc.querySelector('[onclick="montarSitePelaDescricao()"]'),
      'e o botão de montar some (não adianta prometer o que não roda)');
  chk(/Ligar a IA/.test(doc.querySelector('#tela-site').innerHTML), 'com o caminho para ligar a IA');

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
    /* Duas causas possíveis, e a mensagem antiga confundia as duas: ou o jsdom
       não está instalado, ou está instalado num Node velho demais — o jsdom 29
       exige Node ^20.19 || ^22.13 || >=24 e no Node 18 ele nem carrega. Dizer
       "instale o jsdom" para quem já instalou só faz perder tempo. */
    let engines = null;
    try { engines = require('jsdom/package.json').engines || null; } catch (e2) {}

    if (engines && engines.node) {
      console.error('O jsdom está instalado, mas não carrega neste Node.');
      console.error('  Node atual : ' + process.version);
      console.error('  jsdom pede : ' + engines.node);
      console.error('\nEstes testes de DOM precisam de Node 20.19 ou mais novo.');
      console.error('O aplicativo e o verificar.js continuam rodando em Node 18.\n');
    } else {
      console.error('Estes testes precisam do jsdom, que está nos devDependencies:');
      console.error('\n    npm ci        (ou: npm i --save-dev jsdom)\n');
    }
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
