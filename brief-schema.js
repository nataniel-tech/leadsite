/* Esquema do questionário do cliente + conversão automática para o site — v2.
   Fluxo curto (9 perguntas essenciais) + extras opcionais. Fotos entram no próprio
   formulário (upload com compressão ou banco ilustrativo do ramo).
   Funciona no navegador e no Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./public/perfis.js'));
  else root.Brief = factory(root.Perfis);
})(typeof self !== 'undefined' ? self : this, function (Perfis) {

/* ─────────────── ETAPAS (fluxo essencial) ─────────────── */
const ETAPAS = [
  { id:'inicio', icone:'🤝', titulo:'Vamos começar', desc:'9 respostas e seu site fica pronto.',
    perguntas:[
      { id:'fechar', tipo:'radio', obrig:true, label:'Você quer fechar a criação do seu site?',
        ajuda:'Investimento único de R$ 97, sem mensalidade.',
        opcoes:[
          { v:'sim',    t:'Sim, quero fechar!',        d:'Vamos colocar seu site no ar' },
          { v:'talvez', t:'Quero ver como fica antes', d:'Preencho e decido depois' },
          { v:'duvida', t:'Tenho dúvidas',             d:'Prefiro conversar primeiro' },
        ] },
      { id:'nome', tipo:'texto', obrig:true, label:'Nome da loja / empresa',
        ajuda:'Exatamente como vai aparecer no topo do site.', ph:'Ex.: Padaria Pão Dourado' },
      { id:'whatsapp', tipo:'tel', obrig:true, label:'WhatsApp da empresa',
        ajuda:'Vira o botão verde do site — é por ele que os clientes falam com você.', ph:'(66) 99999-9999' },
    ] },
  { id:'negocio', icone:'📍', titulo:'Seu negócio', desc:'Ramo, onde fica e quando abre.',
    perguntas:[
      { id:'segmento', tipo:'segmento', obrig:true, label:'Qual o seu ramo?',
        ajuda:'A gente já monta serviços, textos e fotos do seu ramo — é só ajustar.' },
      { id:'endereco', tipo:'texto', obrig:true, label:'Endereço completo',
        ajuda:'Aparece no site e no mapa.', ph:'Ex.: Av. Bandeirantes, 1250 - Centro, Rondonópolis - MT' },
      { id:'h_semana', tipo:'texto', obrig:true, label:'Horário (segunda a sexta)', ph:'Ex.: 08:00 - 18:00' },
      { id:'h_fds', tipo:'texto', label:'Sábado e domingo', ph:'Ex.: Sáb 08:00 - 12:00 · Dom fechado' },
    ] },
  { id:'servicos', icone:'🛠️', titulo:'Serviços e preços', desc:'Os 3 principais. Já sugerimos do seu ramo.',
    perguntas:[
      { id:'lista_servicos', tipo:'lista', obrig:true, label:'Seus 3 principais serviços ou produtos',
        max:6, campos:[ {k:'titulo',p:'Nome'}, {k:'preco',p:'Preço (opcional)'} ] },
      { id:'cor', tipo:'cor', obrig:true, label:'Qual cor combina com a sua marca?' },
    ] },
  { id:'fotos', icone:'📷', titulo:'Fotos', desc:'Fotos reais vendem mais que qualquer texto. Pode mandar agora ou escolher as nossas.',
    perguntas:[
      { id:'fotos', tipo:'fotos', label:'Fotos da sua loja (capa + até 4)',
        ajuda:'Fotografe o balcão, a fachada, os produtos. Quem vê foto real confia mais.' },
      { id:'slogan', tipo:'texto', label:'Frase de efeito (opcional)',
        ajuda:'Se deixar em branco, criamos uma para o seu ramo.', ph:'Ex.: O melhor pão da cidade' },
    ] },
  { id:'final', icone:'🚀', titulo:'Revisar e publicar', desc:'Veja como ficou e ajuste o que quiser.',
    perguntas:[] },
];

