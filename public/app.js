/* ═══════════════ utilidades ═══════════════ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const api = async (url, opts) => {
  const init = Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts);
  if (init.body !== undefined && typeof init.body !== 'string') init.body = JSON.stringify(init.body);
  const r = await fetch(url, init);
  let d = null;
  try { d = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error((d && d.erro) || 'Erro ' + r.status + ' ao falar com o servidor.');
  return d;
};
function toast(msg, erro) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast on' + (erro ? ' err' : '');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = 'toast', 3600);
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));


/* rótulos legíveis para os valores crus do OpenStreetMap */
const ROTULOS = {
  restaurant:['restaurante','restaurantes'], fast_food:['lanchonete','lanchonetes'],
  ice_cream:['sorveteria','sorveterias'], cafe:['cafeteria','cafeterias'], bar:['bar','bares'],
  pub:['bar','bares'], bakery:['padaria','padarias'], pastry:['confeitaria','confeitarias'],
  confectionery:['doceria','docerias'], supermarket:['supermercado','supermercados'],
  convenience:['mercearia','mercearias'], greengrocer:['hortifruti','hortifrutis'],
  butcher:['açougue','açougues'], grocery:['mercado','mercados'],
  hairdresser:['salão de beleza','salões de beleza'], beauty:['clínica de estética','clínicas de estética'],
  massage:['casa de massagem','casas de massagem'], tattoo:['estúdio de tatuagem','estúdios de tatuagem'],
  fitness_centre:['academia','academias'], sports_centre:['centro esportivo','centros esportivos'],
  gym:['academia','academias'], car_repair:['oficina mecânica','oficinas mecânicas'],
  tyres:['borracharia','borracharias'], motorcycle_repair:['oficina de motos','oficinas de motos'],
  car_parts:['autopeças','lojas de autopeças'], car:['concessionária','concessionárias'],
  motorcycle:['loja de motos','lojas de motos'], clinic:['clínica','clínicas'],
  doctors:['consultório médico','consultórios médicos'], dentist:['dentista','dentistas'],
  veterinary:['clínica veterinária','clínicas veterinárias'], pharmacy:['farmácia','farmácias'],
  chemist:['drogaria','drogarias'], pet:['pet shop','pet shops'],
  pet_grooming:['banho e tosa','pet shops'], clothes:['loja de roupas','lojas de roupas'],
  shoes:['loja de calçados','lojas de calçados'], boutique:['boutique','boutiques'],
  fashion_accessories:['loja de acessórios','lojas de acessórios'], jewelry:['joalheria','joalherias'],
  hardware:['loja de ferragens','lojas de ferragens'], doityourself:['material de construção','lojas de material de construção'],
  paint:['loja de tintas','lojas de tintas'], trade:['distribuidora','distribuidoras'],
  building_materials:['material de construção','lojas de material de construção'],
  electrical:['loja de elétrica','lojas de elétrica'], furniture:['loja de móveis','lojas de móveis'],
  interior_decoration:['loja de decoração','lojas de decoração'], houseware:['loja de utilidades','lojas de utilidades'],
  bed:['loja de colchões','lojas de colchões'], electronics:['loja de eletrônicos','lojas de eletrônicos'],
  computer:['loja de informática','lojas de informática'], mobile_phone:['loja de celulares','lojas de celulares'],
  hifi:['loja de som','lojas de som'], hotel:['hotel','hotéis'], guest_house:['pousada','pousadas'],
  motel:['motel','motéis'], hostel:['hostel','hostels'], apartment:['flat','flats'],
  school:['escola','escolas'], language_school:['escola de idiomas','escolas de idiomas'],
  driving_school:['autoescola','autoescolas'], college:['faculdade','faculdades'],
  kindergarten:['creche','creches'], lawyer:['escritório de advocacia','escritórios de advocacia'],
  accountant:['escritório de contabilidade','escritórios de contabilidade'],
  insurance:['corretora de seguros','corretoras de seguros'], estate_agent:['imobiliária','imobiliárias'],
  financial:['financeira','financeiras'], company:['empresa','empresas'],
  stationery:['papelaria','papelarias'], copyshop:['gráfica rápida','gráficas'],
  books:['livraria','livrarias'], printing:['gráfica','gráficas'],
  florist:['floricultura','floriculturas'], garden_centre:['garden center','garden centers'],
  laundry:['lavanderia','lavanderias'], dry_cleaning:['lavanderia','lavanderias'],
  optician:['ótica','óticas'], hearing_aids:['loja de aparelhos auditivos','lojas de aparelhos auditivos'],
};
const rotulo  = c => (ROTULOS[c] || [String(c).replace(/_/g, ' ')])[0];
const rotuloP = c => (ROTULOS[c] || [null, String(c).replace(/_/g, ' ') + 's'])[1] || rotulo(c);
/* onde a empresa fica, para usar no texto da mensagem */
const ondeFica = l => l.bairro ? 'no bairro ' + l.bairro : (l.cidade ? 'em ' + l.cidade : 'aqui na região');

const NOMES_CAT = {
  restaurante:'Restaurantes', lanchonete:'Lanchonetes', cafe_bar:'Cafés & Bares', padaria:'Padarias',
  mercado:'Mercados', salao_beleza:'Salões & Beleza', academia:'Academias', oficina:'Oficinas',
  autopecas:'Autopeças', clinica:'Clínicas', farmacia:'Farmácias', petshop:'Pet shops',
  loja_roupas:'Roupas & Calçados', construcao:'Construção', moveis:'Móveis & Decoração',
  eletronicos:'Eletrônicos', hotel:'Hotéis & Pousadas', escola:'Escolas & Cursos',
  advocacia:'Escritórios', imobiliaria:'Imobiliárias', papelaria:'Papelarias',
  floricultura:'Floriculturas', lavanderia:'Lavanderias', otica:'Óticas', outros:'Outros',
};

/* ═══════════════ navegação por abas ═══════════════ */
$$('.aba').forEach(b => b.onclick = () => {
  $$('.aba').forEach(x => x.classList.remove('ativa'));
  $$('.painel').forEach(x => x.classList.remove('ativo'));
  b.classList.add('ativa');
  $('#painel-' + b.dataset.aba).classList.add('ativo');
  if (b.dataset.aba === 'crm') carregarCRM();
});

/* ═══════════════════════════════════════════════════
   PARTE 1 — PROSPECÇÃO
   ═══════════════════════════════════════════════════ */
let achados = [], selecionados = new Set(), catsAtivas = new Set();

(async () => {
  const cats = await api('/api/categorias');
  $('#cats').innerHTML = cats.map(c =>
    `<div class="chip" data-cat="${c}">${NOMES_CAT[c] || c}</div>`).join('');
  $$('#cats .chip').forEach(ch => ch.onclick = () => {
    ch.classList.toggle('on');
    ch.classList.contains('on') ? catsAtivas.add(ch.dataset.cat) : catsAtivas.delete(ch.dataset.cat);
  });
})();

