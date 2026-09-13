# LeadSite 🚀

Sistema completo de prospecção → CRM → criação de sites para empresas locais.

## Como rodar

```bash
cd leadsite
node server.js
# abre em http://localhost:3000
```

Zero dependências. Só Node.js 18+ (usa `fetch` nativo).

### Variáveis de ambiente (opcionais)

| Variável | Para quê | Padrão |
|---|---|---|
| `PORT` | porta do servidor | `3000` |
| `LEADSITE_SENHA` | ativa login no CRM (formulário do cliente e sites publicados continuam sem senha) | desligado |

```bash
PORT=8080 LEADSITE_SENHA=minhasenha123 node server.js
```

Sem `LEADSITE_SENHA` definida, o sistema funciona exatamente como sem login — ideal pra uso local. Defina essa variável se for expor o servidor na internet (ex: numa VPS ou sandbox como e2b/Replit), já que sem ela qualquer pessoa com o link acessa todos os seus leads.

### Configurar seu nome e preço

Não precisa mais editar código: clique no ⚙ no topo do CRM e ajuste "Seu nome" e "Preço do site" — usado nos modelos de mensagem e no cálculo de receita.

---

## 🆕 Versão 3 — sites que não parecem "o mesmo site com outra cor"

### Layouts por ramo (não só texto trocado)
Cada segmento ganhou um bloco exclusivo: padaria/restaurante = **cardápio com preço e botão "Pedir" por item**; oficina = **"Traga seu carro" em 3 passos + faixa de garantia**; salão = **grade de horários + serviços**; clínica = **chips de convênios**; hotel = **cards de quartos**; academia = **planos**; advocacia etc. = **áreas de atuação**.

- **3 heróis**: foto cheia, split (texto à esquerda + foto) e faixa curta.
- **Anti-igualdade**: variação determinística pelo nome — dois clientes do mesmo ramo não caem no mesmo molde (ordem de seções, tipo de hero e acentos mudam).
- **Bloco de prova no topo**: nota real do Google, "Aberto agora · fecha às 18h" (calculado no navegador), bairro atendido e anos de mercado. **Nada é inventado** — sem dado, o bloco some.
- **Depoimentos só reais**: sem depoimento cadastrado, o site mostra apenas a nota do Google (se houver) ou esconde a seção.
- **WhatsApp contextual**: cada botão manda mensagem da própria seção ("Quero pedir X", "Quero orçamento de Y").
- **Favicon + logo automáticos** (iniciais + cor) quando não há logo.
- **Mobile-first de verdade**: uma coluna no celular, botões de 50px+, menu hambúrguer.

### Fotos reais > mais perguntas
- **Upload no próprio formulário** (capa + até 4 fotos), comprimidas no celular do cliente (canvas, JPEG ~1200px) e **hospedadas no servidor** (`/fotos/...`) — o HTML continua leve.
- **Banco ilustrativo por ramo** (`public/fotos/banco/`, 10 segmentos) quando o cliente não tem foto, com aviso no rodapé e troca fácil depois.
- Construtor do CRM também envia as fotos para o servidor (nada de data URI gigante no HTML).

### Fluxo curto: 9 perguntas em vez de 46
Nome → WhatsApp → Ramo → Endereço → Horário → 3 serviços → Cor → Foto → Pronto.
Tela final com **preview ao vivo + "o que mudar?"** (slogan, cor, esconder preços, foto de capa, promoção). Extras (nota Google, depoimentos reais, promoção, redes, convênios) ficam **opcionais depois**.

### Aprovação e pós-venda
- **`/ver/slug`** — página de aprovação do cliente: prévia no celular, botões **Gostei / Quero ajustar**, ajustes rápidos em lista (slogan, cor, preços, promoção, horário) e **QR code** para visita presencial. Ao "Gostei", o lead vira **fechado** no CRM com histórico.
- **`/editar/slug`** — o cliente troca sozinho **horário, promoção e WhatsApp** depois do ar; o site regenera na hora.
- `window.LS_EDIT = { horario, promo, whatsapp }` embutido no HTML gerado, pronto para edição futura.
- Toda publicação devolve os 3 links: `url`, `ver`, `editar`.

### API nova
| Método | Rota | Função |
|---|---|---|
| POST | `/api/fotos` | Salva foto (data URI) e devolve URL pública |
| GET | `/ver/:slug` · `/editar/:slug` | Aprovação e edição rápida (públicas) |
| POST | `/api/aprovar/:slug` | Gostei / lista de ajustes → regenera |
| POST | `/api/editar/:slug` | Horário, promoção e WhatsApp → regenera |

