/* Gerador de sites v3 — layouts por ramo, variação anti-igualdade, prova social real.
   Funciona no navegador e no Node. Saída: um único HTML autossuficiente e leve.
   Regras de ouro:
   - NUNCA inventar depoimento, nota, anos de mercado ou avaliações.
   - Até 6 fotos, sempre leves (URLs; o servidor hospeda os uploads).
   - Mobile-first: botões grandes, uma coluna no celular, duas+ no desktop. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SiteGen = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const PALETAS = {
    esmeralda:  { p:'#059669', d:'#064e3b', l:'#ecfdf5', a:'#10b981' },
    oceano:     { p:'#0284c7', d:'#0c4a6e', l:'#f0f9ff', a:'#38bdf8' },
    vinho:      { p:'#be123c', d:'#4c0519', l:'#fff1f2', a:'#f43f5e' },
    ambar:      { p:'#d97706', d:'#451a03', l:'#fffbeb', a:'#f59e0b' },
    violeta:    { p:'#7c3aed', d:'#2e1065', l:'#f5f3ff', a:'#a78bfa' },
    grafite:    { p:'#334155', d:'#0f172a', l:'#f8fafc', a:'#64748b' },
    floresta:   { p:'#4d7c0f', d:'#1a2e05', l:'#f7fee7', a:'#84cc16' },
    coral:      { p:'#ea580c', d:'#431407', l:'#fff7ed', a:'#fb923c' },
    turquesa:   { p:'#0d9488', d:'#042f2e', l:'#f0fdfa', a:'#2dd4bf' },
    rosa:       { p:'#db2777', d:'#500724', l:'#fdf2f8', a:'#f472b6' },
    indigo:     { p:'#4f46e5', d:'#1e1b4b', l:'#eef2ff', a:'#818cf8' },
    bronze:     { p:'#92400e', d:'#3f2004', l:'#fefce8', a:'#d97706' },
  };

  const FONTES = {
    moderna:  { h:"'Segoe UI',system-ui,-apple-system,'Helvetica Neue',sans-serif", b:"'Segoe UI',system-ui,sans-serif" },
    classica: { h:"Georgia,'Times New Roman',serif", b:"Georgia,'Times New Roman',serif" },
    tech:     { h:"'Inter','SF Pro Display',system-ui,sans-serif", b:"'Inter',system-ui,sans-serif" },
    friendly: { h:"'Trebuchet MS',Verdana,sans-serif", b:"'Trebuchet MS',Verdana,sans-serif" },
    editorial:{ h:"'Playfair Display',Georgia,serif", b:"'Segoe UI',system-ui,sans-serif" },
  };

  const ESTILOS = {
    minimalista: { radius:'4px',  shadow:'none', border:'1px solid rgba(0,0,0,.08)' },
    moderno:     { radius:'16px', shadow:'0 10px 30px rgba(0,0,0,.08)', border:'1px solid var(--line)' },
    elegante:    { radius:'2px',  shadow:'0 2px 12px rgba(0,0,0,.06)', border:'1px solid rgba(0,0,0,.1)' },
    ousado:      { radius:'24px', shadow:'0 18px 45px rgba(0,0,0,.16)', border:'1px solid var(--line)' },
  };

  /* fotos de banco por ramo (ilustrativas, com crédito no rodapé) */
  const BANCO = {
    padaria:'/fotos/banco/padaria.jpg', restaurante:'/fotos/banco/restaurante.jpg',
    lanchonete:'/fotos/banco/restaurante.jpg', bar_cafe:'/fotos/banco/restaurante.jpg',
    oficina:'/fotos/banco/oficina.jpg', autopecas:'/fotos/banco/oficina.jpg',
    salao:'/fotos/banco/salao.jpg', clinica:'/fotos/banco/clinica.jpg',
    farmacia:'/fotos/banco/mercado.jpg', hotel:'/fotos/banco/hotel.jpg',
    academia:'/fotos/banco/academia.jpg', petshop:'/fotos/banco/petshop.jpg',
    mercado:'/fotos/banco/mercado.jpg', floricultura:'/fotos/banco/floricultura.jpg',
    veterinaria:'/fotos/banco/petshop.jpg',
  };

  /* comportamento por ramo: bloco exclusivo, rótulo e CTA */
  const RAMOS = {
    padaria:      { bloco:'menu',   rotulo:'Cardápio',        cta:'Pedir pelo WhatsApp', tipo:'Bakery',              verbo:'pedir' },
    restaurante:  { bloco:'menu',   rotulo:'Cardápio',        cta:'Fazer pedido',        tipo:'Restaurant',         verbo:'pedir' },
    lanchonete:   { bloco:'menu',   rotulo:'Cardápio',        cta:'Fazer pedido',        tipo:'Restaurant',         verbo:'pedir' },
    bar_cafe:     { bloco:'menu',   rotulo:'Cardápio',        cta:'Fazer pedido',        tipo:'Restaurant',         verbo:'pedir' },
    mercado:      { bloco:'menu',   rotulo:'Produtos',        cta:'Pedir pelo WhatsApp', tipo:'GroceryStore',       verbo:'pedir' },
    petshop:      { bloco:'menu',   rotulo:'Produtos e serviços', cta:'Pedir pelo WhatsApp', tipo:'PetStore',       verbo:'pedir' },
    floricultura: { bloco:'menu',   rotulo:'Buquês e arranjos', cta:'Encomendar',        tipo:'Florist',            verbo:'encomendar' },
    oficina:      { bloco:'oficina',rotulo:'Serviços',        cta:'Pedir orçamento',     tipo:'AutoRepair',         verbo:'orçar' },
    autopecas:    { bloco:'oficina',rotulo:'Peças e serviços',cta:'Pedir orçamento',     tipo:'AutoPartsStore',     verbo:'orçar' },
    salao:        { bloco:'agenda', rotulo:'Serviços e valores',cta:'Agendar horário',   tipo:'BeautySalon',        verbo:'agendar' },
    clinica:      { bloco:'convenios', rotulo:'Especialidades', cta:'Agendar consulta',  tipo:'MedicalClinic',      verbo:'agendar' },
    farmacia:     { bloco:'convenios', rotulo:'Serviços',      cta:'Falar no WhatsApp',   tipo:'Pharmacy',           verbo:'consultar' },
    hotel:        { bloco:'quartos', rotulo:'Acomodações',     cta:'Reservar agora',      tipo:'Hotel',              verbo:'reservar' },
    academia:     { bloco:'planos',  rotulo:'Planos',          cta:'Começar agora',       tipo:'HealthClub',         verbo:'assinar' },
    advocacia:    { bloco:'areas',   rotulo:'Áreas de atuação',cta:'Falar com advogado',  tipo:'LegalService',       verbo:'consultar' },
    imobiliaria:  { bloco:'areas',   rotulo:'Como trabalhamos',cta:'Falar com corretor',  tipo:'RealEstateAgent',    verbo:'consultar' },
    escola:       { bloco:'areas',   rotulo:'Cursos',          cta:'Garantir vaga',       tipo:'EducationalOrganization', verbo:'matricular' },
    papelaria:    { bloco:'areas',   rotulo:'O que você encontra', cta:'Pedir pelo WhatsApp', tipo:'Store',           verbo:'pedir' },
    lavanderia:   { bloco:'areas',   rotulo:'Serviços',        cta:'Pedir coleta',        tipo:'DryCleaningOrLaundry', verbo:'pedir' },
    otica:        { bloco:'areas',   rotulo:'Serviços',        cta:'Agendar avaliação',   tipo:'Optician',           verbo:'agendar' },
    construcao:   { bloco:'areas',   rotulo:'Produtos e serviços', cta:'Pedir orçamento', tipo:'HardwareStore',      verbo:'orçar' },
    moveis:       { bloco:'areas',   rotulo:'Linhas de móveis',cta:'Pedir orçamento',     tipo:'FurnitureStore',     verbo:'orçar' },
    eletronicos:  { bloco:'areas',   rotulo:'Produtos e assistência', cta:'Falar no WhatsApp', tipo:'ElectronicsStore', verbo:'consultar' },
    roupas:       { bloco:'areas',   rotulo:'Coleções',        cta:'Falar no WhatsApp',   tipo:'ClothingStore',      verbo:'consultar' },
    veterinaria:  { bloco:'menu',   rotulo:'Serviços',        cta:'Agendar pelo WhatsApp',tipo:'VeterinaryCare',     verbo:'agendar' },
  };
  const RAMO_PADRAO = { bloco:'cards', rotulo:'Serviços', cta:'Pedir orçamento', tipo:'LocalBusiness', verbo:'orçar' };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const attr = esc;
  const soDigitos = (s) => String(s || '').replace(/\D/g, '');
  const linhas = (s) => Array.isArray(s) ? s.filter(Boolean) : String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  const I = {
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.5-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
    insta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    face:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>',
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    carro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7" cy="15" r="1.5"/><circle cx="17" cy="15" r="1.5"/></svg>',
    escudo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/><polyline points="9 11.5 11 13.5 15 9.5"/></svg>',
    calendario:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    cama:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><path d="M2 9h20v3a2 2 0 0 1-2 2h-3v4H7v-4H4a2 2 0 0 1-2-2z"/><path d="M7 9V6h4v3"/></svg>',
    raio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2 3h3l2.6 12.4A2 2 0 0 0 9.6 17H19a2 2 0 0 0 2-1.6L23 7H6"/></svg>',
  };

  function horariosSchema(hs) {
    const MAPA = {
      'segunda':'Monday','terça':'Tuesday','terca':'Tuesday','quarta':'Wednesday','quinta':'Thursday',
      'sexta':'Friday','sábado':'Saturday','sabado':'Saturday','domingo':'Sunday',
    };
    const out = [];
    for (const h of (hs || [])) {
      if (!h || !h.dia || !h.hora) continue;
      const m = String(h.hora).match(/(\d{1,2})[:h](\d{2})?\s*[-–às]+\s*(\d{1,2})[:h](\d{2})?/i);
      if (!m) continue;
      const abre = `${m[1].padStart(2,'0')}:${m[2] || '00'}`;
      const fecha = `${m[3].padStart(2,'0')}:${m[4] || '00'}`;
      const dia = String(h.dia).toLowerCase();
      const dias = [];
      if (dia.includes('a sex') || dia.includes('a sext')) dias.push('Monday','Tuesday','Wednesday','Thursday','Friday');
      else for (const [k, v] of Object.entries(MAPA)) if (dia.includes(k)) dias.push(v);
      if (dias.length) out.push({ '@type':'OpeningHoursSpecification', dayOfWeek:[...new Set(dias)], opens:abre, closes:fecha });
    }
    return out;
  }

  function gerar(cfg) {
    const c = cfg || {};
    const nome = (c.nome || 'Minha Empresa').trim();
    const pal = c.paletaCustom ? c.paletaCustom : (PALETAS[c.paleta] || PALETAS.esmeralda);
    const fnt = FONTES[c.fonte] || FONTES.moderna;
    const est = ESTILOS[c.estilo] || ESTILOS.moderno;
    const sec = c.secoes || {};
    const dark = !!c.escuro && c.escuro !== '0';
    const ramo = RAMOS[c.perfil] || RAMO_PADRAO;

    /* ── variação determinística: dois clientes do mesmo ramo nunca ficam iguais ── */
    const variante = Number.isInteger(c.variante) ? c.variante : hash(nome + '|' + (c.perfil || '')) % 3;

    /* ── contato / WhatsApp com mensagem por seção ── */
    const tel = soDigitos(c.whatsapp);
    const waNum = tel ? (tel.length <= 11 ? '55' + tel : tel) : '';
    const msgs = c.msgs || {};
    const msgPadrao = msgs.geral || `Olá! Vim pelo site da ${nome} e gostaria de mais informações.`;
    const msgDe = (tipo, extra) => {
      const base = msgs[tipo];
      if (base) return extra ? base + ' ' + extra : base;
      return msgPadrao;
    };
    const waLink = (extra) => waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(extra || msgPadrao)}` : '';

    /* ── serviços (aceita campo categoria para cardápios agrupados) ── */
    const servicos = (c.servicos || []).filter(s => s && s.titulo);
    const mostrarPrecos = c.mostrarPrecos !== false && c.mostrarPrecos !== 'nao' && c.mostrarPrecos !== 'false';
    const grupos = [];
    for (const s of servicos) {
      const g = (s.categoria || '').trim();
      let item = grupos.find(x => x.nome === g);
      if (!item) { item = { nome: g, itens: [] }; grupos.push(item); }
      item.itens.push(s);
    }

    const depos = (c.depoimentos || []).filter(d => d && d.texto);      // só reais, nunca inventados
    const numeros = (c.numeros || []).filter(n => n && n.valor);
    const faq = (c.faq || []).filter(f => f && f.p && f.r);
    const equipe = (c.equipe || []).filter(e => e && e.nome);
    const horarios = (c.horarios || []).filter(h => h && h.dia);
    const difs = linhas(c.diferenciais);
    const convenios = linhas(c.convenios).slice(0, 10);

    /* ── fotos: até 6, leves ── */
    let fotos = (Array.isArray(c.fotos) ? c.fotos : [])
      .map(f => typeof f === 'string' ? { url: f } : f)
      .filter(f => f && f.url)
      .slice(0, 6);
    /* compat legado do construtor */
    if (!fotos.length && c.heroImagem) fotos.unshift({ url: c.heroImagem, alt: 'Ambiente da ' + nome });
    if (c.sobreImagem && !fotos.some(f => f.url === c.sobreImagem)) fotos.push({ url: c.sobreImagem, alt: 'Interior da ' + nome });
    for (const g of linhas(c.galeria)) if (fotos.length < 6) fotos.push({ url: g });
    /* banco ilustrativo do ramo quando o cliente não mandou nenhuma foto */
    let usaBanco = false;
    if (!fotos.length && BANCO[c.perfil]) { usaBanco = true; fotos.push({ url: BANCO[c.perfil], alt: nome, credito: 'imagem ilustrativa' }); }
    const capa = fotos[0] || null;
    const galeria = fotos.slice(1, 6);

    /* ── prova social REAL: nunca inventar números ── */
    const nota = String(c.notaMedia || '').replace(/[^\d.,]/g, '').trim();
    const qtd = String(c.qtdAvaliacoes || '').replace(/\D/g, '');
    const anos = String(c.anosAtendimento || c.anos || '').replace(/\D/g, '');
    const bairro = String(c.bairro || '').trim();
    const prova = {
      nota: nota || '', qtd: qtd || '', anos: anos || '', bairro: bairro || '',
      link: c.linkAvaliacoes || c.linkGoogle || '',
    };
    const temProva = !!(prova.nota || prova.anos || prova.bairro);

    /* ── hero: 3 tipos ── */
    let heroTipo = c.heroTipo;
    if (!heroTipo || heroTipo === 'auto') {
      if (capa && variante === 1) heroTipo = 'split';
      else if (capa) heroTipo = 'foto';
      else heroTipo = 'faixa';
    }
    if (heroTipo === 'foto' && !capa) heroTipo = 'faixa';
    if (heroTipo === 'split' && !capa) heroTipo = 'faixa';

    const dark2 = dark ? '#0b0f14' : '#ffffff';
    const bg2 = dark ? '#111820' : pal.l;
    const txt = dark ? '#e8eef4' : '#1a2230';
    const mute = dark ? '#9aa8b6' : '#5b6774';
    const line = dark ? '#1e2833' : '#e6e9ee';
    const card = dark ? '#141c25' : '#ffffff';

    const nav = [];
    if (sec.sobre) nav.push(['#sobre', 'Sobre']);
    if (servicos.length) nav.push(['#servicos', c.rotuloServicos || ramo.rotulo]);
    if (galeria.length) nav.push(['#galeria', 'Fotos']);
    if (equipe.length) nav.push(['#equipe', 'Equipe']);
    if (depos.length || nota) nav.push(['#avaliacoes', 'Avaliações']);
    if (faq.length) nav.push(['#faq', 'Dúvidas']);
    if (horarios.length) nav.push(['#horario', 'Horário']);
    nav.push(['#contato', 'Contato']);

    const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'ME';
    const descricao = (c.descricao || c.slogan || c.sobreTexto || `${nome} — atendimento de qualidade.`)
      .toString().split('\n')[0].slice(0, 158);
    const marca = c.logo
      ? `<img src="${attr(c.logo)}" alt="Logo ${attr(nome)}" class="logoimg">`
      : `<i aria-hidden="true">${esc(iniciais)}</i>`;

    const schema = {
      '@context':'https://schema.org', '@type': c.tipoNegocio || ramo.tipo,
      name: nome, description: descricao,
      ...(c.logo && /^https?:/.test(c.logo) ? { logo: c.logo, image: c.logo } : {}),
      ...(c.telefone || c.whatsapp ? { telephone: c.telefone || c.whatsapp } : {}),
      ...(c.email ? { email: c.email } : {}),
      ...(c.endereco ? { address: { '@type':'PostalAddress', streetAddress: c.endereco } } : {}),
      ...(c.precoFaixa ? { priceRange: c.precoFaixa } : {}),
      ...(horariosSchema(horarios).length ? { openingHoursSpecification: horariosSchema(horarios) } : {}),
      ...(nota ? { aggregateRating: { '@type':'AggregateRating', ratingValue: nota.replace(',', '.'), reviewCount: qtd || '5' } } : {}),
      ...(c.instagram || c.facebook ? { sameAs: [
        c.instagram ? (String(c.instagram).startsWith('http') ? c.instagram : 'https://instagram.com/' + String(c.instagram).replace('@','')) : null,
        c.facebook ? (String(c.facebook).startsWith('http') ? c.facebook : 'https://facebook.com/' + c.facebook) : null,
      ].filter(Boolean) } : {}),
    };

    const anim = c.animacoes !== false;
    const rv = anim ? ' data-rv' : '';
    const textoCta = c.textoCta || ramo.cta || 'Chamar no WhatsApp';

    /* ============ CSS (mobile-first) ============ */
    const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--p:${pal.p};--d:${pal.d};--a:${pal.a};--r:${est.radius};--sh:${est.shadow};--txt:${txt};--mute:${mute};--line:${line};--card:${card};--bg:${dark2};--bg2:${bg2}}
html{scroll-behavior:smooth;scroll-padding-top:74px;-webkit-text-size-adjust:100%}
body{font-family:${fnt.b};color:var(--txt);background:var(--bg);line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden;font-size:16px}
h1,h2,h3,h4{font-family:${fnt.h};line-height:1.15;font-weight:800;letter-spacing:-.02em}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
svg{width:1em;height:1em;display:block;flex:0 0 auto}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
:focus-visible{outline:3px solid var(--a);outline-offset:3px;border-radius:4px}
.pular{position:absolute;left:-9999px;top:0;background:var(--p);color:#fff;padding:12px 20px;z-index:999;border-radius:0 0 8px 0}
.pular:focus{left:0}

/* cabeçalho */
header{position:sticky;top:0;z-index:90;background:${dark?'rgba(11,15,20,.88)':'rgba(255,255,255,.92)'};backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:64px;gap:12px}
.logo{display:flex;align-items:center;gap:10px;font-family:${fnt.h};font-weight:800;font-size:1.02rem;min-width:0}
.logo i{width:38px;height:38px;border-radius:${est.radius==='4px'?'7px':est.radius};background:linear-gradient(135deg,var(--p),var(--a));color:#fff;display:grid;place-items:center;font-size:.82rem;font-style:normal;letter-spacing:.5px;flex:0 0 auto}
.logo b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.logoimg{height:40px;width:auto;max-width:150px;object-fit:contain}
.menu{display:none}
.menu.aberto{display:flex;position:fixed;inset:64px 0 auto 0;flex-direction:column;background:var(--bg);padding:18px 20px 26px;gap:4px;border-bottom:1px solid var(--line);box-shadow:0 14px 30px rgba(0,0,0,.18);max-height:calc(100vh - 64px);overflow:auto}
.menu a{color:var(--mute);font-weight:600;font-size:1rem;padding:13px 8px;border-bottom:1px solid var(--line)}
.menu a:last-child{border-bottom:0}
.menu a.navcta{background:var(--p);color:#fff;text-align:center;border-radius:var(--r);border:0;margin-top:8px;font-weight:700}
.burger{display:block;background:none;border:0;color:var(--txt);cursor:pointer;padding:10px;border-radius:8px}
.burger span{display:block;width:23px;height:2.5px;background:currentColor;border-radius:2px;transition:.28s}
.burger span+span{margin-top:5px}
.burger[aria-expanded=true] span:nth-child(1){transform:translateY(7.5px) rotate(45deg)}
.burger[aria-expanded=true] span:nth-child(2){opacity:0}
.burger[aria-expanded=true] span:nth-child(3){transform:translateY(-7.5px) rotate(-45deg)}

/* faixa de promoção */
.promo{background:linear-gradient(90deg,var(--d),var(--p));color:#fff;text-align:center;padding:10px 16px;font-size:.9rem;font-weight:650;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap}
.promo svg{width:16px;height:16px}

/* botões — grandes o suficiente no celular */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:15px 26px;border-radius:var(--r);font-weight:750;font-size:1rem;transition:transform .2s,box-shadow .2s;border:0;cursor:pointer;font-family:inherit;min-height:50px;width:100%}
.btn:hover{transform:translateY(-2px)}
.b1{background:#fff;color:var(--d)}
.b2{background:rgba(255,255,255,.14);color:#fff;border:2px solid rgba(255,255,255,.55)}
.bwa{background:#25D366;color:#fff}
.bp{background:var(--p);color:#fff}
.bmin{width:auto;min-height:42px;padding:10px 18px;font-size:.88rem}
.btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.btns.btc{justify-content:center}

/* hero foto cheia */
.hero{position:relative;overflow:hidden;color:#fff;text-align:center}
.hero.foto{padding:64px 0 58px;background:linear-gradient(rgba(4,8,12,.66),rgba(4,8,12,.8)),url('${capa ? attr(capa.url) : ''}') center/cover no-repeat}
.hero.foto::after{content:'';position:absolute;inset:0;background:radial-gradient(800px 380px at 50% -10%,rgba(255,255,255,.12),transparent 62%);pointer-events:none}
.hero .wrap{position:relative;z-index:2}
.hero h1{font-size:clamp(1.85rem,6.4vw,3.3rem);margin-bottom:14px;text-shadow:0 2px 24px rgba(0,0,0,.3)}
.hero .sub{font-size:clamp(1rem,2.4vw,1.22rem);opacity:.95;max-width:620px;margin:0 auto 26px}
.selo{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);padding:6px 16px;border-radius:99px;font-size:.76rem;font-weight:750;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px;backdrop-filter:blur(6px)}

/* hero split: texto à esquerda, foto à direita */
.hero.split{color:var(--txt);background:var(--bg2);padding:34px 0;text-align:left}
.hero.split .wrap{display:grid;grid-template-columns:1fr;gap:24px;align-items:center}
.hero.split h1{font-size:clamp(1.7rem,5.6vw,2.7rem);margin-bottom:12px;text-shadow:none}
.hero.split .sub{color:var(--mute);margin:0 0 24px}
.hero.split .btns{justify-content:flex-start}
.hero.split .foto-hero{border-radius:var(--r);overflow:hidden;box-shadow:var(--sh)}
.hero.split .foto-hero img{width:100%;aspect-ratio:4/3;object-fit:cover}
.hero.split .selo{background:${pal.p}1a;border:1px solid ${pal.p}44;color:var(--p)}

/* hero faixa curta (sem foto) */
.hero.faixa{padding:40px 0;background:linear-gradient(135deg,var(--d) 0%,var(--p) 62%,var(--a) 130%);text-align:center}
.hero.faixa h1{font-size:clamp(1.6rem,5.4vw,2.5rem);margin-bottom:10px}
.hero.faixa .sub{margin-bottom:22px}
.hero.faixa.esq{text-align:left}
.hero.faixa.esq .btns{justify-content:flex-start}
.hero.faixa.esq .sub{margin-left:0}

/* prova social */
.prova{border-bottom:1px solid var(--line);background:var(--bg2)}
.prova .wrap{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:14px 20px}
.pch{display:inline-flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:8px 16px;font-size:.88rem;font-weight:650;color:var(--txt)}
.pch svg{color:var(--p);width:16px;height:16px}
.pch .st{color:#f59e0b}
.pch b{font-weight:800}
.pch .vivo{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:pisca 2s infinite}
.pch .morto{width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block}
@keyframes pisca{0%,100%{opacity:1}50%{opacity:.35}}

/* seções */
section{padding:52px 0}
.alt{background:var(--bg2)}
.cab{text-align:center;max-width:660px;margin:0 auto 34px}
.cab.esq{text-align:left;margin-left:0}
.kick{color:var(--p);font-weight:800;font-size:.76rem;letter-spacing:1.7px;text-transform:uppercase;margin-bottom:10px}
.cab h2{font-size:clamp(1.55rem,4.4vw,2.3rem);margin-bottom:12px}
.cab p{color:var(--mute);font-size:1rem}

[data-rv]{opacity:0;transform:translateY(22px);transition:opacity .65s cubic-bezier(.2,.7,.3,1),transform .65s cubic-bezier(.2,.7,.3,1)}
[data-rv].vis{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){[data-rv]{opacity:1!important;transform:none!important;transition:none}html{scroll-behavior:auto}}

/* sobre */
.sobre{display:grid;grid-template-columns:1fr;gap:30px;align-items:center}
.sobre h2{font-size:clamp(1.5rem,4vw,2.1rem);margin-bottom:14px}
.sobre p{color:var(--mute);margin-bottom:12px}
.sobre img{width:100%;border-radius:var(--r);box-shadow:var(--sh);aspect-ratio:4/3;object-fit:cover}
.plist{list-style:none;margin-top:20px;display:grid;gap:11px}
.plist li{display:flex;gap:11px;align-items:flex-start;font-weight:620}
.plist svg{color:var(--p);width:20px;height:20px;margin-top:3px}

/* cardápio / tabela de preços */
.grupo{margin-bottom:30px}
.grupo h3{font-size:1.12rem;margin-bottom:10px;display:flex;align-items:center;gap:10px}
.grupo h3::after{content:'';flex:1;height:1px;background:var(--line)}
.item{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px dashed var(--line)}
.item:last-child{border-bottom:0}
.item .nm{font-weight:700;font-size:1rem}
.item .ds{color:var(--mute);font-size:.88rem;margin-top:1px}
.item .pr{font-family:${fnt.h};font-weight:800;color:var(--p);white-space:nowrap;font-size:1rem}
.item .sep{flex:1;border-bottom:2px dotted var(--line);align-self:flex-end;margin-bottom:6px}
.menu-box{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:22px 22px 14px}

/* oficina: passos + garantia */
.passos{display:grid;grid-template-columns:1fr;gap:16px;counter-reset:ps}
.passo{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;display:flex;gap:16px;align-items:flex-start;box-shadow:var(--sh)}
.passo .n{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--a));color:#fff;display:grid;place-items:center;font-weight:800;font-family:${fnt.h};flex:0 0 auto;counter-increment:ps}
.passo .n::before{content:counter(ps)}
.passo h3{font-size:1.05rem;margin-bottom:4px}
.passo p{color:var(--mute);font-size:.92rem}
.garantia{display:flex;align-items:center;gap:14px;background:${pal.p}14;border:1px solid ${pal.p}44;color:var(--txt);border-radius:var(--r);padding:18px 22px;margin-top:22px;font-weight:650}
.garantia svg{color:var(--p);width:26px;height:26px}
.garantia small{display:block;color:var(--mute);font-weight:500}

/* agenda do salão */
.agenda{display:grid;grid-template-columns:1fr;gap:22px;align-items:start}
.agenda .grade{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh)}
.agenda .grade div{display:flex;justify-content:space-between;gap:12px;padding:15px 20px;border-bottom:1px solid var(--line);font-size:.95rem}
.agenda .grade div:last-child{border-bottom:0}
.agenda .grade div:nth-child(odd){background:${dark?'rgba(255,255,255,.02)':'rgba(0,0,0,.015)'}}
.agenda .grade b{font-weight:700}
.agenda .grade span{color:var(--mute);font-weight:600;font-variant-numeric:tabular-nums}
.agenda .hj{display:inline-flex;align-items:center;gap:6px;background:${pal.p}1a;color:var(--p);padding:4px 12px;border-radius:99px;font-size:.78rem;font-weight:750;margin-left:8px;white-space:nowrap}

/* convênios (clínica) */
.convs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:6px}
.conv{background:var(--card);border:1px solid var(--line);border-radius:99px;padding:10px 20px;font-size:.92rem;font-weight:650;box-shadow:var(--sh)}

/* quartos (hotel) */
.quartos{display:grid;grid-template-columns:1fr;gap:20px}
.quarto{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh);display:flex;flex-direction:column}
.quarto img{width:100%;aspect-ratio:16/10;object-fit:cover}
.quarto .qd{padding:20px;display:flex;flex-direction:column;gap:8px;flex:1}
.quarto h3{font-size:1.12rem}
.quarto p{color:var(--mute);font-size:.92rem;flex:1}
.quarto .pr{font-family:${fnt.h};font-weight:800;color:var(--p);font-size:1.25rem}

/* planos (academia) */
.planos{display:grid;grid-template-columns:1fr;gap:20px}
.plano{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:26px;box-shadow:var(--sh);display:flex;flex-direction:column;gap:10px}
.plano.rec{background:linear-gradient(160deg,${pal.p}10,var(--card) 55%);border-color:${pal.p}66}
.plano h3{font-size:1.1rem}
.plano .pr{font-family:${fnt.h};font-weight:800;font-size:1.7rem;color:var(--p)}
.plano .pr small{font-size:.85rem;color:var(--mute);font-weight:600}
.plano ul{list-style:none;display:grid;gap:8px;margin:6px 0;flex:1}
.plano li{display:flex;gap:9px;align-items:flex-start;font-size:.93rem}
.plano svg{color:var(--p);width:18px;height:18px;margin-top:2px}

/* áreas de atuação */
.areas{display:grid;grid-template-columns:1fr;gap:12px}
.area{display:flex;gap:13px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px;box-shadow:var(--sh)}
.area svg{color:var(--p);width:22px;height:22px;margin-top:2px}
.area b{display:block;font-size:1rem}
.area span{color:var(--mute);font-size:.9rem}

/* cards de serviços (padrão) */
.grid{display:grid;grid-template-columns:1fr;gap:18px}
.card{background:var(--card);padding:26px;border-radius:var(--r);box-shadow:var(--sh);border:${est.border==='none'?'1px solid var(--line)':est.border};display:flex;flex-direction:column;gap:8px}
.card h3{font-size:1.12rem}
.card p{color:var(--mute);font-size:.94rem;flex:1}
.card .preco{font-family:${fnt.h};font-weight:800;color:var(--p);font-size:1.25rem;border-top:1px dashed var(--line);padding-top:12px;margin-top:6px}
.ico{width:48px;height:48px;border-radius:${est.radius==='4px'?'9px':est.radius};background:linear-gradient(135deg,var(--p),var(--a));color:#fff;display:grid;place-items:center;font-size:1.3rem;margin-bottom:6px}

/* galeria */
.gal{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gal figure{position:relative;overflow:hidden;border-radius:var(--r);box-shadow:var(--sh);aspect-ratio:1}
.gal img{width:100%;height:100%;object-fit:cover}
.gal figcaption{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.65));color:#fff;font-size:.74rem;padding:18px 10px 8px;opacity:0;transition:opacity .25s}
.gal figure:hover figcaption{opacity:1}

/* depoimentos — só reais */
.dep{background:var(--card);padding:26px;border-radius:var(--r);box-shadow:var(--sh);border:1px solid var(--line);display:flex;flex-direction:column}
.estrelas{display:flex;gap:3px;color:#f59e0b;font-size:1rem;margin-bottom:12px}
.dep p{font-style:italic;margin-bottom:18px;font-size:1rem;flex:1}
.quem{display:flex;align-items:center;gap:12px}
.quem .av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--a));color:#fff;display:grid;place-items:center;font-weight:800}
.quem strong{display:block;font-size:.95rem}
.quem span{font-size:.83rem;color:var(--mute)}
/* faixa do Google (nota real, sem depoimentos) */
.gfaixa{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:24px;max-width:640px;margin:0 auto;text-align:center}
.gfaixa .n{font-family:${fnt.h};font-size:2.6rem;font-weight:800;color:#f59e0b;line-height:1}
.gfaixa .star{color:#f59e0b;font-size:1.1rem;display:flex;gap:2px}
.gfaixa p{color:var(--mute);font-size:.92rem}

/* faq */
.faq{max-width:760px;margin:0 auto;display:grid;gap:12px}
.faq details{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
.faq summary{padding:18px 20px;font-weight:700;cursor:pointer;list-style:none;display:flex;align-items:center;gap:14px;font-size:1rem}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'';margin-left:auto;width:10px;height:10px;border-right:2.5px solid var(--p);border-bottom:2.5px solid var(--p);transform:rotate(45deg);transition:transform .3s;flex:0 0 auto}
.faq details[open] summary::after{transform:rotate(-135deg)}
.faq .resp{padding:0 20px 20px;color:var(--mute);font-size:.95rem}

/* horário */
.hor{max-width:560px;margin:0 auto;background:var(--card);border-radius:var(--r);box-shadow:var(--sh);border:1px solid var(--line);overflow:hidden}
.hor div{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 20px;border-bottom:1px solid var(--line)}
.hor div:last-child{border-bottom:0}
.hor div:nth-child(odd){background:${dark?'rgba(255,255,255,.02)':'rgba(0,0,0,.015)'}}
.hor b{font-weight:700}
.hor span{color:var(--mute);font-variant-numeric:tabular-nums;font-weight:600}
.hor .ab{color:var(--p);font-weight:800}

/* contato */
.cts{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:36px}
.ct{background:var(--card);padding:24px 20px;border-radius:var(--r);border:1px solid var(--line);text-align:center;box-shadow:var(--sh)}
.ct .ico{margin:0 auto 12px}
.ct strong{display:block;font-size:.74rem;letter-spacing:1.3px;text-transform:uppercase;color:var(--mute);margin-bottom:6px}
.ct a,.ct p{font-weight:700;font-size:1rem;word-break:break-word}
.ct a:hover{color:var(--p)}
.cta{background:linear-gradient(135deg,var(--d),var(--p));color:#fff;text-align:center;border-radius:var(--r);padding:44px 24px;position:relative;overflow:hidden}
.cta h2{font-size:clamp(1.4rem,4vw,2rem);margin-bottom:12px}
.cta p{opacity:.94;margin-bottom:26px;font-size:1rem;max-width:540px;margin-left:auto;margin-right:auto}
.mapa{width:100%;height:320px;border:0;border-radius:var(--r);box-shadow:var(--sh);margin-top:32px}
.mapa-wrap{position:relative}
.mapa-link{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:10px 18px;border-radius:12px;border:1px solid var(--line);color:var(--txt);background:var(--card);text-decoration:none;font-weight:600;font-size:.95rem}
.mapa-wrap.vazio .mapa{display:none}

/* rodapé */
footer{background:${dark?'#06090d':pal.d};color:#fff;padding:48px 0 24px;text-align:center;font-size:.95rem}
footer .logo{justify-content:center;margin-bottom:12px;color:#fff}
footer .fp{opacity:.72;margin-bottom:6px}
.soc{display:flex;gap:12px;justify-content:center;margin:22px 0}
.soc a{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:1.15rem;transition:background .22s,transform .22s}
.soc a:hover{background:var(--a);transform:translateY(-3px)}
.copy{border-top:1px solid rgba(255,255,255,.13);margin-top:24px;padding-top:20px;opacity:.55;font-size:.82rem;line-height:1.8}

/* flutuantes */
.float{position:fixed;right:16px;bottom:16px;width:58px;height:58px;border-radius:50%;background:#25D366;color:#fff;display:grid;place-items:center;font-size:1.7rem;box-shadow:0 8px 28px rgba(37,211,102,.48);z-index:95;transition:transform .22s}
.float:hover{transform:scale(1.1)}
.float::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid #25D366;animation:onda 2.4s infinite;pointer-events:none}
@keyframes onda{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.5);opacity:0}}
.topo-btn{position:fixed;right:18px;bottom:86px;width:46px;height:46px;border-radius:50%;background:var(--card);color:var(--p);border:1px solid var(--line);display:grid;place-items:center;font-size:1.15rem;box-shadow:0 6px 20px rgba(0,0,0,.2);z-index:94;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .3s,transform .22s}
.topo-btn.on{opacity:1;pointer-events:auto}

${c.lgpd ? `.lgpd{position:fixed;left:14px;right:14px;bottom:14px;max-width:560px;margin:0 auto;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 20px;box-shadow:0 14px 40px rgba(0,0,0,.28);z-index:98;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:.87rem}
.lgpd p{flex:1;min-width:200px;color:var(--mute)}
.lgpd button{background:var(--p);color:#fff;border:0;padding:12px 20px;border-radius:calc(var(--r) - 2px);font:inherit;font-weight:700;cursor:pointer;min-height:44px}` : ''}

/* ── desktop ── */
@media(min-width:760px){
 .burger{display:none}
 .menu{display:flex;align-items:center;gap:22px;list-style:none;font-size:.92rem}
 .menu a{color:var(--mute);font-weight:600;padding:6px 0;border:0;position:relative}
 .menu a::after{content:'';position:absolute;left:0;bottom:0;width:0;height:2px;background:var(--p);transition:width .25s}
 .menu a:hover{color:var(--p)}
 .menu a:hover::after{width:100%}
 .menu a.navcta{background:var(--p);color:#fff;padding:11px 20px;border-radius:var(--r);font-weight:700}
 .menu a.navcta::after{display:none}
 .btn{width:auto}
 .hero.foto{padding:96px 0 84px}
 .hero.split{padding:60px 0}
 .hero.split .wrap{grid-template-columns:1.05fr .95fr;gap:48px}
 .hero.faixa{padding:56px 0}
 section{padding:72px 0}
 .sobre{grid-template-columns:${c.sobreImagem || (fotos.length > 1) ? '1.05fr .95fr' : '1fr'};gap:48px}
 .grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
 .passos{grid-template-columns:repeat(3,1fr)}
 .quartos{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
 .planos{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
 .areas{grid-template-columns:1fr 1fr}
 .cts{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}
 .gal{grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
 .agenda{grid-template-columns:1fr 1fr;gap:34px}
 .dep-grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;display:grid}
 .item{padding:16px 6px}
 .hero.faixa.esq .wrap{max-width:1080px}
}
@media print{
 header,.float,.topo-btn,.lgpd,.mapa,.burger,.promo{display:none!important}
 body{background:#fff;color:#000}
 .hero{background:#fff!important;color:#000!important;padding:30px 0}
 section{padding:20px 0;break-inside:avoid}
 a{text-decoration:underline}
}
`;

    /* ============ seções HTML ============ */
    const secHero = (() => {
      const badge = c.badge ? `<span class="selo">${esc(c.badge)}</span>` : '';
      const tit = `<h1>${esc(c.titulo || nome)}</h1>`;
      const sub = (c.slogan || c.descricao) ? `<p class="sub">${esc(c.slogan || c.descricao)}</p>` : '';
      const btns = `<div class="btns">
        ${waNum ? `<a href="${attr(waLink(msgDe('hero')))}" target="_blank" rel="noopener" class="btn bwa">${I.wa}<span>${esc(textoCta)}</span></a>` : ''}
        ${servicos.length ? `<a href="#servicos" class="btn b2">Ver ${esc((c.rotuloServicos || ramo.rotulo).toLowerCase())}</a>` : ''}
      </div>`;
      if (heroTipo === 'split') {
        return `<div class="hero split">
  <div class="wrap">
   <div>${badge}${tit}${sub}${btns}</div>
   <div class="foto-hero"><img src="${attr(capa.url)}" alt="${attr(capa.alt || 'Foto de ' + nome)}" fetchpriority="high"></div>
  </div>
 </div>`;
      }
      const cls = heroTipo === 'faixa' ? 'faixa' + (variante === 2 ? ' esq' : '') : 'foto';
      return `<div class="hero ${cls}">
  <div class="wrap">${badge}${tit}${sub}${btns}</div>
 </div>`;
    });

    const secProva = (() => {
      const chips = [];
      if (prova.nota) chips.push(`<span class="pch"><span class="st">${I.star}${I.star}${I.star}${I.star}${I.star}</span><b>${esc(prova.nota)}</b>${prova.qtd ? `<span style="color:var(--mute)">(${esc(prova.qtd)} no Google)</span>` : ''}</span>`);
      if (horarios.length) chips.push(`<span class="pch" id="pchAgora">${I.clock}<span><span class="vivo" id="pchDot"></span><b id="pchTxt">Verificando horário…</b></span></span>`);
      if (prova.bairro) chips.push(`<span class="pch">${I.pin}Atende em <b>${esc(prova.bairro)}</b></span>`);
      if (prova.anos) chips.push(`<span class="pch">${I.escudo}<b>${esc(prova.anos)} anos</b> de experiência</span>`);
      if (!chips.length) return '';
      return `<div class="prova" aria-label="Informações de confiança"><div class="wrap">${chips.join('')}</div></div>`;
    });

    const secSobre = (() => {
      if (!sec.sobre && !difs.length) return '';
      const texto = c.sobreTexto || c.descricao || '';
      const paragrafos = texto ? String(texto).split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('\n    ') : '';
      const fotoSobre = c.sobreImagem || (galeria[0] && variante === 1 ? galeria[0].url : '');
      return `<section id="sobre">
  <div class="wrap">
   <div class="sobre">
    <div${rv}>
     <div class="kick">Sobre nós</div>
     <h2>${esc(c.sobreTitulo || 'Quem somos')}</h2>
     ${paragrafos || ''}
     ${difs.length ? `<ul class="plist">
     ${difs.map(x => `<li>${I.check}<span>${esc(x)}</span></li>`).join('\n     ')}
    </ul>` : ''}
    </div>
    ${fotoSobre ? `<div${rv}><img src="${attr(fotoSobre)}" alt="Ambiente da ${attr(nome)}" loading="lazy" decoding="async"></div>` : ''}
   </div>
  </div>
 </section>`;
    });

    /* ---- bloco do ramo ---- */
    const btnPedir = (s) => waNum ? `<a class="btn bwa bmin" target="_blank" rel="noopener" href="${attr(waLink(msgDe('servicos', `Quero ${ramo.verbo} ${s.titulo}`)))}">${I.wa} ${esc(ramo.verbo === 'pedir' ? 'Pedir' : ramo.verbo.charAt(0).toUpperCase() + ramo.verbo.slice(1))}</a>` : '';

    const secMenu = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}">
    <div class="kick">${esc(c.rotuloServicos || ramo.rotulo)}</div>
    <h2>${esc(c.rotuloServicos || ramo.rotulo)}${c.servicosSub ? ' · ' + esc(c.servicosSub) : ''}</h2>
    ${c.promoTexto ? `<p>${esc(c.promoTexto)}</p>` : ''}
   </div>
   <div class="menu-box"${rv}>
    ${grupos.map(g => `<div class="grupo">
     ${g.nome ? `<h3>${esc(g.nome)}</h3>` : ''}
     ${g.itens.map(s => `<div class="item">
      <div style="flex:1;min-width:0"><div class="nm">${esc(s.titulo)}</div>${s.descricao ? `<div class="ds">${esc(s.descricao)}</div>` : ''}</div>
      ${mostrarPrecos && s.preco ? `<div class="pr">${esc(s.preco)}</div>` : ''}
      ${btnPedir(s)}
     </div>`).join('\n     ')}
    </div>`).join('\n    ')}
   </div>
   ${waNum ? `<div class="btns" style="margin-top:28px"><a href="${attr(waLink(msgDe('servicos')))}" target="_blank" rel="noopener" class="btn bp">${I.cart}<span>${esc(textoCta)}</span></a></div>` : ''}
  </div>
 </section>`;

    const secOficina = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}">
    <div class="kick">${esc(c.rotuloServicos || 'Serviços')}</div>
    <h2>${esc(c.sobreTitulo || 'Traga seu carro que a gente resolve')}</h2>
    ${c.servicosSub ? `<p>${esc(c.servicosSub)}</p>` : `<p>Orçamento sem compromisso pelo WhatsApp.</p>`}
   </div>
   <div class="passos">
    <div class="passo"${rv}><div class="n"></div><div><h3>Chame no WhatsApp</h3><p>Mande uma foto ou descreva o problema. Você recebe o orçamento na hora.</p></div></div>
    <div class="passo"${rv}><div class="n"></div><div><h3>Traga o carro</h3><p>Agende o melhor horário e deixe o serviço com a nossa equipe.</p></div></div>
    <div class="passo"${rv}><div class="n"></div><div><h3>Retire revisado</h3><p>Avisamos quando estiver pronto, com tudo testado e limpo.</p></div></div>
   </div>
   ${c.garantia !== false ? `<div class="garantia"${rv}>${I.escudo}<span>Serviço com garantia<small>${esc(c.garantiaTexto || 'Condições informadas no balcão.')}</small></span></div>` : ''}
   <div class="menu-box" style="margin-top:22px"${rv}>
    ${servicos.map(s => `<div class="item">
     <div style="flex:1;min-width:0"><div class="nm">${esc(s.titulo)}</div>${s.descricao ? `<div class="ds">${esc(s.descricao)}</div>` : ''}</div>
     ${mostrarPrecos && s.preco ? `<div class="pr">${esc(s.preco)}</div>` : ''}
     ${btnPedir(s)}
    </div>`).join('\n    ')}
   </div>
  </div>
 </section>`;

    const secAgenda = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}">
    <div class="kick">${esc(c.rotuloServicos || 'Serviços e valores')}</div>
    <h2>${esc(c.sobreTitulo || 'Agende seu horário')}</h2>
    <p>Escolha o serviço e chame no WhatsApp para garantir sua vaga.</p>
   </div>
   <div class="agenda">
    <div${rv}>
     <div class="grade">
      ${horarios.map(h => `<div><b>${esc(h.dia)}</b><span>${esc(h.hora || 'Fechado')}</span></div>`).join('\n      ')}
      ${!horarios.length ? `<div><b>Segunda a sexta</b><span>09:00 – 19:00</span></div><div><b>Sábado</b><span>09:00 – 13:00</span></div>` : ''}
     </div>
     ${waNum ? `<div class="btns" style="margin-top:18px"><a href="${attr(waLink(msgDe('servicos')))}" target="_blank" rel="noopener" class="btn bp">${I.calendario}<span>${esc(textoCta)}</span></a></div>` : ''}
    </div>
    <div class="menu-box"${rv}>
     ${servicos.map(s => `<div class="item">
      <div style="flex:1;min-width:0"><div class="nm">${esc(s.titulo)}</div>${s.descricao ? `<div class="ds">${esc(s.descricao)}</div>` : ''}</div>
      ${mostrarPrecos && s.preco ? `<div class="pr">${esc(s.preco)}</div>` : ''}
      ${btnPedir(s)}
     </div>`).join('\n     ')}
    </div>
   </div>
  </div>
 </section>`;

    const secConvenios = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}">
    <div class="kick">${esc(c.rotuloServicos || 'Especialidades')}</div>
    <h2>${esc(c.sobreTitulo || 'Atendimento com hora marcada')}</h2>
   </div>
   ${convenios.length ? `<div class="convs"${rv}>${convenios.map(x => `<span class="conv">${esc(x)}</span>`).join('')}</div>` : ''}
   <div class="cab" style="margin-top:20px"><p>${esc(c.servicosSub || 'Agende pelo WhatsApp e receba a confirmação na hora.')}</p></div>
   <div class="grid">
    ${servicos.map(s => `<article class="card"${rv}>
     <h3>${esc(s.titulo)}</h3>
     ${s.descricao ? `<p>${esc(s.descricao)}</p>` : ''}
     ${mostrarPrecos && s.preco ? `<div class="preco">${esc(s.preco)}</div>` : ''}
     ${waNum ? `<a class="btn bp bmin" target="_blank" rel="noopener" href="${attr(waLink(msgDe('servicos', `Quero ${ramo.verbo} ${s.titulo}`)))}">${I.wa} ${esc(textoCta)}</a>` : ''}
    </article>`).join('\n    ')}
   </div>
  </div>
 </section>`;

    const secQuartos = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}">
    <div class="kick">${esc(c.rotuloServicos || 'Acomodações')}</div>
    <h2>${esc(c.sobreTitulo || 'Escolha seu quarto')}</h2>
    <p>Reserve direto pelo WhatsApp, sem taxa de site.</p>
   </div>
   <div class="quartos">
    ${(c.quartos || servicos.map(s => ({ nome: s.titulo, descricao: s.descricao, preco: s.preco }))).filter(q => q && q.nome).slice(0, 6).map((q, i) => `<div class="quarto"${rv}>
     ${fotos[i + 1] ? `<img src="${attr(fotos[i + 1].url)}" alt="${attr(q.nome)}" loading="lazy" decoding="async">` : ''}
     <div class="qd"><h3>${esc(q.nome)}</h3>${q.descricao ? `<p>${esc(q.descricao)}</p>` : ''}
     ${q.preco ? `<div class="pr">${esc(q.preco)}</div>` : ''}
     ${waNum ? `<a class="btn bwa bmin" target="_blank" rel="noopener" href="${attr(waLink(msgDe('servicos', `Quero reservar o quarto ${q.nome}`)))}">${I.wa} Reservar</a>` : ''}</div>
    </div>`).join('\n    ')}
   </div>
  </div>
 </section>`;

    const secPlanos = () => {
      const planos = (c.planos || [
        { nome:'Mensal', preco: servicos[0]?.preco || '', itens:['Acesso livre a todos os aparelhos','Avaliação física incluso'] },
        { nome:'Trimestral', preco: servicos[1]?.preco || '', itens:['Tudo do plano mensal','Acompanhamento com professor'] },
        { nome:'Anual', preco: servicos[2]?.preco || '', itens:['Tudo do trimestral','Congelamento de 30 dias'] },
      ]).filter(p => p && p.nome);
      return `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">${esc(c.rotuloServicos || 'Planos')}</div><h2>${esc(c.sobreTitulo || 'Comece hoje mesmo')}</h2></div>
   <div class="planos">
    ${planos.map((p, i) => `<div class="plano${i === 1 ? ' rec' : ''}"${rv}>
     <h3>${esc(p.nome)}</h3>
     ${p.preco ? `<div class="pr">${esc(p.preco)}<small>${esc(p.periodo || '/mês')}</small></div>` : ''}
     <ul>${(p.itens || []).map(x => `<li>${I.check}<span>${esc(x)}</span></li>`).join('')}</ul>
     ${waNum ? `<a class="btn bwa bmin" target="_blank" rel="noopener" href="${attr(waLink(msgDe('servicos', `Quero assinar o plano ${p.nome}`)))}">${I.wa} ${esc(textoCta)}</a>` : ''}
    </div>`).join('\n    ')}
   </div>
  </div>
 </section>`;
    };

    const secAreas = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">${esc(c.rotuloServicos || ramo.rotulo)}</div><h2>${esc(c.sobreTitulo || 'Como podemos ajudar')}</h2></div>
   <div class="areas">
    ${servicos.map(s => `<div class="area"${rv}>${I.check}<div><b>${esc(s.titulo)}</b>${s.descricao ? `<span>${esc(s.descricao)}</span>` : ''}${mostrarPrecos && s.preco ? ` <span style="color:var(--p);font-weight:800">${esc(s.preco)}</span>` : ''}</div></div>`).join('\n    ')}
   </div>
   ${waNum ? `<div class="btns" style="margin-top:30px"><a href="${attr(waLink(msgDe('servicos')))}" target="_blank" rel="noopener" class="btn bp">${I.wa}<span>${esc(textoCta)}</span></a></div>` : ''}
  </div>
 </section>`;

    const secCards = () => `<section id="servicos" class="alt">
  <div class="wrap">
   <div class="cab${rv}">
    <div class="kick">O que oferecemos</div>
    <h2>${esc(c.rotuloServicos || 'Nossos serviços')}</h2>
    ${c.servicosSub ? `<p>${esc(c.servicosSub)}</p>` : ''}
   </div>
   <div class="grid">
    ${servicos.map(s => `<article class="card"${rv}>
     <div class="ico" aria-hidden="true">${I.check}</div>
     <h3>${esc(s.titulo)}</h3>
     ${s.descricao ? `<p>${esc(s.descricao)}</p>` : ''}
     ${mostrarPrecos && s.preco ? `<div class="preco">${esc(s.preco)}</div>` : ''}
     ${waNum ? `<a class="btn bp bmin" target="_blank" rel="noopener" href="${attr(waLink(msgDe('servicos', `Quero ${ramo.verbo} ${s.titulo}`)))}">${I.wa} ${esc(textoCta)}</a>` : ''}
    </article>`).join('\n    ')}
   </div>
  </div>
 </section>`;

    const blocoRamo = { menu: secMenu, oficina: secOficina, agenda: secAgenda, convenios: secConvenios, quartos: secQuartos, planos: secPlanos, areas: secAreas, cards: secCards }[ramo.bloco] || secCards;

    const secGaleria = (() => {
      if (!galeria.length) return '';
      return `<section id="galeria">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Fotos</div><h2>${esc(c.galeriaTitulo || 'Conheça a ' + nome)}</h2></div>
   <div class="gal">
    ${galeria.map((f, i) => `<figure${rv}><img src="${attr(f.url)}" alt="${attr(f.alt || nome + ' — foto ' + (i + 1))}" loading="lazy" decoding="async">${f.credito ? `<figcaption>${esc(f.credito)}</figcaption>` : ''}</figure>`).join('\n    ')}
   </div>
  </div>
 </section>`;
    });

    const secEquipe = (() => {
      if (!equipe.length) return '';
      return `<section id="equipe" class="alt">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Nosso time</div><h2>${esc(c.equipeTitulo || 'Quem vai te atender')}</h2></div>
   <div class="grid">
    ${equipe.map(m => `<div class="card" style="text-align:center"${rv}>
     <div class="av-txt" style="width:88px;height:88px;border-radius:50%;margin:0 auto 12px;background:linear-gradient(135deg,var(--p),var(--a));color:#fff;display:grid;place-items:center;font-size:1.9rem;font-weight:800">${esc(String(m.nome).trim().charAt(0).toUpperCase())}</div>
     <h3>${esc(m.nome)}</h3><p style="margin-top:-4px">${esc(m.cargo || '')}</p>
    </div>`).join('\n    ')}
   </div>
  </div>
 </section>`;
    });

    const secAvaliacoes = (() => {
      if (depos.length) {
        return `<section id="avaliacoes">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Avaliações</div><h2>O que dizem sobre nós</h2>
   ${nota ? `<p>Nota <b style="color:#f59e0b">${esc(nota)}</b>${qtd ? ' · ' + esc(qtd) + ' avaliações no Google' : ''}</p>` : ''}</div>
   <div class="dep-grid">
    ${depos.map(x => `<blockquote class="dep"${rv}>
     <div class="estrelas" aria-label="5 estrelas">${I.star.repeat(5)}</div>
     <p>&ldquo;${esc(x.texto)}&rdquo;</p>
     <footer class="quem">
      <div class="av" aria-hidden="true">${esc(String(x.autor || 'C').trim().charAt(0).toUpperCase())}</div>
      <div><strong>${esc(x.autor || 'Cliente')}</strong><span>${esc(x.papel || 'Cliente')}</span></div>
     </footer>
    </blockquote>`).join('\n    ')}
   </div>
  </div>
 </section>`;
      }
      /* sem depoimento: só nota real do Google, nunca frase inventada */
      if (nota) {
        const link = prova.link || `https://www.google.com/search?q=${encodeURIComponent(nome)}`;
        return `<section id="avaliacoes">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Avaliações</div><h2>O que os clientes acham</h2></div>
   <a class="gfaixa"${rv} href="${attr(link)}" target="_blank" rel="noopener">
    <div><div class="n">${esc(nota)}</div></div>
    <div style="text-align:left">
     <div class="star">${I.star.repeat(5)}</div>
     <p><b>${esc(nota)} no Google</b>${qtd ? ` — ${esc(qtd)} avaliações` : ''}<br>Veja o que estão dizendo</p>
    </div>
   </a>
  </div>
 </section>`;
      }
      return '';
    });

    const secFaq = (() => {
      if (!faq.length) return '';
      return `<section id="faq" class="alt">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Dúvidas frequentes</div><h2>${esc(c.faqTitulo || 'Perguntas frequentes')}</h2></div>
   <div class="faq">
    ${faq.map((f, i) => `<details${i === 0 ? ' open' : ''}${rv}><summary>${esc(f.p)}</summary><div class="resp">${esc(f.r)}</div></details>`).join('\n    ')}
   </div>
  </div>
 </section>`;
    });

    const secHorario = (() => {
      if (!horarios.length) return '';
      return `<section id="horario">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Atendimento</div><h2>Horário de funcionamento</h2></div>
   <div class="hor"${rv}>
    ${horarios.map(h => `<div><b>${esc(h.dia)}</b><span>${esc(h.hora || 'Fechado')}</span></div>`).join('\n    ')}
   </div>
  </div>
 </section>`;
    });

    const secNumeros = (() => {
      if (!numeros.length) return '';
      return `<section class="alt" aria-label="Números">
  <div class="wrap">
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:18px;text-align:center">
    ${numeros.map(n => `<div${rv}><div style="font-family:${fnt.h};font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1">${esc(n.valor)}</div><div style="color:var(--mute);font-size:.9rem;font-weight:600">${esc(n.rotulo || '')}</div></div>`).join('\n    ')}
   </div>
  </div>
 </section>`;
    });

    const secContato = () => `<section id="contato" class="alt">
  <div class="wrap">
   <div class="cab${rv}"><div class="kick">Contato</div><h2>${esc(c.contatoTitulo || 'Fale com a gente')}</h2>${c.contatoSub ? `<p>${esc(c.contatoSub)}</p>` : ''}</div>
   <div class="cts">
    ${waNum ? `<div class="ct"${rv}><div class="ico">${I.wa}</div><strong>WhatsApp</strong><a href="${attr(waLink(msgDe('contato')))}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a></div>` : ''}
    ${c.telefone ? `<div class="ct"${rv}><div class="ico">${I.phone}</div><strong>Telefone</strong><a href="tel:+55${attr(soDigitos(c.telefone))}">${esc(c.telefone)}</a></div>` : ''}
    ${c.email ? `<div class="ct"${rv}><div class="ico">${I.mail}</div><strong>E-mail</strong><a href="mailto:${attr(c.email)}">${esc(c.email)}</a></div>` : ''}
    ${c.endereco ? `<div class="ct"${rv}><div class="ico">${I.pin}</div><strong>Endereço</strong><p>${esc(c.endereco)}</p></div>` : ''}
   </div>
   <div class="cta"${rv}>
    <h2>${esc(c.ctaTitulo || 'Pronto para começar?')}</h2>
    <p>${esc(c.ctaTexto || 'Chame agora no WhatsApp e receba atendimento rápido.')}</p>
    <div class="btns">
     ${waNum ? `<a href="${attr(waLink(msgDe('contato')))}" target="_blank" rel="noopener" class="btn b1">${I.wa}<span>${esc(textoCta)}</span></a>` : ''}
     ${c.telefone ? `<a href="tel:+55${attr(soDigitos(c.telefone))}" class="btn b2">${I.phone}<span>Ligar agora</span></a>` : ''}
    </div>
   </div>
   ${c.mapa && c.endereco ? `
  <div class="mapa-wrap">
   <iframe class="mapa" id="mapaSite" loading="lazy" title="Localização de ${attr(nome)} no mapa do OpenStreetMap"></iframe>
   <a class="mapa-link" href="https://www.openstreetmap.org/search?query=${encodeURIComponent(c.endereco)}" target="_blank" rel="noopener">📍 Abrir no mapa (OpenStreetMap)</a>
   <script>
   (function () {
    var alvo = document.getElementById('mapaSite'); if (!alvo) return;
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(${JSON.stringify(String(c.endereco))}))
     .then(function (r) { return r.json(); })
     .then(function (j) {
      if (!j || !j[0]) throw 0;
      var b = j[0].boundingbox, d = .006;
      alvo.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (+b[2] - d) + ',' + (+b[0] - d) + ',' + (+b[3] + d) + ',' + (+b[1] + d) + '&layer=mapnik&marker=' + ((+b[0] + +b[1]) / 2) + ',' + ((+b[2] + +b[3]) / 2);
     })
     .catch(function () { var w = alvo.parentNode; if (w) w.classList.add('vazio'); });
   })();
   <\/script>
  </div>` : ''}
  </div>
 </section>`;

    /* dados para edição futura (window.LS_EDIT) */
    const lsEdit = JSON.stringify({
      nome, whatsapp: c.whatsapp || '', horario: horarios, promo: c.promoTexto || '',
      atualizadoEm: new Date().toISOString(),
    });

    /* JS aberto-agora: melhora o texto com o horário de hoje */
    const jsAgora = horarios.length ? `
(function(){
  var el=document.getElementById('pchAgora');if(!el)return;
  var d=new Date(),dia=d.getDay(),hm=d.getHours()*60+d.getMinutes();
  var lista=${JSON.stringify(horarios.map(h => ({ d:String(h.dia).toLowerCase(), h:String(h.hora || '') })))};
  var idx={0:'domingo',1:'segunda',2:'ter',3:'quarta',4:'quinta',5:'sexta',6:'s\\u00e1b'};
  var aberto=false,fecha='';
  lista.forEach(function(x){
    var casa=x.d.indexOf(idx[dia])>=0||((dia>=1&&dia<=5)&&(x.d.indexOf('a sex')>=0));
    if(!casa)return;
    var m=x.h.match(/(\\d{1,2})[:h](\\d{2})?\\s*[-\\u2013\\u00e0s]+\\s*(\\d{1,2})[:h](\\d{2})?/);
    if(!m)return;
    var ini=+m[1]*60+(+(m[2]||0)),fim=+m[3]*60+(+(m[4]||0));
    if(hm>=ini&&hm<=fim){aberto=true;fecha=m[3]+':'+(m[4]||'00');}
  });
  var dot=document.getElementById('pchDot'),txt=document.getElementById('pchTxt');
  dot.className=aberto?'vivo':'morto';
  txt.textContent=aberto?(fecha?'Aberto agora · fecha \\u00e0s '+fecha+'h':'Aberto agora'):'Fechado agora';
})();` : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(nome)}${c.slogan ? ' | ' + esc(c.slogan.slice(0, 60)) : ''}</title>
<meta name="description" content="${attr(descricao)}">
<meta name="theme-color" content="${pal.p}">
<meta name="author" content="${attr(nome)}">
${c.palavras ? `<meta name="keywords" content="${attr(c.palavras)}">` : ''}
${c.dominio ? `<link rel="canonical" href="https://${attr(String(c.dominio).replace(/^https?:\/\//, ''))}/">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(nome)}">
<meta property="og:description" content="${attr(descricao)}">
<meta property="og:locale" content="pt_BR">
${capa ? `<meta property="og:image" content="${attr(/^https?:/.test(capa.url) ? capa.url : '')}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='${encodeURIComponent(pal.p)}'/><text x='50' y='68' font-size='46' font-family='sans-serif' font-weight='bold' fill='white' text-anchor='middle'>${encodeURIComponent(iniciais)}</text></svg>">
<script type="application/ld+json">${JSON.stringify(schema)}<\/script>
<script>window.LS_EDIT=${JSON.stringify(JSON.parse(lsEdit))};<\/script>
<style>${CSS}</style>
</head>
<body>
<a href="#conteudo" class="pular">Pular para o conteúdo</a>
${c.promoTexto ? `<div class="promo">${I.tag}<span>${esc(c.promoTexto)}</span></div>` : ''}
<header id="cab">
 <div class="wrap">
  <nav class="nav" aria-label="Menu principal">
   <a href="#" class="logo" aria-label="${attr(nome)} — início">${marca}<b>${esc(nome)}</b></a>
   <ul class="menu" id="menu">
    ${nav.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('\n    ')}
    ${waNum ? `<li><a href="${attr(waLink(msgDe('hero')))}" target="_blank" rel="noopener" class="navcta">${esc(textoCta)}</a></li>` : ''}
   </ul>
   <button class="burger" id="burger" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  </nav>
 </div>
</header>
<main id="conteudo">
${secHero()}
${secProva()}
${secNumeros()}
${variante === 0 ? secSobre() + blocoRamo() : blocoRamo() + secSobre()}
${secGaleria()}
${secEquipe()}
${secAvaliacoes()}
${secFaq()}
${secHorario()}
${secContato()}
</main>
<footer>
 <div class="wrap">
  <div class="logo">${marca}<b>${esc(nome)}</b></div>
  ${c.slogan ? `<p class="fp">${esc(c.slogan)}</p>` : ''}
  ${c.endereco ? `<p class="fp">${esc(c.endereco)}</p>` : ''}
  ${c.telefone || c.whatsapp ? `<p class="fp">${esc(c.telefone || c.whatsapp)}${c.email ? ' · ' + esc(c.email) : ''}</p>` : ''}
  ${c.cnpj ? `<p class="fp">CNPJ ${esc(c.cnpj)}</p>` : ''}
  ${(c.instagram || c.facebook || waNum) ? `<div class="soc">
   ${c.instagram ? `<a href="${attr(String(c.instagram).startsWith('http') ? c.instagram : 'https://instagram.com/' + String(c.instagram).replace('@', ''))}" target="_blank" rel="noopener" aria-label="Instagram de ${attr(nome)}">${I.insta}</a>` : ''}
   ${c.facebook ? `<a href="${attr(String(c.facebook).startsWith('http') ? c.facebook : 'https://facebook.com/' + c.facebook)}" target="_blank" rel="noopener" aria-label="Facebook de ${attr(nome)}">${I.face}</a>` : ''}
   ${waNum ? `<a href="${attr(waLink(msgDe('geral')))}" target="_blank" rel="noopener" aria-label="WhatsApp de ${attr(nome)}">${I.wa}</a>` : ''}
  </div>` : ''}
  ${usaBanco ? `<p class="fp" style="opacity:.5;font-size:.8rem">Fotos ilustrativas — envie as suas pelo WhatsApp e a gente troca.</p>` : ''}
  <div class="copy">&copy; ${new Date().getFullYear()} ${esc(nome)}. Todos os direitos reservados.${c.creditos !== false ? '<br>Site desenvolvido por Nataniel' : ''}</div>
 </div>
</footer>
${waNum && c.botaoFlutuante !== false ? `<a href="${attr(waLink(msgDe('geral')))}" target="_blank" rel="noopener" class="float" aria-label="Falar no WhatsApp">${I.wa}</a>` : ''}
<button class="topo-btn" id="btopo" aria-label="Voltar ao topo">${I.up}</button>
${c.lgpd ? `<div class="lgpd" id="lgpd" role="dialog" aria-label="Aviso de privacidade">
 <p>Usamos cookies para melhorar sua experiência neste site.</p>
 <button id="lgpdok">Entendi</button>
</div>` : ''}
<script>
(function(){
 var cab=document.getElementById('cab'),bt=document.getElementById('btopo');
 var menu=document.getElementById('menu'),bg=document.getElementById('burger');
 function scroll(){var y=window.scrollY||0;if(cab)cab.classList.toggle('rolou',y>10);if(bt)bt.classList.toggle('on',y>520);}
 window.addEventListener('scroll',scroll,{passive:true});scroll();
 if(bt)bt.onclick=function(){window.scrollTo({top:0,behavior:'smooth'})};
 if(bg&&menu){
  bg.onclick=function(){var a=menu.classList.toggle('aberto');bg.setAttribute('aria-expanded',a?'true':'false');bg.setAttribute('aria-label',a?'Fechar menu':'Abrir menu');};
  menu.querySelectorAll('a').forEach(function(a){a.onclick=function(){menu.classList.remove('aberto');bg.setAttribute('aria-expanded','false');};});
 }
 ${anim ? `if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('[data-rv]').forEach(function(el){el.style.transitionDelay='0ms';io.observe(el);});
 }else{document.querySelectorAll('[data-rv]').forEach(function(el){el.classList.add('vis');});}` : ''}
 ${jsAgora}
 ${c.lgpd ? `try{var lg=document.getElementById('lgpd');
  if(localStorage.getItem('lgpd_ok'))lg.style.display='none';
  document.getElementById('lgpdok').onclick=function(){localStorage.setItem('lgpd_ok','1');lg.style.display='none';};
 }catch(e){}` : ''}
})();
<\/script>
${c.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${attr(c.ga4)}"><\/script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${attr(c.ga4)}');<\/script>` : ''}
${c.pixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${attr(c.pixel)}');fbq('track','PageView');<\/script>` : ''}
</body>
</html>`;
  }

  return { gerar, PALETAS, FONTES, ESTILOS, RAMOS, BANCO };
});