$('#btnBuscar').onclick = async () => {
  const cidade = $('#cidade').value.trim();
  if (!cidade) return toast('Informe a cidade', true);

  $('#btnBuscar').disabled = true;
  $('#resultados').classList.add('oculto');
  $('#statusBusca').innerHTML =
    `<div class="msg carregando"><div class="spin"></div>Consultando OpenStreetMap… isso pode levar até 30 segundos.</div>`;

  try {
    const r = await api('/api/prospectar', {
      method: 'POST',
      body: JSON.stringify({
        cidade,
        categorias: [...catsAtivas],
        raioKm: Number($('#raio').value),
        limite: Number($('#limite').value),
        apenasSemSite: $('#semSite').checked,
        exigirTelefone: $('#comTel').checked,
      }),
    });
    const jaNoCrm = new Set((leads || []).map(l => l.osmId));
    achados = r.empresas.map(e => ({ ...e, jaSalvo: jaNoCrm.has(e.osmId) }));
    selecionados.clear();
    $('#statusBusca').innerHTML = '';
    $('#stats').innerHTML = `
      <div class="stat b"><b>${r.total}</b><span>Encontradas</span></div>
      <div class="stat v"><b>${r.semSite}</b><span>Sem site</span></div>
      <div class="stat a"><b>${r.comSite}</b><span>Já têm site</span></div>
      <div class="stat r"><b>${achados.filter(e => e.telefone).length}</b><span>Com telefone</span></div>
      <div class="stat"><b>${achados.filter(e => e.jaSalvo).length}</b><span>Já no CRM</span></div>`;
    renderAchados();
    $('#resultados').classList.remove('oculto');
    if (!achados.length) toast('Nenhuma empresa com esses filtros', true);
    else toast(`${achados.length} empresas listadas`);
  } catch (e) {
    $('#statusBusca').innerHTML = `<div class="msg erro">⚠ ${esc(e.message)}</div>`;
  } finally {
    $('#btnBuscar').disabled = false;
  }
};

function cardLead(e, i) {
  const cls = e.score >= 75 ? '' : e.score >= 50 ? 'm' : 'l';
  return `<div class="lead ${selecionados.has(i) ? 'sel' : ''}" data-i="${i}">
    <div class="lead-topo">
      <div><h3>${esc(e.nome)}</h3><div class="cat">${esc(rotulo(e.categoria))}</div></div>
      <div class="pontuacao ${cls}" title="Potencial do lead">${e.score}</div>
    </div>
    <div class="tags">
      ${e.temSite ? '<span class="tag t-com">tem site</span>' : '<span class="tag t-sem">✓ sem site</span>'}
      ${e.telefone ? '<span class="tag t-tel">☎ telefone</span>' : ''}
      ${e.temRedeSocial ? '<span class="tag t-soc">rede social</span>' : ''}
      ${e.jaSalvo ? '<span class="tag t-com">já no CRM</span>' : ''}
    </div>
    <div class="infos">
      ${e.endereco ? `<div><i>📍</i><span>${esc(e.endereco)}</span></div>` : ''}
      ${e.telefone ? `<div><i>☎</i><a href="tel:${esc(e.telefone)}">${esc(e.telefone)}</a></div>` : ''}
      ${e.email ? `<div><i>✉</i><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></div>` : ''}
      ${e.site ? `<div><i>🌐</i><a href="${esc(e.site)}" target="_blank">${esc(e.site.slice(0, 38))}</a></div>` : ''}
    </div>
    <div class="lead-acoes">
      <button class="mini ${selecionados.has(i) ? 'pr' : ''}" data-sel="${i}">${selecionados.has(i) ? '✓ Selecionado' : 'Selecionar'}</button>
      <a class="mini" href="${esc(e.mapa)}" target="_blank">🗺 Mapa</a>
    </div>
  </div>`;
}

function renderAchados() {
  const ord = $('#ordemBusca') ? $('#ordemBusca').value : 'score';
  achados.sort((a, b) =>
    ord === 'nome' ? a.nome.localeCompare(b.nome, 'pt-BR') :
    ord === 'cat'  ? rotulo(a.categoria).localeCompare(rotulo(b.categoria), 'pt-BR') || b.score - a.score :
                     b.score - a.score || a.nome.localeCompare(b.nome, 'pt-BR'));
  $('#lista').innerHTML = achados.length
    ? achados.map(cardLead).join('')
    : `<div class="vazio"><div>🔍</div>Nenhuma empresa encontrada.<br>Tente ampliar o raio ou remover filtros.</div>`;
  $$('#lista [data-sel]').forEach(b => b.onclick = () => {
    const i = +b.dataset.sel;
    selecionados.has(i) ? selecionados.delete(i) : selecionados.add(i);
    renderAchados();
  });
  $('#contaSel').textContent = `${selecionados.size} selecionados`;
  $('#selTodos').checked = selecionados.size === achados.length && achados.length > 0;
}

if ($('#ordemBusca')) $('#ordemBusca').onchange = () => { selecionados.clear(); renderAchados(); };

$('#selTodos').onchange = e => {
  selecionados = e.target.checked ? new Set(achados.map((_, i) => i)) : new Set();
  renderAchados();
};

$('#btnSalvar').onclick = async () => {
  const escolhidos = (selecionados.size ? [...selecionados].map(i => achados[i]) : achados)
    .filter(e => !e.jaSalvo);
  if (!escolhidos.length) return toast('Nada para salvar', true);
  const r = await api('/api/leads', { method: 'POST', body: JSON.stringify({ empresas: escolhidos }) });
  toast(`${r.salvos} salvos no CRM${r.duplicados ? ` · ${r.duplicados} já existiam` : ''}`);
  achados.forEach(e => { if (escolhidos.includes(e)) e.jaSalvo = true; });
  renderAchados();
  atualizarBadge();
};