---

## As 3 partes

### 1️⃣ Prospectar
Busca empresas reais no **OpenStreetMap** via **Overpass API** — grátis, sem chave de API, sem limite prático.

- Geocodificação da cidade pelo **Nominatim** (aceita "Rondonópolis, MT" ou qualquer cidade do mundo)
- 25 segmentos filtráveis (restaurante, salão, oficina, construção, clínica...)
- Filtro **"só empresas sem site"** — lê as tags `website` / `contact:website` do OSM
- Filtro "só com telefone"
- Raio configurável (2–25 km) ou cidade inteira
- **Score de 0 a 100** por lead: telefone (+40), sem site (+35), sem rede social (+15), endereço (+10), e-mail (+10), horário (+5)
- Exportação CSV e salvamento em lote no CRM (deduplicado por ID do OSM)
- 3 espelhos Overpass com fallback automático
- **Cache em memória** (cidade: 7 dias, resultados: 6h) e **timeout real** nas chamadas — buscas repetidas ficam instantâneas e uma API fora do ar não trava a tela
- **Limite de 20 buscas / 10 min por IP**, pra não sobrecarregar as APIs públicas do OSM

### 2️⃣ Gerenciar & Comunicar
Funil de vendas + gerador de mensagens.

- Status: `novo` → `contatado` → `negociando` → `fechado` / `perdido`
- Filtro por status, por potencial mínimo (score) e busca por texto
- **⏰ Aviso de "sem retorno"**: destaca leads em `contatado`/`negociando` parados há 3+ dias, com filtro dedicado
- Ficha do lead com anotações e histórico automático de interações
- **6 modelos de mensagem** prontos que se auto-preenchem com os dados do lead (nome da empresa, segmento traduzido e bairro):
  1. Primeiro contato
  2. Com preview pronto
  3. Follow-up gentil
  4. Proposta e preço
  5. Última tentativa
  6. E-mail formal
- Botão abre direto no **WhatsApp** (`wa.me`, adiciona +55) ou no cliente de **e-mail**
- Ao enviar, o status vira "contatado" e registra no histórico automaticamente

> ✏️ Nome e preço padrão: **Nataniel** / **R$ 97**. Para mudar, clique no ⚙ no topo da tela (não precisa mais editar código).

### 3️⃣ Criar site
Formulário de preferências → site pronto, com **preview ao vivo**.

- **⚡ Início rápido:** escolha o segmento (24 perfis prontos: padaria, oficina, salão, academia, clínica...) e o site nasce completo — slogan, texto institucional, 4 diferenciais, 3 serviços com preço, 2 depoimentos, paleta e tipografia adequadas
- Vindo do CRM, o segmento é **detectado automaticamente** pela categoria do OpenStreetMap

- **8 paletas** de cores, **4 estilos** (moderno/minimalista/elegante/ousado), **4 tipografias**
- Tema claro ou escuro, alinhamento do topo, imagem de fundo
- Seções ligáveis/desligáveis: Sobre, Serviços, Galeria, Depoimentos, Horários, Contato
- Listas dinâmicas de serviços (com preço), depoimentos e horários
- WhatsApp integrado: botão flutuante, botões no topo e no rodapé
- Mapa do Google embutido, links de Instagram/Facebook
- Preview em desktop e mobile
- **Baixar HTML** (arquivo único, funciona em qualquer hospedagem) ou **Publicar** em `/s/nome-da-empresa` — com **QR code** gerado na hora pra mostrar ao cliente
- Sites gerados já saem com **favicon, meta description e tags Open Graph** (prévia bonita ao compartilhar o link no WhatsApp)
- Botão "Criar site" no CRM já preenche nome, telefone, endereço e horário do lead

---

### 4️⃣ Questionário do cliente (automático)
Link exclusivo por lead: `/formulario?lead=<id>`

- **46 perguntas em 10 etapas**, com barra de progresso e validação
- Já vem pré-preenchido com o que o CRM sabe (nome, telefone, cidade, segmento)
- Sugere os serviços do ramo para o cliente só ajustar
- Primeira pergunta é **"Você quer fechar?"** — se responder *sim*, o lead vira `fechado` no CRM com marcador 🎉
- Ao finalizar, **o site é gerado e publicado na hora** e o cliente já vê o resultado na tela
- Todos os dados (nome, WhatsApp, endereço, horários, serviços, preços, cores, estilo) entram no site sozinhos
- Se alguém responder sem link de lead, entra como lead novo no CRM automaticamente

