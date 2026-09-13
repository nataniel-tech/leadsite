#!/usr/bin/env node
/* Gera primeiros-leads.html — os 7 primeiros leads com telefone,
   com link de WhatsApp e a mensagem pronta do CRM ("Primeiro contato"). */
const fs = require('fs');
const path = require('path');

const EU = 'Nataniel';
const CIDADE = 'Rondonópolis';

const soDigitos = (s) => String(s || '').replace(/\D+/g, '');
const numeroZap = (tel) => {
  let n = soDigitos(tel);
  if (!n) return '';
  if (!n.startsWith('55') || n.length < 12) n = '55' + n;
  return n;
};

const LEADS = [
  { nome: 'Talent Espelharia Vidraçaria', seg: 'Vidraçaria / espelharia', tel: '+55 66 9993 68317',
    end: 'Travessa Bom Pastor, Centro — Rondonópolis',
    dica: 'Score máximo na prospecção: sem site, sem rede social, com telefone e e-mail. Tem até e-mail no cadastro — se não responder no zap, manda e-mail.',
    origem: 'OpenStreetMap' },
  { nome: 'Eletrotécnica Maringá', seg: 'Conserto de eletrônicos / eletrotécnica', tel: '+55 66 3421 6370',
    end: 'Av. Fernando Corrêa da Costa, 4000, Vila Adriana — Rondonópolis',
    dica: 'Abre seg–sex 07h–17h20. Negócio de serviço local clássico que vive de indicação — site no Google rende orçamento novo.',
    origem: 'OpenStreetMap' },
  { nome: 'Espaço Realce', seg: 'Loja de presentes', tel: '+55 66 99943 0002',
    end: 'Rua José Barriga, 3341, Jardim Gramado — Rondonópolis',
    dica: 'Número de celular (9 dígitos) — quase certo que é WhatsApp. Loja de bairro sem nenhuma presença online.',
    origem: 'OpenStreetMap' },
  { nome: 'Espaço Rústico Hookah', seg: 'Tabacaria / hookah', tel: '+55 66 99977 3556',
    end: 'Rua Pres. Castelo Branco, 914, Vila Operária — Rondonópolis',
    dica: 'Funciona todo dia 08h–22h. Público jovem que pesquisa no Google antes de ir — site com cardápio/WhatsApp converte bem.',
    origem: 'OpenStreetMap' },
  { nome: 'Mecatech Tecnologia Automotiva', seg: 'Oficina mecânica', tel: '+55 66 99901 4168',
    end: 'Av. Cuiabá, 261, Centro — Rondonópolis',
    dica: 'Só aparece em diretório (consertameucarro.com.br), sem site próprio. Número é celular/WhatsApp. Também tem e-mail: mecatech992@gmail.com.',
    origem: 'Busca na web' },
  { nome: 'PetClin Pet Shop e Clínica Veterinária', seg: 'Pet shop / veterinária', tel: '+55 66 99690 1022',
    end: 'Rua Fernando Corrêa da Costa, 487, Vila Aurora — Rondonópolis',
    dica: 'Tem Facebook, mas não tem site. Usei o número de WhatsApp do cadastro (99690-1022); o fixo é 3422-4931. Pet shop = agendamento de banho e tosa pelo site.',
    origem: 'Busca na web' },
  { nome: 'Corrêa Advogados', seg: 'Escritório de advocacia', tel: '+55 66 99936 3431',
    end: 'Rua Barão do Rio Branco, 1252, Centro — Rondonópolis',
    dica: 'O "site" deles hoje é só um link de WhatsApp — ou seja, não têm site de verdade. A mensagem abaixo já vai ajustada pra isso.',
    origem: 'OpenStreetMap', soLinkZap: true },
];