/* extras opcionais — o cliente preenche DEPOIS, se quiser */
const EXTRAS = [
  { id:'prova', icone:'⭐', titulo:'Sua reputação', desc:'Só dados reais — nada é inventado no site.',
    perguntas:[
      { id:'nota_google', tipo:'texto', label:'Nota no Google (se tiver)', ph:'Ex.: 4,8' },
      { id:'qtd_avaliacoes', tipo:'texto', label:'Quantas avaliações no Google?', ph:'Ex.: 187' },
      { id:'fundacao', tipo:'texto', label:'Há quanto tempo funciona?', ph:'Ex.: 12 anos' },
      { id:'lista_depoimentos', tipo:'lista', label:'Depoimentos REAIS de clientes',
        ajuda:'Só frases que clientes realmente falaram. Sem depoimento, mostramos só a nota do Google.',
        max:3, campos:[ {k:'texto',p:'O que o cliente falou',multi:1}, {k:'autor',p:'Nome do cliente'} ] },
    ] },
  { id:'marketing', icone:'📣', titulo:'Promoção e redes', desc:'Aparecem no topo e no rodapé.',
    perguntas:[
      { id:'promocao', tipo:'texto', label:'Promoção para destacar', ph:'Ex.: 10% OFF na primeira compra' },
      { id:'instagram', tipo:'texto', label:'Instagram', ph:'@suaempresa' },
      { id:'facebook', tipo:'texto', label:'Facebook', ph:'suaempresa' },
      { id:'cnpj', tipo:'texto', label:'CNPJ', ph:'00.000.000/0000-00' },
    ] },
  { id:'clinica', icone:'🏥', titulo:'Convênios atendidos', desc:'Só aparece para clínica e farmácia.',
    perguntas:[
      { id:'convenios', tipo:'texto', label:'Convênios (separados por vírgula)',
        ph:'Ex.: Unimed, Amil, Particular' },
    ] },
];

const TOTAL_PERGUNTAS = ETAPAS.reduce((n, e) => n + e.perguntas.length, 0);

/* ─────────────── conversão: respostas → configuração do site ─────────────── */
const CORES = {
  verde:'esmeralda', azul:'oceano', vermelho:'vinho', laranja:'coral',
  amarelo:'ambar', roxo:'violeta', cinza:'grafite', oliva:'floresta',
};

