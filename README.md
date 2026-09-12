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