$('#btnCsv').onclick = () => {
  const linhas = selecionados.size ? [...selecionados].map(i => achados[i]) : achados;
  if (!linhas.length) return toast('Nada para exportar', true);
  const cols = ['nome','categoria','telefone','email','endereco','site','temSite','score','mapa'];
  const csv = [cols.join(';'), ...linhas.map(l => cols.map(c => `"${String(l[c] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  toast(`${linhas.length} linhas exportadas`);
};

/* ═══════════════════════════════════════════════════
   PARTE 2 — CRM & COMUNICAÇÃO
   ═══════════════════════════════════════════════════ */
let leads = [], filtroStatus = 'todos';
const STATUS = ['novo', 'contatado', 'negociando', 'fechado', 'perdido'];

let _vistosBrief = null;
async function atualizarBadge() {
  try {
    leads = await api('/api/leads');
    $('#badgeCrm').textContent = leads.length;
    const comBrief = leads.filter(l => l.briefEm).map(l => l.id);
    if (_vistosBrief === null) _vistosBrief = new Set(comBrief);
    else {
      const novos = comBrief.filter(id => !_vistosBrief.has(id));
      if (novos.length) {
        novos.forEach(id => _vistosBrief.add(id));
        const l = leads.find(x => x.id === novos[0]);
        toast(`🎉 ${novos.length === 1 ? l.nome + ' respondeu o formulário!' : novos.length + ' formulários novos!'}`);
      }
    }
  } catch (e) {}
}
setInterval(atualizarBadge, 25000);   // avisa quando um cliente responder

async function carregarCRM() {
  leads = await api('/api/leads');
  $('#badgeCrm').textContent = leads.length;
  const c = s => leads.filter(l => l.status === s).length;
  const fechados = c('fechado');
  const trabalhados = leads.length - c('novo');
  const conv = trabalhados ? Math.round(fechados / trabalhados * 100) : 0;
  const receita = fechados * PRECO_NUM;
  const potencial = (c('contatado') + c('negociando')) * PRECO_NUM;
  $('#statsCrm').innerHTML = `
    <div class="stat b"><b>${leads.length}</b><span>Total</span></div>
    <div class="stat"><b>${c('novo')}</b><span>Novos</span></div>
    <div class="stat a"><b>${c('contatado') + c('negociando')}</b><span>Em contato</span></div>
    <div class="stat v"><b>${fechados}</b><span>Fechados</span></div>
    <div class="stat r"><b>${leads.filter(l => l.briefEm).length}</b><span>Formulários</span></div>
    <div class="stat v"><b>R$ ${receita.toLocaleString('pt-BR')}</b><span>Receita fechada</span></div>
    <div class="stat a"><b>R$ ${potencial.toLocaleString('pt-BR')}</b><span>Em negociação</span></div>
    <div class="stat b"><b>${conv}%</b><span>Conversão</span></div>`;
  $('#filtrosStatus').innerHTML = ['todos', ...STATUS].map(s =>
    `<div class="chip ${filtroStatus === s ? 'on' : ''}" data-f="${s}">${s[0].toUpperCase() + s.slice(1)}${s !== 'todos' ? ` (${c(s)})` : ` (${leads.length})`}</div>`).join('');
  $$('#filtrosStatus .chip').forEach(ch => ch.onclick = () => { filtroStatus = ch.dataset.f; carregarCRM(); });
  renderCRM();
}

$('#buscaCrm').oninput = renderCRM;
$('#ordemCrm').onchange = renderCRM;
let visaoCrm = 'lista';
$('#vLista').onclick = () => { visaoCrm = 'lista'; $('#vLista').classList.add('ativa'); $('#vKanban').classList.remove('ativa'); renderCRM(); };
$('#vKanban').onclick = () => { visaoCrm = 'kanban'; $('#vKanban').classList.add('ativa'); $('#vLista').classList.remove('ativa'); renderCRM(); };

$('#btnCsvCrm').onclick = () => {
  if (!leads.length) return toast('CRM vazio', true);
  const cols = ['nome','categoria','status','telefone','email','endereco','score','siteSlug','briefEm','notas'];
  const csv = [cols.join(';'), ...leads.map(l => cols.map(k => `"${String(l[k] ?? '').replace(/"/g,'""')}"`).join(';'))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' }));
  a.download = `crm-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  toast(leads.length + ' leads exportados');
};

function renderCRM() {
  const q = $('#buscaCrm').value.toLowerCase();
  let vis = leads.filter(l =>
    (filtroStatus === 'todos' || l.status === filtroStatus) &&
    (!q || (l.nome + l.categoria + rotulo(l.categoria) + (l.endereco || '')).toLowerCase().includes(q)));

  const ord = $('#ordemCrm') ? $('#ordemCrm').value : 'recente';
  vis.sort((a, b) =>
    ord === 'score'  ? (b.score || 0) - (a.score || 0) :
    ord === 'nome'   ? a.nome.localeCompare(b.nome, 'pt-BR') :
    ord === 'antigo' ? new Date(a.criadoEm) - new Date(b.criadoEm) :
                       new Date(b.atualizadoEm || b.criadoEm) - new Date(a.atualizadoEm || a.criadoEm));

  if (visaoCrm === 'kanban') {
    $('#listaCrm').classList.add('oculto');
    $('#kanban').classList.remove('oculto');
    return renderKanban(vis);
  }
  $('#kanban').classList.add('oculto');
  $('#listaCrm').classList.remove('oculto');

  $('#listaCrm').innerHTML = vis.length ? vis.map(l => `
    <div class="lead">
      <div class="lead-topo">
        <div><h3>${esc(l.nome)}</h3><div class="cat">${esc(rotulo(l.categoria))}</div></div>
        <div style="display:grid;gap:5px;justify-items:end">
          <span class="st st-${l.status}">${l.status}</span>
          ${l.briefEm ? `<span class="tag ${l.brief && l.brief.fechar === 'sim' ? 't-sem' : 't-soc'}">${l.brief && l.brief.fechar === 'sim' ? '🎉 quer fechar' : '📋 formulário'}</span>` : ''}
        </div>
      </div>
      <div class="infos">
        ${l.telefone ? `<div><i>☎</i><a href="tel:${esc(l.telefone)}">${esc(l.telefone)}</a></div>` : '<div><i>☎</i><span style="opacity:.5">sem telefone</span></div>'}
        ${l.endereco ? `<div><i>📍</i><span>${esc(l.endereco)}</span></div>` : ''}
        ${l.siteSlug ? `<div><i>🚀</i><a href="/s/${esc(l.siteSlug)}" target="_blank">site publicado</a></div>` : ''}
      </div>
      <select class="st-sel" data-st="${l.id}">
        ${STATUS.map(s => `<option value="${s}" ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <div class="lead-acoes">
        ${l.telefone ? `<button class="mini wa" data-msg="${l.id}">💬 Mensagem</button>` : `<button class="mini" data-msg="${l.id}">✉ Mensagem</button>`}
        <button class="mini" data-form="${l.id}">📋 Formulário</button>
        <button class="mini pr" data-site="${l.id}">🎨 ${l.briefEm ? 'Ver/editar site' : 'Criar site'}</button>
        <button class="mini" data-ver="${l.id}">📋 Ficha</button>
        <button class="mini" data-del="${l.id}">🗑</button>
      </div>
    </div>`).join('')
    : `<div class="vazio"><div>📭</div>Nenhum lead aqui.<br>Vá em <b>Prospectar</b> e salve empresas no CRM.</div>`;

  $$('[data-st]').forEach(s => s.onchange = async () => {
    await api('/api/leads/' + s.dataset.st, { method: 'PATCH', body: JSON.stringify({ status: s.value }) });
    toast('Status atualizado'); carregarCRM();
  });
  $$('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Excluir este lead?')) return;
    await api('/api/leads/' + b.dataset.del, { method: 'DELETE' });
    toast('Lead excluído'); carregarCRM();
  });
  $$('[data-msg]').forEach(b => b.onclick = () => abrirMensagem(leads.find(l => l.id === b.dataset.msg)));
  $$('[data-ver]').forEach(b => b.onclick = () => abrirFicha(leads.find(l => l.id === b.dataset.ver)));
  $$('[data-site]').forEach(b => b.onclick = () => criarSitePara(leads.find(l => l.id === b.dataset.site)));
  $$('[data-form]').forEach(b => b.onclick = () => abrirFormularioLead(leads.find(l => l.id === b.dataset.form)));
}

