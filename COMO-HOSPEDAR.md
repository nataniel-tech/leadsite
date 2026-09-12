# Como colocar o LeadSite no ar

## 1. Rodar no seu computador (mais simples)
Instale o Node.js 18+ e rode:
```bash
cd leadsite
node server.js
```
Abra `http://localhost:3000`.

Funciona 100% assim — só que o formulário do cliente
(`/formulario?lead=...`) precisa estar acessível pela internet
para o cliente conseguir preencher. Para isso, use uma das opções abaixo.

---

## 2. Hospedagem grátis (recomendado para começar)

### Render.com
1. Suba a pasta `leadsite` para um repositório no GitHub
2. Em render.com → **New → Web Service** → conecte o repositório
3. Configure:
   - **Build Command:** (deixe vazio)
   - **Start Command:** `node server.js`
4. Pronto. A Render define a porta sozinha (o código já lê `process.env.PORT`).

> ⚠️ No plano grátis o disco é temporário: o `data/db.json` pode ser apagado
> em reinícios. Exporte o CSV do CRM de vez em quando, ou use um disco pago (US$ 1/mês).

### Alternativas parecidas
- **Railway.app** — mesmo processo, tem disco persistente barato
- **Fly.io** — precisa de cartão, mas tem volume de disco no plano grátis

---

## 3. VPS própria (melhor a longo prazo)
Uma VPS de ~R$ 20/mês (Contabo, Hostinger, Oracle Cloud grátis) resolve tudo:

```bash
# na VPS, como root
apt update && apt install -y nodejs npm nginx
npm install -g pm2

# suba a pasta leadsite para /opt/leadsite (via scp ou git clone)
cd /opt/leadsite
pm2 start server.js --name leadsite
pm2 save && pm2 startup          # sobe sozinho se reiniciar
```

Nginx na frente, para usar seu domínio e HTTPS:
```nginx
server {
  server_name seudominio.com.br;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seudominio.com.br    # HTTPS grátis
```

---

## 4. Onde hospedar os sites dos clientes
Cada site é **um único arquivo HTML** — não precisa de servidor Node.

- **Cliente sem domínio:** deixe no seu próprio LeadSite, em `seudominio.com.br/s/nome-da-empresa`
- **Cliente com domínio:** baixe o HTML (botão *⬇ Baixar HTML*) e suba como `index.html` em:
  - **Netlify Drop** (netlify.com/drop) — arraste o arquivo, fica no ar em segundos, grátis
  - **Vercel**, **Cloudflare Pages** — também grátis
  - **Hostinger / HostGator** — se o cliente já tiver hospedagem, é só jogar na pasta `public_html`

> Como as imagens ficam embutidas no próprio HTML, não há nada mais para subir.

---

## Cuidados
- **Faça backup do `data/db.json`** — são seus leads. O sistema já guarda cópias
  em `data/backups/`, mas leve uma cópia para fora do servidor de vez em quando.
- **Não exponha o `/` (painel) publicamente** se a VPS for pública. Se quiser,
  proteja com senha básica no Nginx:
  ```bash
  apt install -y apache2-utils
  htpasswd -c /etc/nginx/.htpasswd nataniel
  ```
  e no bloco `location /` adicione:
  ```nginx
  auth_basic "Restrito";
  auth_basic_user_file /etc/nginx/.htpasswd;
  ```
  Deixe `/formulario`, `/s/` e `/api/brief` liberados, senão o cliente não consegue responder:
  ```nginx
  location /formulario { auth_basic off; proxy_pass http://127.0.0.1:3000; }
  location /s/         { auth_basic off; proxy_pass http://127.0.0.1:3000; }
  location /api/brief  { auth_basic off; proxy_pass http://127.0.0.1:3000; }
  location /sitegen.js     { auth_basic off; proxy_pass http://127.0.0.1:3000; }
  location /perfis.js      { auth_basic off; proxy_pass http://127.0.0.1:3000; }
  location /brief-schema.js{ auth_basic off; proxy_pass http://127.0.0.1:3000; }
  ```
- **Respeite o Overpass**: é um serviço voluntário. Evite centenas de buscas seguidas.