## Fluxo de trabalho

**Caminho curto (você monta):**
```
Buscar → salvar leads → "Criar site" (segmento detectado sozinho)
        ↓ publicar → modelo "Com preview pronto" → WhatsApp
```

**Caminho automático (o cliente monta):**
```
Buscar → salvar leads → CRM → "📋 Formulário" → WhatsApp
        ↓ cliente preenche as 46 perguntas
Site publicado sozinho + lead vira "fechado" + você é avisado no CRM
```

Você não digita nada. Mandar o site **já pronto** converte muito mais que mandar orçamento.

---

## Estrutura

```
leadsite/
├── index.html      ⭐ App celular — FONTE ÚNICA. É o que o GitHub Pages publica
├── server.js       API + Overpass + Nominatim + servidor de sites publicados
├── sitegen.js      Gerador de HTML (roda no Node e no navegador)
├── brief-schema.js 11 perguntas em 5 etapas (+3 extras) → config do site
├── build.js        Gera public/celular.html a partir de index.html
├── build-previa.js Gera previa.html e previa-formulario.html
├── verificar.js    Testes: sintaxe, builds atualizados, caminhos, rotas, cache
├── testar-navegador.js  Testes num DOM real: clica nas abas e nos botões
├── questionario.html    Página do questionário que o cliente recebe
├── previa.html          ⚠️ GERADO — prévia com 230 empresas reais
├── previa-formulario.html  ⚠️ GERADO — prévia do questionário
├── padaria-pao-dourado.html         Demo de site gerado (mostra pro cliente)
├── oficina-mecanica-confianca.html  Demo de site gerado
├── data/prospeccao-demo.json  As 230 empresas — entrada do build-previa.js
├── data/db.json    Banco (leads + sites publicados) — não vai pro GitHub
└── public/
    ├── index.html    As 3 abas (app de computador, precisa do servidor)
    ├── celular.html  ⚠️ GERADO por build.js — NÃO EDITE
    ├── style.css     Tema escuro
    ├── app.js        Lógica + modelos de mensagem
    ├── perfis.js     24 perfis de segmento (textos, serviços, cores)
    ├── brief.html    Questionário em etapas (página do cliente)
    ├── qrcode.js     Biblioteca de QR Code (terceiro, MIT) — não é código nosso
    └── fotos/banco/  10 fotos ilustrativas, uma por ramo — CÓPIA ÚNICA
```

As fotos do banco moram **só** em `public/fotos/banco/`. Já existiram em dobro
(uma pasta `fotos/` na raiz, idêntica, 1,2 MB a mais no clone) e a raiz foi
embora: os demos apontam para `./public/fotos/banco/...`, que é o caminho que
funciona ao mesmo tempo no GitHub Pages (onde o projeto fica numa subpasta) e
no `node server.js`.

### ⚠️ Antes de editar: qual arquivo é a fonte?

| Você quer mudar… | Edite | E depois rode |
|---|---|---|
| O app de **celular** | `index.html` | `node build.js` |
| O app de **computador** (3 abas) | `public/index.html` + `public/app.js` | `node build-previa.js` |
| O **gerador** de sites | `sitegen.js` (+ o bloco no `index.html`) | `node build.js && node build-previa.js` |
| Os **perfis** de segmento | `public/perfis.js` | `node build-previa.js` |
| O **questionário** | `brief-schema.js` + `public/brief.html` | `node build-previa.js` |
| As **prévias** publicadas | nada — elas são geradas | `node build-previa.js` |
| O **servidor** / API | `server.js` | nada |

`public/celular.html`, `previa.html` e `previa-formulario.html` são **arquivos
gerados**: o que você editar neles some no próximo build. O `node verificar.js`
confere os três e devolve erro se algum estiver velho — é o que impede o
GitHub Pages de publicar uma versão atrasada.

### O app de celular carrega três coisas embutidas

`index.html` é um arquivo só — funciona offline e é o que o GitHub Pages
publica —, então ele leva `qrcode`, `perfis` e o gerador dentro de blocos
`<script>/* nome */`. **Esses blocos têm que ser idênticos às fontes**
(`public/qrcode.js`, `public/perfis.js`, `sitegen.js`). O `verificar.js`
compara os três e falha se divergir.

Isto foi um bug silencioso durante um bom tempo: o `index.html` seguia com o
"Gerador de sites **v2**" (6 funções) enquanto o `sitegen.js` já ia no **v3**
(28 funções, 25 ramos com layout próprio). Na prática o app de celular — justo
o que você usa na rua — gerava um site menor e sem as seções por ramo. Para a
mesma padaria de teste: **23.507 chars no v2 contra 30.599 no v3**, sem
cardápio e sem horário de funcionamento.