function renderKanban(vis) {
  const nomes = { novo:'Novos', contatado:'Contatados', negociando:'Negociando', fechado:'Fechados', perdido:'Perdidos' };
  $('#kanban').innerHTML = STATUS.map(st => {
    const doStatus = vis.filter(l => l.status === st);
    return `<div class="col" data-col="${st}">
      <h4>${nomes[st]}<b>${doStatus.length}</b></h4>
      ${doStatus.length ? doStatus.map(l => `<div class="kcard" draggable="true" data-k="${l.id}">
        <b>${esc(l.nome)}</b><span>${esc(rotulo(l.categoria))}</span>
        <div class="kt">
          ${l.telefone ? '<span class="tag t-tel">☎</span>' : ''}
          ${l.briefEm ? '<span class="tag t-soc">📋</span>' : ''}
          ${l.siteSlug ? '<span class="tag t-sem">🚀</span>' : ''}
        </div></div>`).join('') : '<div class="kvazio">vazio</div>'}
    </div>`;
  }).join('');

  let arrastando = null;
  $$('.kcard').forEach(k => {
    k.ondragstart = () => { arrastando = k.dataset.k; };
    k.ondragend = () => { arrastando = null; $$('.col').forEach(c => c.classList.remove('drag')); };
    k.onclick = () => abrirFicha(leads.find(l => l.id === k.dataset.k));
  });
  $$('.col').forEach(col => {
    col.ondragover = e => { e.preventDefault(); col.classList.add('drag'); };
    col.ondragleave = () => col.classList.remove('drag');
    col.ondrop = async e => {
      e.preventDefault(); col.classList.remove('drag');
      if (!arrastando) return;
      const novo = col.dataset.col;
      const l = leads.find(x => x.id === arrastando);
      if (!l || l.status === novo) return;
      await api('/api/leads/' + l.id, { method:'PATCH', body: JSON.stringify({ status: novo }) });
      toast(l.nome + ' → ' + novo);
      carregarCRM();
    };
  });
}

/* ---------- modelos de mensagem ---------- */
const linkBrief = l => location.origin + '/formulario?lead=' + l.id;
const MEU_NOME = 'Nataniel';   // ajuste aqui o seu nome
const MEU_PRECO = 'R$ 97';
const PRECO_NUM = 97;

const TEMPLATES = {
  'Primeiro contato': l =>
`Olá! Tudo bem? 👋

Meu nome é ${MEU_NOME}, sou desenvolvedor aqui da região e estava pesquisando ${rotuloP(l.categoria)} ${ondeFica(l)} — e ${l.nome} apareceu, mas notei que vocês ainda não têm um site.

Hoje muita gente pesquisa no Google antes de escolher onde comprar. Sem site, esses clientes acabam indo pro concorrente.

Eu crio sites simples e rápidos, com WhatsApp integrado, e posso te mostrar um modelo pronto da ${l.nome} sem compromisso.

Posso te enviar? 😊`,

  'Com preview pronto': l =>
`Oi! Aqui é o ${MEU_NOME} 👋

Eu montei um site de demonstração para a ${l.nome} — está no ar e você pode ver agora pelo celular:

👉 [LINK DO SITE]

Fiz do meu jeito só pra você ver como ficaria. Tudo pode ser ajustado: cores, textos, fotos, serviços.

Se gostar, eu finalizo e coloco no ar com seu domínio próprio. O que achou?`,

  '📋 Enviar formulário': l =>
`Oi! Aqui é o ${MEU_NOME} 👋

Que bom que você topou! Para eu montar o site da ${l.nome} do jeito certo, preencha esse formulário rapidinho (uns 5 minutos):

👉 ${linkBrief(l)}

É bem simples: nome, contatos, horário, seus serviços e as cores que você prefere. Assim que terminar, **o site já fica pronto na hora** e você vê como ficou.

Qualquer dúvida me chama!`,

  'Follow-up gentil': l =>
`Oi! Passando rapidinho pra saber se você chegou a ver o site da ${l.nome} que te mandei 😊

Sem pressa nenhuma — só não quero que fique perdido no meio das mensagens.

Qualquer dúvida é só chamar!`,

  'Proposta e preço': l =>
`Show! Então vou te passar como funciona 👇

📦 O que está incluso:
• Site completo e responsivo (funciona no celular)
• Botão de WhatsApp direto
• Suas fotos, serviços e horários
• Localização no mapa
• Otimizado pra aparecer no Google

💰 Investimento: ${MEU_PRECO} (pagamento único)
⏱ Prazo: até 3 dias úteis
🎁 Ajustes ilimitados no primeiro mês

Se topar, eu já começo hoje. Alguma dúvida?`,

  'Última tentativa': l =>
`Oi! Última mensagem, prometo 🙂

Vou encerrar a lista de clientes desse mês e queria confirmar: tem interesse no site da ${l.nome} ou deixo pra mais pra frente?

Qualquer resposta serve, só pra eu não te incomodar mais. Valeu!`,

  'E-mail formal': l =>
`Assunto: Presença digital para ${l.nome}

Prezados,

Meu nome é ${MEU_NOME} e trabalho com desenvolvimento de sites para empresas locais.

Ao pesquisar ${rotuloP(l.categoria)} na região, identifiquei que a ${l.nome} ainda não possui um site institucional. Isso pode representar perda de clientes, já que a maioria dos consumidores pesquisa online antes de decidir onde comprar.

Ofereço a criação de um site profissional, responsivo e otimizado para o Google, com integração direta ao WhatsApp da empresa.

Ficarei feliz em apresentar um modelo sem custo ou compromisso.

Atenciosamente,
${MEU_NOME}`,
};

function abrirMensagem(l) {
  const tel = String(l.telefone || '').replace(/\D/g, '');
  const nomes = Object.keys(TEMPLATES);
  $('#modalConteudo').innerHTML = `
    <h2>💬 Mensagem para ${esc(l.nome)}</h2>
    <p class="sub">${l.telefone ? '☎ ' + esc(l.telefone) : 'Sem telefone cadastrado'}${l.email ? ' · ✉ ' + esc(l.email) : ''}</p>
    <label>Modelo</label>
    <div class="tpls">${nomes.map((n, i) => `<div class="chip ${i === 0 ? 'on' : ''}" data-tpl="${esc(n)}">${esc(n)}</div>`).join('')}</div>
    <textarea id="msgTexto" class="msgbox">${esc(TEMPLATES[nomes[0]](l))}</textarea>
    <div class="grupo-btn" style="margin-top:16px">
      ${tel ? `<button class="btn primario" id="envWa">💬 Abrir no WhatsApp</button>` : ''}
      ${l.email ? `<button class="btn" id="envMail">✉ Abrir e-mail</button>` : ''}
      <button class="btn fantasma" id="copiar">📋 Copiar</button>
      <button class="btn fantasma" id="registrar">✓ Registrar contato</button>
    </div>`;
  $('#modal').classList.add('on');

  $$('[data-tpl]').forEach(c => c.onclick = () => {
    $$('[data-tpl]').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    $('#msgTexto').value = TEMPLATES[c.dataset.tpl](l);
  });
  if ($('#envWa')) $('#envWa').onclick = () => {
    const n = tel.length <= 11 ? '55' + tel : tel;
    abrirLink(`https://wa.me/${n}?text=${encodeURIComponent($('#msgTexto').value)}`, '_blank');
    marcarContato(l);
  };
  if ($('#envMail')) $('#envMail').onclick = () => {
    abrirLink(`mailto:${l.email}?subject=${encodeURIComponent('Site para ' + l.nome)}&body=${encodeURIComponent($('#msgTexto').value)}`);
    marcarContato(l);
  };
  $('#copiar').onclick = () => { try { navigator.clipboard.writeText($('#msgTexto').value); toast('Copiado!'); } catch(e) { $('#msgTexto').select(); toast('Selecionado — use Ctrl+C'); } };
  $('#registrar').onclick = () => marcarContato(l, true);
}