function briefParaConfig(r, perfisMod) {
  const P = perfisMod || Perfis;
  const cfg = {};
  const chave = r.segmento && P.PERFIS[r.segmento] ? r.segmento : 'generico';
  P.aplicar(cfg, chave);                       // base do segmento (textos, serviços, paleta)

  const lim = (s, n) => String(s || '').trim().slice(0, n);
  const num = (s) => String(s || '').replace(/\D/g, '');

  cfg.nome = lim(r.nome, 60) || cfg.nome || 'Minha Empresa';
  if (lim(r.slogan, 120)) cfg.slogan = lim(r.slogan, 120);
  cfg.titulo = '';

  /* visual */
  if (r.cor && CORES[r.cor]) cfg.paleta = CORES[r.cor];
  cfg.estilo = 'moderno';
  cfg.fonte = 'moderna';
  cfg.escuro = '';
  cfg.perfil = chave;

  /* localização e prova real */
  cfg.endereco = lim(r.endereco, 140);
  const bairroMatch = String(r.endereco || '').match(/(?:-|,)\s*([^,-]+?)\s*$/);
  cfg.bairro = lim(r.bairro, 40) || (bairroMatch ? lim(bairroMatch[1], 40) : '');
  if (cfg.bairro) cfg.badge = 'Atendimento em ' + cfg.bairro;

  const anos = num(r.fundacao);
  if (anos && anos.length <= 2) cfg.anosAtendimento = anos;          // "12" = anos direto
  else if (anos && anos.length === 4) {
    const y = Math.min(Math.max(parseInt(anos, 10), 1950), new Date().getFullYear());
    const dif = new Date().getFullYear() - y;
    if (dif >= 0) cfg.anosAtendimento = String(dif);
  }

  cfg.notaMedia = lim(String(r.nota_google || '').replace(/estrelas?/i, '').trim(), 5);
  cfg.qtdAvaliacoes = num(r.qtd_avaliacoes).slice(0, 8);
  if (cfg.notaMedia) cfg.linkAvaliacoes = 'https://www.google.com/search?q=' + encodeURIComponent(cfg.nome + ' ' + (cfg.bairro || ''));

  /* serviços */
  const servs = (Array.isArray(r.lista_servicos) ? r.lista_servicos : [])
    .filter(s => s && lim(s.titulo, 60))
    .map(s => ({ titulo: lim(s.titulo, 60), descricao: lim(s.descricao, 200),
                 preco: r.mostrar_precos === 'nao' ? '' : lim(s.preco, 40) }));
  if (servs.length) cfg.servicos = servs.slice(0, 6);
  if (r.mostrar_precos === 'nao') cfg.mostrarPrecos = false;

  /* depoimentos — SÓ reais */
  const deps = (Array.isArray(r.lista_depoimentos) ? r.lista_depoimentos : [])
    .filter(x => x && lim(x.texto, 400))
    .map(x => ({ texto: lim(x.texto, 400), autor: lim(x.autor, 50) || 'Cliente', papel: 'Cliente' }));
  if (deps.length) cfg.depoimentos = deps.slice(0, 3);

  /* marketing / extras */
  cfg.promoTexto = lim(r.promocao, 90);
  cfg.instagram = lim(r.instagram, 90);
  cfg.facebook = lim(r.facebook, 90);
  cfg.cnpj = lim(r.cnpj, 22);
  cfg.convenios = String(r.convenios || '').split(/[,;]/).map(s => lim(s, 40)).filter(Boolean).slice(0, 10);

  /* fotos: data URIs viram URLs no servidor; banco fica como veio */
  const fotos = (Array.isArray(r.fotos) ? r.fotos : [])
    .map(f => typeof f === 'string' ? { data: f } : f)
    .filter(f => f && (f.data || f.url || f.banco))
    .slice(0, 5);
  if (fotos.length) cfg.fotos = fotos;

  /* horários */
  const hs = [];
  if (lim(r.h_semana, 40)) hs.push({ dia: 'Segunda a Sexta', hora: lim(r.h_semana, 40) });
  const fds = lim(r.h_fds, 60);
  if (fds) {
    const sab = fds.match(/s[aá]b[^:]*[:h]?\s*([\d:hs\s–-]*?)(?:\s*[,.;]|\s*dom|\s*$)/i);
    if (sab && lim(sab[1], 30)) hs.push({ dia: 'Sábado', hora: lim(sab[1], 30) });
    const dom = fds.match(/dom[^:]*[:h]?\s*([\d:hs\s–-]*?)\s*$/i);
    if (dom && lim(dom[1], 30)) hs.push({ dia: 'Domingo', hora: lim(dom[1], 30) });
  }
  if (hs.length) cfg.horarios = hs;

  /* contato */
  cfg.whatsapp = lim(r.whatsapp, 25);
  cfg.telefone = lim(r.telefone, 25);
  cfg.email = lim(r.email, 90);
  cfg.textoCta = lim(r.cta, 30);
  cfg.mapa = !!cfg.endereco;
  cfg.botaoFlutuante = !!cfg.whatsapp;

  /* mensagens por seção (botão de WhatsApp contextual) */
  cfg.msgs = {
    geral: 'Olá! Vim pelo site da ' + cfg.nome + ' e gostaria de mais informações.',
    hero: 'Olá! Vim pelo site da ' + cfg.nome + ' e gostaria de mais informações.',
    servicos: 'Olá! Quero saber mais sobre os serviços da ' + cfg.nome + '.',
    contato: 'Olá! Tenho uma dúvida sobre a ' + cfg.nome + '.',
  };

  cfg.descricao = lim(r.slogan || cfg.slogan, 158);
  cfg.palavras = [lim(P.PERFIS[chave] && P.PERFIS[chave].rotulo, 40), lim(cfg.bairro, 40), lim(cfg.nome, 40)]
    .filter(Boolean).join(', ').toLowerCase();
  cfg.animacoes = true;
  cfg.lgpd = true;
  cfg.creditos = true;
  cfg.secoes = { sobre: true, servicos: true, galeria: false, equipe: false,
    depoimentos: true, faq: false, horario: true, contato: true, numeros: false };
  return cfg;
}

/* resumo legível das respostas, para aparecer na ficha do CRM */
function resumo(r) {
  const it = [];
  const add = (k, v) => { if (v && String(v).trim()) it.push([k, Array.isArray(v) ? v.join(', ') : String(v)]); };
  add('Quer fechar?', { sim:'SIM — quer fechar', talvez:'Quer ver antes', duvida:'Tem dúvidas' }[r.fechar] || r.fechar);
  add('Empresa', r.nome);
  add('WhatsApp', r.whatsapp);
  add('Endereço', r.endereco);
  add('Slogan', r.slogan);
  add('Instagram', r.instagram); add('Facebook', r.facebook);
  add('Promoção', r.promocao); add('Nota Google', r.nota_google);
  add('Desde', r.fundacao); add('CNPJ', r.cnpj);
  add('Convênios', r.convenios);
  add('Fotos', (r.fotos || []).length ? (r.fotos || []).length + ' foto(s)' : '');
  return it;
}

return { ETAPAS, EXTRAS, TOTAL_PERGUNTAS, CORES, briefParaConfig, resumo };
});