Então, ao mexer no gerador: edite `sitegen.js`, **copie o conteúdo dele para
dentro do bloco `<script>/* sitegen */` no `index.html`** e rode
`node build.js && node build-previa.js`.

> Limitação que ficou de pé: no GitHub Pages a prévia do site gerada pelo app
> de celular pede as fotos do banco em `/fotos/banco/...`. Esse é o caminho
> certo para o site de verdade, que o `node server.js` publica em `/s/:slug` —
> mas no Pages, onde o projeto mora em `/leadsite/`, a foto não carrega. No
> servidor e no site do cliente, carrega normalmente.

Antigamente o app de celular vivia copiado em `index.html` **e**
`public/celular.html` — dois arquivos de 340 KB idênticos. Cada correção tinha
que ser feita duas vezes e, quando era feita numa só, as duas versões
divergiam em silêncio. Foi assim que a aba "Criar site" ficou quebrada. Hoje
`index.html` é a única fonte e o `build.js` faz a cópia.

### Testes

```bash
npm i --save-dev jsdom     # uma vez só (o app em si não depende disto)

node verificar.js          # sintaxe + rotas + cache + build (não precisa de jsdom)
node testar-navegador.js   # abre as páginas num DOM real e clica nas abas
npm test                   # os dois
```

`verificar.js` devolve código de saída 1 se algo falhar — dá para usar antes de
todo `git push`. Ele também avisa se você esqueceu de rodar `node build.js`.

## API nova
| Método | Rota | Função |
|---|---|---|
| POST | `/api/fotos` | Salva foto (data URI) e devolve URL pública |
| GET | `/ver/:slug` · `/editar/:slug` | Aprovação e edição rápida (públicas) |
| POST | `/api/aprovar/:slug` | Gostei / lista de ajustes → regenera |
| POST | `/api/editar/:slug` | Horário, promoção e WhatsApp → regenera |

---

## As 3 partes

### 1️⃣ Prospectar
Busca empresas reais no **OpenStreetMap** via **Overpass API** — grátis, sem chave de API, sem limite prático.

- Geocodificação da cidade pelo **Nominatim** (aceita "Rondonópolis, MT" ou qualquer cidade do mundo)
- 25 segmentos filtráveis (restaurante, salão, oficina, construção, clínica...)
- Filtro **"só empresas sem site"** — lê as tags `website` / `contact:website` do OSM
- Filtro "só com telefone"
- Raio configurável (2–25 km) ou cidade inteira
- **Score de 0 a 100** por lead: telefone (+40), sem site (+35), sem rede social (+15), endereço (+10), e-mail (+10), horário (+5)
- Exportação CSV e salvamento em lote no CRM (deduplicado por ID do OSM)
- 3 espelhos Overpass com fallback automático
- **Cache em memória** (cidade: 7 dias, resultados: 6h) e **timeout real** nas chamadas — buscas repetidas ficam instantâneas e uma API fora do ar não trava a tela
- **Limite de 20 buscas / 10 min por IP**, pra não sobrecarregar as APIs públicas do OSM

### 2️⃣ Gerenciar & Comunicar
Funil de vendas + gerador de mensagens.

- Status: `novo` → `contatado` → `negociando` → `fechado` / `perdido`
- Filtro por status, por potencial mínimo (score) e busca por texto
- **⏰ Aviso de "sem retorno"**: destaca leads em `contatado`/`negociando` parados há 3+ dias, com filtro dedicado
- Ficha do lead com anotações e histórico automático de interações
- **6 modelos de mensagem** prontos que se auto-preenchem com os dados do lead (nome da empresa, segmento traduzido e bairro):
  1. Primeiro contato
  2. Com preview pronto
  3. Follow-up gentil
  4. Proposta e preço
  5. Última tentativa
  6. E-mail formal
- Botão abre direto no **WhatsApp** (`wa.me`, adiciona +55) ou no cliente de **e-mail**
- Ao enviar, o status vira "contatado" e registra no histórico automaticamente

> ✏️ Nome e preço padrão: **Nataniel** / **R$ 97**. Para mudar, clique no ⚙ no topo da tela (não precisa mais editar código).

### 3️⃣ Criar site
Formulário de preferências → site pronto, com **preview ao vivo**.