async function marcarContato(l, fechar) {
  await api('/api/leads/' + l.id, {
    method: 'PATCH',
    body: JSON.stringify({ status: l.status === 'novo' ? 'contatado' : l.status, novaInteracao: 'Mensagem enviada' }),
  });
  toast('Contato registrado');
  if (fechar) $('#modal').classList.remove('on');
  carregarCRM();
}

function abrirFormularioLead(l) {
  const url = linkBrief(l);
  const tel = String(l.telefone || '').replace(/\D/g, '');
  const txt = TEMPLATES['📋 Enviar formulário'](l);
  $('#modalConteudo').innerHTML = `
    <h2>📋 Formulário de ${esc(l.nome)}</h2>
    <p class="sub">Mande esse link. Quando o cliente responder, o site é gerado e publicado sozinho.</p>
    <label>Link exclusivo deste cliente</label>
    <input id="linkBf" value="${esc(url)}" readonly style="font-family:ui-monospace,monospace;font-size:.85rem">
    <div class="grupo-btn" style="margin-top:14px">
      ${tel ? `<button class="btn primario" id="bfWa">💬 Mandar no WhatsApp</button>` : ''}
      <button class="btn" id="bfCopiar">📋 Copiar link</button>
      <button class="btn fantasma" id="bfAbrir">↗ Abrir formulário</button>
    </div>
    ${l.briefEm ? `<div class="msg carregando" style="margin-top:18px">✓ Respondido em ${new Date(l.briefEm).toLocaleString('pt-BR')}${l.siteSlug ? ` — <a href="/s/${esc(l.siteSlug)}" target="_blank">ver o site gerado</a>` : ''}</div>` : ''}
    ${l.brief ? `<label style="margin-top:20px;display:block">Respostas do cliente</label>
      <div class="hist">${Brief.resumo(l.brief).map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v)}</div>`).join('')}</div>` : ''}`;
  $('#modal').classList.add('on');
  if ($('#bfWa')) $('#bfWa').onclick = () => {
    const n = tel.length <= 11 ? '55' + tel : tel;
    abrirLink(`https://wa.me/${n}?text=${encodeURIComponent(txt)}`, '_blank');
    marcarContato(l);
  };
  $('#bfCopiar').onclick = () => {
    try { navigator.clipboard.writeText(url); toast('Link copiado!'); }
    catch (e) { $('#linkBf').select(); toast('Selecionado — use Ctrl+C'); }
  };
  $('#bfAbrir').onclick = () => abrirLink(url, '_blank');
}