function mensagem(l) {
  const primeira = l.soLinkZap
    ? `Procurei por "${l.nome}" no Google e não achei um site de vocês — só um link de WhatsApp.`
    : `Procurei por "${l.nome}" no Google e não achei site de vocês — só o mapa.`;
  return `Oi! Aqui é o ${EU}.\n\n${primeira}\n\n` +
    `Eu faço site para negócio daqui de ${CIDADE}. Fica pronto em 1 dia, aparece no Google e tem botão direto pro WhatsApp.\n\n` +
    `Posso te mandar como ficaria o de vocês, sem compromisso?`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cartoes = LEADS.map((l, i) => {
  const zap = numeroZap(l.tel);
  const msg = mensagem(l);
  const wa = `https://wa.me/${zap}?text=${encodeURIComponent(msg)}`;
  return `
  <div class="cartao">
    <div class="topo-card">
      <div class="num">${i + 1}</div>
      <div class="info">
        <h2>${esc(l.nome)}</h2>
        <p class="seg">${esc(l.seg)} · <span class="tel">📞 ${esc(l.tel)}</span></p>
        <p class="end">📍 ${esc(l.end)}</p>
      </div>
      <span class="origem">${esc(l.origem)}</span>
    </div>
    <p class="dica">💡 ${esc(l.dica)}</p>
    <details>
      <summary>Ver a mensagem pronta</summary>
      <textarea id="msg${i}" rows="7" oninput="atualizar(${i},'${zap}')">${esc(msg)}</textarea>
    </details>
    <div class="acoes">
      <a class="btn zap" id="link${i}" href="${wa}" target="_blank" rel="noopener">💬 Mandar no WhatsApp</a>
      <button class="btn copiar" onclick="copiar(${i})">📋 Copiar mensagem</button>
      <a class="btn ligar" href="tel:${zap}">📞 Ligar</a>
    </div>
  </div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Primeiros 7 leads — LeadSite</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0d1117;--bg2:#151b23;--card:#1a222c;--line:#2b3644;--txt:#e6edf3;--mute:#8b98a5;--p:#3b82f6;--p2:#60a5fa;--ok:#22c55e;--roxo:#a855f7;--r:12px}
body{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.6}
.wrap{max-width:860px;margin:0 auto;padding:34px 20px 90px}
header{text-align:center;margin-bottom:28px}
header h1{font-size:1.9rem;font-weight:800;letter-spacing:-.6px;margin-bottom:8px}
header h1 span{background:linear-gradient(90deg,var(--p2),var(--roxo));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
header p{color:var(--mute);max-width:640px;margin:0 auto;font-size:.95rem}
.plano{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 20px;margin:20px 0 30px;font-size:.9rem;color:var(--mute)}
.plano b{color:var(--txt)}
.cartao{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;margin-bottom:18px}
.topo-card{display:flex;gap:14px;align-items:flex-start}
.num{width:38px;height:38px;flex:none;border-radius:10px;background:linear-gradient(135deg,var(--p),var(--roxo));display:grid;place-items:center;font-weight:800;font-size:1.05rem}
.info{flex:1}
.info h2{font-size:1.14rem;line-height:1.3}
.seg{color:var(--mute);font-size:.87rem;margin-top:2px}
.tel{color:var(--txt);font-weight:700}
.end{color:var(--mute);font-size:.85rem;margin-top:3px}
.origem{flex:none;font-size:.7rem;font-weight:700;color:var(--p2);background:rgba(59,130,246,.14);border:1px solid rgba(59,130,246,.4);padding:3px 10px;border-radius:99px;white-space:nowrap}
.dica{font-size:.86rem;color:#c9d4de;background:var(--bg2);border:1px dashed var(--line);border-radius:9px;padding:10px 13px;margin:14px 0}
details summary{cursor:pointer;font-size:.85rem;font-weight:600;color:var(--p2);user-select:none;margin-bottom:8px}
textarea{width:100%;background:var(--bg2);border:1px solid var(--line);color:var(--txt);border-radius:9px;padding:12px;font:inherit;font-size:.9rem;resize:vertical;margin-top:4px}
textarea:focus{outline:0;border-color:var(--p)}
.acoes{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:10px;font:inherit;font-size:.92rem;font-weight:700;text-decoration:none;cursor:pointer;border:1px solid var(--line);background:var(--bg2);color:var(--txt);transition:.15s}
.btn:hover{transform:translateY(-1px);border-color:#3f4d5e}
.btn.zap{background:#25d366;border-color:#25d366;color:#052e12}
.btn.zap:hover{background:#1fbf5b}
.btn.copiar:active{transform:scale(.97)}
footer{text-align:center;color:var(--mute);font-size:.8rem;margin-top:34px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>🎯 Os 7 primeiros leads <span>com número na mão</span></h1>
    <p>Todos em Rondonópolis, <b style="color:var(--txt)">sem site</b> e com telefone confirmado.
    É só tocar em <b style="color:#25d366">Mandar no WhatsApp</b> — a mensagem já vai preenchida com o modelo “Primeiro contato” do CRM.</p>
  </header>
  <div class="plano">
    <b>Plano de ataque:</b> mande a mensagem nos 7 hoje. Quem responder, você mostra a prévia
    (já tem demos de oficina e padaria prontas no sistema). Sem resposta em 2 dias, use o modelo
    <b>“Segundo toque”</b> no CRM: “eu monto o site primeiro e você só paga se gostar”.
  </div>
${cartoes}
  <footer>Leads salvos no CRM (funil “Novo”) · Dados: OpenStreetMap (ODbL) e busca pública · Gerado em 13/09/2026</footer>
</div>
<script>
function atualizar(i, zap){
  var t = document.getElementById('msg'+i).value;
  document.getElementById('link'+i).href = 'https://wa.me/'+zap+'?text='+encodeURIComponent(t);
}
function copiar(i){
  var ta = document.getElementById('msg'+i);
  navigator.clipboard.writeText(ta.value).then(function(){
    alert('Mensagem copiada! ✅');
  }, function(){ ta.select(); document.execCommand('copy'); alert('Mensagem copiada! ✅'); });
}
</script>
</body>
</html>
`;

const destino = path.join(__dirname, '..', 'primeiros-leads.html');
fs.writeFileSync(destino, html);
console.log('Gerado:', destino, '(' + html.length + ' bytes)');