- **⚡ Início rápido:** escolha o segmento (24 perfis prontos: padaria, oficina, salão, academia, clínica...) e o site nasce completo — slogan, texto institucional, 4 diferenciais, 3 serviços com preço, 2 depoimentos, paleta e tipografia adequadas
- Vindo do CRM, o segmento é **detectado automaticamente** pela categoria do OpenStreetMap

- **8 paletas** de cores, **4 estilos** (moderno/minimalista/elegante/ousado), **4 tipografias**
- Tema claro ou escuro, alinhamento do topo, imagem de fundo
- Seções ligáveis/desligáveis: Sobre, Serviços, Galeria, Depoimentos, Horários, Contato
- Listas dinâmicas de serviços (com preço), depoimentos e horários
- WhatsApp integrado: botão flutuante, botões no topo e no rodapé
- Mapa do Google embutido, links de Instagram/Facebook
- Preview em desktop e mobile
- **Baixar HTML** (arquivo único, funciona em qualquer hospedagem) ou **Publicar** em `/s/nome-da-empresa` — com **QR code** gerado na hora pra mostrar ao cliente
- Sites gerados já saem com **favicon, meta description e tags Open Graph** (prévia bonita ao compartilhar o link no WhatsApp)
- Botão "Criar site" no CRM já preenche nome, telefone, endereço e horário do lead

---

### 4️⃣ Questionário do cliente (automático)
Link exclusivo por lead: `/formulario?lead=<id>`

- **46 perguntas em 10 etapas**, com barra de progresso e validação
- Já vem pré-preenchido com o que o CRM sabe (nome, telefone, cidade, segmento)
- Sugere os serviços do ramo para o cliente só ajustar
- Primeira pergunta é **"Você quer fechar?"** — se responder *sim*, o lead vira `fechado` no CRM com marcador 🎉
- Ao finalizar, **o site é gerado e publicado na hora** e o cliente já vê o resultado na tela
- Todos os dados (nome, WhatsApp, endereço, horários, serviços, preços, cores, estilo) entram no site sozinhos
- Se alguém responder sem link de lead, entra como lead novo no CRM automaticamente

## Fluxo de trabalho

**Caminho curto (você monta):**
```
Buscar → salvar leads → "Criar site" (segmento detectado sozinho)
        ↓ publicar → modelo "Com preview pronto" → WhatsApp
```

**Caminho automático (o cliente monta):**
```
Buscar → salvar leads → CRM → "📋 Formulário" → WhatsApp
        ↓ cliente preenche as 46 perguntas
Site publicado sozinho + lead vira "fechado" + você é avisado no CRM
```

Você não digita nada. Mandar o site **já pronto** converte muito mais que mandar orçamento.

---

## Estrutura

```
leadsite/
├── server.js       API + Overpass + Nominatim + servidor de sites publicados
├── sitegen.js      Gerador de HTML (roda no Node e no navegador)
├── build-previa.js Gera previa.html (versão standalone, sem servidor)
├── brief-schema.js 46 perguntas + conversão respostas → site
├── previa.html     Prévia interativa com 230 empresas reais embutidas
├── previa-formulario.html  Prévia do questionário do cliente
├── data/db.json    Banco (leads + sites publicados)
└── public/
    ├── index.html  As 3 abas
    ├── style.css   Tema escuro
    ├── perfis.js   24 perfis de segmento (textos, serviços, cores)
    ├── brief.html  Questionário em 10 etapas (página do cliente)
    └── app.js      Lógica + modelos de mensagem
```

## API

| Método | Rota | Função |
|---|---|---|
| POST | `/api/prospectar` | Busca empresas (cidade, categorias, raioKm, limite, apenasSemSite) |
| GET/POST | `/api/leads` | Listar / salvar leads |
| PATCH/DELETE | `/api/leads/:id` | Atualizar status, notas, histórico / excluir |
| GET/POST | `/api/sites` | Listar / publicar sites |
| GET | `/formulario?lead=:id` | Questionário do cliente |
| GET | `/api/lead-publico/:id` | Dados mínimos para pré-preencher o formulário |
| POST | `/api/brief` | Recebe respostas → gera e publica o site → atualiza o lead |
| GET | `/s/:slug` | Site publicado |

## Notas

- Dados do OSM são **ODbL** — cite o OpenStreetMap se republicar os dados.
- Nem toda empresa está mapeada no OSM; a cobertura é boa em centros urbanos. Telefones aparecem em menos registros do que nomes.
- Para volume maior/dados mais ricos, a camada de busca em `server.js` (`prospectar()`) é isolada — dá pra trocar por Google Places ou Foursquare mudando só essa função.