function abrirFicha(l) {
  $('#modalConteudo').innerHTML = `
    <h2>📋 ${esc(l.nome)}</h2>
    <p class="sub">${esc(rotulo(l.categoria))} · lead capturado em ${new Date(l.criadoEm).toLocaleDateString('pt-BR')}</p>
    <div class="infos" style="font-size:.9rem;gap:8px;margin-bottom:18px">
      ${l.telefone ? `<div><i>☎</i><span>${esc(l.telefone)}</span></div>` : ''}
      ${l.email ? `<div><i>✉</i><span>${esc(l.email)}</span></div>` : ''}
      ${l.endereco ? `<div><i>📍</i><span>${esc(l.endereco)}</span></div>` : ''}
      ${l.horario ? `<div><i>🕐</i><span>${esc(l.horario)}</span></div>` : ''}
      <div><i>📊</i><span>Potencial: <b>${l.score}</b>/100</span></div>
      <div><i>🗺</i><a href="${esc(l.mapa)}" target="_blank">Ver no OpenStreetMap</a></div>
    </div>
    <label>Anotações</label>
    <textarea id="notas" rows="4">${esc(l.notas || '')}</textarea>
    <button class="btn primario pequeno" id="salvarNotas" style="margin-top:10px">Salvar anotações</button>
    ${l.brief ? `<label style="margin-top:20px;display:block">📋 Respostas do formulário</label>
      <div class="hist">${Brief.resumo(l.brief).map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v)}</div>`).join('')}</div>` : ''}
    <label style="margin-top:20px;display:block">Histórico</label>
    <div class="hist">${(l.historico || []).slice().reverse().map(h =>
      `<div><b>${new Date(h.data).toLocaleString('pt-BR')}</b>${esc(h.texto)}</div>`).join('') || '<div>Sem registros</div>'}</div>`;
  $('#modal').classList.add('on');
  $('#salvarNotas').onclick = async () => {
    await api('/api/leads/' + l.id, { method: 'PATCH', body: JSON.stringify({ notas: $('#notas').value }) });
    toast('Anotações salvas'); carregarCRM();
  };
}

$('#fecharModal').onclick = () => $('#modal').classList.remove('on');
$('#modal').onclick = e => { if (e.target.id === 'modal') $('#modal').classList.remove('on'); };

/* ═══════════════════════════════════════════════════
   PARTE 3 — CONSTRUTOR DE SITES
   ═══════════════════════════════════════════════════ */
let cfg = {
  nome: 'Minha Empresa', slogan: 'Qualidade e confiança em cada atendimento',
  badge: 'Atendimento em Rondonópolis', paleta: 'esmeralda', estilo: 'moderno', fonte: 'moderna',
  heroAlinhamento: 'center', escuro: '',
  sobreTitulo: 'Quem somos',
  sobreTexto: 'Somos uma empresa local comprometida em oferecer o melhor atendimento e produtos de qualidade para nossos clientes.',
  diferenciais: ['Atendimento personalizado', 'Orçamento sem compromisso', 'Profissionais experientes'],
  rotuloServicos: 'Nossos serviços', servicosSub: 'Soluções completas para você',
  servicos: [
    { titulo: 'Serviço principal', descricao: 'Descreva aqui o principal serviço oferecido pela empresa.', preco: '' },
    { titulo: 'Segundo serviço', descricao: 'Outro serviço importante que vocês oferecem aos clientes.', preco: '' },
    { titulo: 'Terceiro serviço', descricao: 'Complete com mais um diferencial do seu negócio.', preco: '' },
  ],
  depoimentos: [],
  galeria: [],
  horarios: [
    { dia: 'Segunda a Sexta', hora: '08:00 - 18:00' },
    { dia: 'Sábado', hora: '08:00 - 12:00' },
    { dia: 'Domingo', hora: 'Fechado' },
  ],
  whatsapp: '', telefone: '', email: '', endereco: '', instagram: '', facebook: '',
  textoCta: 'Chamar no WhatsApp', mapa: true, botaoFlutuante: true,
  logo: '', heroImagem: '', sobreImagem: '',
  numeros: [], equipe: [], faq: [],
  promoTexto: '', promoValidade: '', notaMedia: '', qtdAvaliacoes: '', precoFaixa: '',
  anosAtendimento: '', bairro: '', mostrarPrecos: true, convenios: [],
  descricao: '', palavras: '', dominio: '', tipoNegocio: 'LocalBusiness', cnpj: '',
  ga4: '', pixel: '', whatsappMsg: '',
  formularioContato: false, animacoes: true, lgpd: false, creditos: true,
  secoes: { sobre: true, servicos: true, galeria: false, equipe: false, depoimentos: true,
            faq: false, horario: true, contato: true, numeros: false },
  leadId: null,
};

const SECOES = { numeros:'Números', sobre:'Sobre', servicos:'Serviços', galeria:'Galeria', equipe:'Equipe',
                 depoimentos:'Depoimentos', faq:'Dúvidas', horario:'Horários', contato:'Contato' };

// paletas
$('#paletas').innerHTML = Object.entries(SiteGen.PALETAS).map(([k, v]) =>
  `<div class="pal ${!cfg.paletaCustom && k === cfg.paleta ? 'on' : ''}" data-p="${k}" title="${k}" style="background:linear-gradient(135deg,${v.p},${v.a})"></div>`).join('');
$$('.pal').forEach(p => p.onclick = () => {
  $$('.pal').forEach(x => x.classList.remove('on')); p.classList.add('on');
  cfg.paleta = p.dataset.p; cfg.paletaCustom = null; cfg.hue = null; render();
});
desenharRoda();

// seções
$('#secoes').innerHTML = Object.entries(SECOES).map(([k, n]) =>
  `<div class="chip ${cfg.secoes[k] ? 'on' : ''}" data-s="${k}">${n}</div>`).join('');
$$('#secoes .chip').forEach(c => c.onclick = () => {
  c.classList.toggle('on'); cfg.secoes[c.dataset.s] = c.classList.contains('on'); render();
});

// campos simples
function ligarCampos() {
  $$('[data-c]').forEach(el => {
    const k = el.dataset.c;
    if (el.type === 'checkbox') el.checked = !!cfg[k];
    else if (k === 'diferenciais' || k === 'galeria') el.value = (cfg[k] || []).join('\n');
    else el.value = cfg[k] ?? '';
    el.oninput = el.onchange = () => {
      if (el.type === 'checkbox') cfg[k] = el.checked;
      else if (k === 'diferenciais' || k === 'galeria') cfg[k] = el.value.split('\n').map(s => s.trim()).filter(Boolean);
      else cfg[k] = el.value;
      render();
    };
  });
}

// repetidores
function repetidor(alvo, lista, campos) {
  $(alvo).innerHTML = lista.map((item, i) => `<div class="item">
    <button class="rm" data-rm="${i}">×</button>
    ${campos.map(c => c.multi
      ? `<textarea rows="2" data-i="${i}" data-k="${c.k}" placeholder="${c.p}">${esc(item[c.k] || '')}</textarea>`
      : `<input data-i="${i}" data-k="${c.k}" placeholder="${c.p}" value="${esc(item[c.k] || '')}">`).join('')}
  </div>`).join('');
  $$(`${alvo} [data-k]`).forEach(el => el.oninput = () => { lista[+el.dataset.i][el.dataset.k] = el.value; render(); });
  $$(`${alvo} [data-rm]`).forEach(b => b.onclick = () => { lista.splice(+b.dataset.rm, 1); montarRepetidores(); render(); });
}

function montarRepetidores() {
  repetidor('#numeros', cfg.numeros, [{k:'valor',p:'Ex.: +10'},{k:'rotulo',p:'Ex.: anos de experiência'}]);
  repetidor('#equipe', cfg.equipe, [{k:'nome',p:'Nome'},{k:'cargo',p:'Cargo'},{k:'foto',p:'URL da foto (opcional)'}]);
  repetidor('#faq', cfg.faq, [{k:'p',p:'Pergunta'},{k:'r',p:'Resposta',multi:1}]);
  repetidor('#servicos', cfg.servicos, [{k:'titulo',p:'Título do serviço'},{k:'descricao',p:'Descrição',multi:1},{k:'preco',p:'Preço (opcional) ex: A partir de R$ 50'}]);
  repetidor('#depoimentos', cfg.depoimentos, [{k:'texto',p:'Depoimento do cliente',multi:1},{k:'autor',p:'Nome'},{k:'papel',p:'Ex: Cliente desde 2020'}]);
  repetidor('#horarios', cfg.horarios, [{k:'dia',p:'Ex: Segunda a Sexta'},{k:'hora',p:'Ex: 08:00 - 18:00'}]);
}

$('#addServico').onclick = () => { cfg.servicos.push({ titulo:'Novo serviço', descricao:'', preco:'' }); montarRepetidores(); render(); };
$('#addDep').onclick = () => { cfg.depoimentos.push({ texto:'', autor:'', papel:'Cliente' }); montarRepetidores(); render(); };
$('#addHor').onclick = () => { cfg.horarios.push({ dia:'', hora:'' }); montarRepetidores(); render(); };
$('#addNum').onclick = () => { cfg.numeros.push({ valor:'', rotulo:'' }); cfg.secoes.numeros = true; sincronizarUI(); };
$('#addEq').onclick  = () => { cfg.equipe.push({ nome:'', cargo:'', foto:'' }); cfg.secoes.equipe = true; sincronizarUI(); };
$('#addFaq').onclick = () => { cfg.faq.push({ p:'', r:'' }); cfg.secoes.faq = true; sincronizarUI(); };

/* ── upload de imagens: reduz e embute como data URI ── */
function lerImagem(file, maxLado, qualidade) {
  return new Promise((ok, err) => {
    const fr = new FileReader();
    fr.onerror = () => err(new Error('Falha ao ler o arquivo'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => err(new Error('Arquivo não é uma imagem válida'));
      img.onload = () => {
        let { width: w, height: h } = img;
        const m = maxLado || 1400;
        if (w > m || h > m) { const f = m / Math.max(w, h); w = Math.round(w * f); h = Math.round(h * f); }
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        const png = /png|svg/i.test(file.type) && file.size < 260000;
        ok(cv.toDataURL(png ? 'image/png' : 'image/jpeg', qualidade || 0.84));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function ligarUpload(inputId, aplicar, maxLado) {
  const el = $('#' + inputId);
  if (!el) return;
  el.onchange = async () => {
    const arqs = [...el.files];
    if (!arqs.length) return;
    try {
      toast('Processando imagem…');
      const urls = [];
      for (const a of arqs) urls.push(await lerImagem(a, maxLado));
      aplicar(urls);
      sincronizarUI();
      toast(arqs.length > 1 ? arqs.length + ' imagens adicionadas' : 'Imagem adicionada');
    } catch (e) { toast(e.message, true); }
    el.value = '';
  };
}
ligarUpload('upLogo',  u => { cfg.logo = u[0]; }, 420);
ligarUpload('upHero',  u => { cfg.heroImagem = u[0]; }, 1600);
ligarUpload('upSobre', u => { cfg.sobreImagem = u[0]; }, 1100);
ligarUpload('upGal',   u => { cfg.galeria = [...(cfg.galeria||[]), ...u]; cfg.secoes.galeria = true; }, 1000);


/* re-sincroniza toda a UI do construtor com o objeto cfg */
function sincronizarUI() {
  ligarCampos();
  montarRepetidores();
  $$('.pal').forEach(x => x.classList.toggle('on', x.dataset.p === cfg.paleta));
  $$('#secoes .chip').forEach(c => c.classList.toggle('on', !!cfg.secoes[c.dataset.s]));
  const sel = $('#perfilSel');
  if (sel && cfg.perfil) sel.value = cfg.perfil;
  const pv = $('#prevLogo');
  if (pv) pv.innerHTML = cfg.logo
    ? `<img src="${cfg.logo}" alt="logo"><button class="mini" id="rmLogo">remover</button>` : '';
  if ($('#rmLogo')) $('#rmLogo').onclick = () => { cfg.logo = ''; sincronizarUI(); };
  render();
  salvarRascunho();
}

/* ── rascunho automático, para não perder trabalho ── */
let _tr;
function salvarRascunho() {
  clearTimeout(_tr);
  _tr = setTimeout(() => { try { localStorage.setItem('ls_rascunho', JSON.stringify(cfg)); } catch (e) {} }, 700);
}
function carregarRascunho() {
  try {
    const v = localStorage.getItem('ls_rascunho');
    if (!v) return false;
    const d = JSON.parse(v);
    if (!d || !d.nome) return false;
    Object.assign(cfg, d);
    return true;
  } catch (e) { return false; }
}

/* seletor de segmento — preenche o site inteiro de uma vez */
(function () {
  const sel = $('#perfilSel');
  if (!sel) return;
  const ordem = Object.entries(Perfis.PERFIS)
    .sort((a, b) => a[1].rotulo.localeCompare(b[1].rotulo, 'pt-BR'));
  sel.innerHTML = ordem.map(([k, v]) => `<option value="${k}">${v.rotulo}</option>`).join('');
  sel.value = cfg.perfil || 'generico';
  sel.onchange = () => {
    Perfis.aplicar(cfg, sel.value);
    sincronizarUI();
    toast('Modelo de ' + Perfis.PERFIS[sel.value].rotulo + ' aplicado');
  };
})();

function render() {
  const html = SiteGen.gerar(cfg);
  const f = $('#preview');
  f.srcdoc = html;
  $('#urlFake').textContent = 'www.' + (cfg.nome || 'site').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '') + '.com.br';
}

$$('.disp .d').forEach(b => b.onclick = () => {
  $$('.disp .d').forEach(x => x.classList.remove('ativa')); b.classList.add('ativa');
  $('#preview').style.width = b.dataset.w;
});

$('#btnBaixar').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([SiteGen.gerar(cfg)], { type: 'text/html' }));
  a.download = (cfg.nome || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
  a.click();
  toast('HTML baixado');
};

$('#btnPublicar').onclick = async () => {
  const r = await api('/api/sites', { method: 'POST', body: JSON.stringify({ config: cfg, leadId: cfg.leadId }) });
  $('#avisoPub').innerHTML = `<div class="msg carregando" style="margin-top:12px">🚀 Publicado!<br>🌐 <a href="/s/${r.slug}" target="_blank" rel="noopener"><b>${location.origin}/s/${r.slug}</b></a><br>✅ Aprovação do cliente: <a href="${r.ver}" target="_blank" rel="noopener"><b>${location.origin}${r.ver}</b></a> <small style="opacity:.7">(mande no WhatsApp — botões Gostei / Quero ajustar)</small><br>🛠️ Edição do cliente: <a href="${r.editar}" target="_blank" rel="noopener"><b>${location.origin}${r.editar}</b></a> <small style="opacity:.7">(horário, promoção e WhatsApp)</small></div>`;
  cfg._slug = r.slug;
  toast('Site publicado!');
  atualizarBadge();
};

$('#btnLimpar').onclick = () => {
  if (!confirm('Limpar tudo e recomeçar do zero?')) return;
  try { localStorage.removeItem('ls_rascunho'); } catch (e) {}
  location.reload();
};

$('#btnAbrir').onclick = () => {
  const w = abrirLink('', '_blank');
  w.document.write(SiteGen.gerar(cfg)); w.document.close();
};

function irPara(aba) {
  $$('.aba').forEach(x => x.classList.remove('ativa'));
  $$('.painel').forEach(x => x.classList.remove('ativo'));
  $(`[data-aba="${aba}"]`).classList.add('ativa');
  $('#painel-' + aba).classList.add('ativo');
  $('#modal').classList.remove('on');
}

/* preenche o construtor a partir de um lead do CRM */
function criarSitePara(l) {
  if (l.brief) {                       // cliente já respondeu: usa as respostas dele
    Object.assign(cfg, Brief.briefParaConfig(l.brief, Perfis), { leadId: l.id });
    $('#paraQuem').innerHTML = `Site de <b>${esc(l.nome)}</b> montado com as respostas do próprio cliente.`;
    sincronizarUI();
    irPara('criar');
    toast('Preferências do cliente carregadas');
    return;
  }
  const perfil = Perfis.paraCategoria(l.categoria);
  Perfis.aplicar(cfg, perfil);          // textos, serviços e cores do segmento
  cfg.leadId = l.id;
  cfg.nome = l.nome;
  cfg.telefone = l.telefone || '';
  cfg.whatsapp = l.telefone || '';
  cfg.email = l.email || '';
  cfg.endereco = l.endereco || '';
  cfg.badge = l.bairro ? 'Atendimento no ' + l.bairro : (l.cidade ? 'Atendimento em ' + l.cidade : '');
  cfg.bairro = l.bairro || '';
  cfg.instagram = l.redes?.instagram || '';
  cfg.facebook = l.redes?.facebook || '';
  if (l.horario) cfg.horarios = [{ dia: 'Funcionamento', hora: l.horario }];

  $('#paraQuem').innerHTML = `Criando site para <b>${esc(l.nome)}</b> — modelo de <b>${esc(Perfis.PERFIS[perfil].rotulo)}</b> aplicado automaticamente.`;
  sincronizarUI();
  $$('.aba').forEach(x => x.classList.remove('ativa'));
  $$('.painel').forEach(x => x.classList.remove('ativo'));
  $('[data-aba="criar"]').classList.add('ativa');
  $('#painel-criar').classList.add('ativo');
  $('#modal').classList.remove('on');
  toast('Site de ' + l.nome + ' pré-montado — revise e publique');
}

/* init */
if (carregarRascunho()) setTimeout(() => toast('Rascunho anterior recuperado'), 600);
sincronizarUI(); atualizarBadge();

function abrirLink(u, t) {
  try { const w = window.open(u, t || '_blank'); if (!w) throw 0; return w; }
  catch (e) { toast('Link bloqueado no preview — abra o app completo'); return { document:{ write(){}, close(){} } }; }
}

/* ═══════════ arco-íris de cores (roda de matiz contínua) ═══════════ */
function rodaHsl(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h * 6) % 2 - 1)), m = l - c / 2;
  let r, g, b;
  if (h < 1 / 6) { r = c; g = x; b = 0; } else if (h < 2 / 6) { r = x; g = c; b = 0; }
  else if (h < 3 / 6) { r = 0; g = c; b = x; } else if (h < 4 / 6) { r = 0; g = x; b = c; }
  else if (h < 5 / 6) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
  const hex = v => ('0' + Math.round((v + m) * 255).toString(16)).slice(-2);
  return '#' + hex(r) + hex(g) + hex(b);
}
function rodaHueDeCor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return 0;
  const n = parseInt(m[1], 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  return ((h % 360) + 360) % 360;
}
function desenharRoda() {
  const mold = $('#rodaCor');
  if (!mold) return;
  const R = { fora: 108, dentro: 66, meio: 87, c: 110 };
  const custom = !!cfg.paletaCustom;
  const hueAtual = custom ? (cfg.hue || 0) : rodaHueDeCor(cfg.paletaCustom ? cfg.paletaCustom.p : (SiteGen.PALETAS[cfg.paleta] || {}).p);
  const cor = custom ? cfg.paletaCustom.p : ((SiteGen.PALETAS[cfg.paleta] || {}).p || '#64748b');
  const ang2p = (a, r) => { const rad = a * Math.PI / 180; return [R.c + r * Math.sin(rad), R.c - r * Math.cos(rad)]; };
  const fatia = (a, b) => {
    const p0 = ang2p(a, R.fora), p1 = ang2p(b, R.fora), p2 = ang2p(b, R.dentro), p3 = ang2p(a, R.dentro);
    return 'M' + p0[0].toFixed(2) + ',' + p0[1].toFixed(2) + ' A' + R.fora + ',' + R.fora + ' 0 0 1 ' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2) +
      ' L' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2) + ' A' + R.dentro + ',' + R.dentro + ' 0 0 0 ' + p3[0].toFixed(2) + ',' + p3[1].toFixed(2) + ' Z';
  };
  let s = '<svg viewBox="0 0 220 220" role="group" aria-label="Arco-íris de cores">';
  s += '<circle cx="110" cy="110" r="108" fill="#0b1220" stroke="#334155" stroke-width="2"/>';
  for (let i = 0; i < 360; i++) s += '<path d="' + fatia(i, i + 1.001) + '" fill="' + rodaHsl(i, 100, 50) + '" style="pointer-events:none"/>';
  s += '<circle cx="110" cy="110" r="112" fill="rgba(0,0,0,0)" data-captura="1" style="cursor:crosshair"/>';
  s += '<circle cx="110" cy="110" r="' + (R.dentro - 7) + '" fill="#0b1220"/>';
  s += '<circle id="rodaCentro" cx="110" cy="110" r="' + (R.dentro - 14) + '" fill="' + cor + '"/>';
  s += '<text id="rodaNome" x="110" y="107" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff" stroke="rgba(0,0,0,.45)" stroke-width="2" style="paint-order:stroke;pointer-events:none">' +
    (custom ? 'SUA COR' : esc(cfg.paleta || 'escolha')) + '</text>';
  s += '<text id="rodaHex" x="110" y="121" text-anchor="middle" font-size="7.5" font-weight="700" fill="rgba(255,255,255,.82)" style="pointer-events:none">' + cor.toUpperCase() + '</text>';
  const p = ang2p(hueAtual, R.meio);
  s += '<g id="rodaBolha" transform="translate(' + p[0].toFixed(2) + ',' + p[1].toFixed(2) + ')" style="pointer-events:none">' +
    '<circle r="15" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/><circle r="11.5" fill="' + rodaHsl(hueAtual, 100, 50) + '" stroke="#fff" stroke-width="2.5"/></g>';
  s += '</svg>';
  mold.innerHTML = s;

  const cap = mold.querySelector('[data-captura]');
  const corDoToque = ev => {
    const r = mold.getBoundingClientRect();
    if (!r.width) return null;
    const x = (ev.clientX - r.left) / r.width * 220 - 110;
    const y = 110 - (ev.clientY - r.top) / r.height * 220;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < R.dentro - 6 || dist > R.fora + 8) return null;
    const ang = Math.atan2(x, y) * 180 / Math.PI;
    return ((ang % 360) + 360) % 360;
  };
  const mover = ev => { const h = corDoToque(ev); if (h === null) return; escolherMatizRoda(Math.round(h), true); };
  const largar = () => { cap.onpointermove = null; };
  cap.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    try { cap.setPointerCapture(ev.pointerId); } catch (e) {}
    cap.onpointermove = mover; mover(ev);
  });
  cap.addEventListener('pointerup', largar);
  cap.addEventListener('pointercancel', largar);
  cap.addEventListener('click', ev => { const h = corDoToque(ev); if (h !== null) escolherMatizRoda(Math.round(h)); });
  rodarLegenda(hueAtual);
}
function escolherMatizRoda(hue, vivo) {
  cfg.paletaCustom = { p: rodaHsl(hue, 62, 40), a: rodaHsl(hue, 70, 56), d: rodaHsl(hue, 64, 19), l: rodaHsl(hue, 78, 96) };
  cfg.hue = hue;
  $$('.pal').forEach(x => x.classList.remove('on'));
  if (vivo) {
    const mold = $('#rodaCor');
    const p = (a => { const rad = a * Math.PI / 180; return [110 + 87 * Math.sin(rad), 110 - 87 * Math.cos(rad)]; })(hue);
    const bolha = mold && mold.querySelector('#rodaBolha'), centro = mold && mold.querySelector('#rodaCentro'),
      hex = mold && mold.querySelector('#rodaHex'), nome = mold && mold.querySelector('#rodaNome');
    if (bolha) { bolha.setAttribute('transform', 'translate(' + p[0].toFixed(2) + ',' + p[1].toFixed(2) + ')'); bolha.querySelector('circle:last-child').setAttribute('fill', rodaHsl(hue, 100, 50)); }
    if (centro) centro.setAttribute('fill', cfg.paletaCustom.p);
    if (hex) hex.textContent = cfg.paletaCustom.p.toUpperCase();
    if (nome) nome.textContent = 'SUA COR';
    rodarLegenda(hue);
    return;
  }
  render();
  toast('🌈 Cor personalizada: ' + cfg.paletaCustom.p.toUpperCase());
}
function rodarLegenda(hue) {
  const el = $('#rodaLegenda');
  if (!el) return;
  const pal = cfg.paletaCustom || SiteGen.PALETAS[cfg.paleta] || {};
  const trio = ['p', 'a', 'd'].map(k => pal[k] ? '<span class="pastilha" style="background:' + pal[k] + '"></span>' : '').join('');
  const nome = cfg.paletaCustom ? 'sua cor · ' + Math.round(hue != null ? hue : (cfg.hue || 0)) + '°' : esc(cfg.paleta || '—');
  el.innerHTML = '<b>' + nome + '</b>' + trio + '<span>· arraste a bolinha</span>';
}
