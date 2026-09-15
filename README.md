# LeadSite

Prospecção → CRM → criação de sites para empresas locais.

## Como rodar

```bash
node server.js
# http://localhost:3000
```

Precisa só do Node.js 18+. O app em si não tem dependência extra.

```bash
PORT=8080 LEADSITE_SENHA=minhasenha123 GEMINI_API_KEY=AIza... node server.js
```

| Variável | Para quê | Padrão |
|---|---|---|
| `PORT` | porta do servidor | `3000` |
| `LEADSITE_SENHA` | login no CRM (formulário e sites publicados continuam abertos) | desligado |
| `GEMINI_API_KEY` | [busca de clientes com IA](docs/busca-com-ia.md) (Gemini + Google Maps) | desligada — usa o OpenStreetMap |
| `GEMINI_MODEL` | força um modelo do Gemini | o app escolhe e troca sozinho |

Nome e preço do vendedor: clique no ⚙ no CRM. Não precisa editar código.

## Pastas

- `server.js`, `sitegen.js`, `index.html` — núcleo (ficam na raiz de propósito: GitHub Pages e o servidor usam esses caminhos)
- `public/` — app de computador, CSS, perfis e fotos servidas pelo Node
- `data/` — demo versionada + banco local (o banco **não** vai pro Git)
- `docs/` — [como hospedar](docs/hospedar.md) e [GitHub Pages](docs/github-pages.md)
- `tests/` — checagens antes de publicar

Mapa completo: [docs/estrutura.md](docs/estrutura.md)

## Comandos

```bash
npm start              # sobe o servidor
npm run build          # copia index.html → public/celular.html
npm run previa         # gera as prévias estáticas
npm test               # tudo (precisa: npm i --save-dev jsdom)
npm run test:rapido    # sintaxe + build + busca com IA, sem subir servidor
npm run test:ia        # só a busca com IA
```

## O que o sistema faz

1. **Prospectar** empresas com **IA** (Gemini + Google Maps) ou no OpenStreetMap,
   com filtro “sem site”, score, gancho de venda e **dossiê** por empresa.
   Detalhes: [docs/busca-com-ia.md](docs/busca-com-ia.md).
2. **CRM** com funil, modelos de WhatsApp/e-mail e aviso de lead parado.
3. **Criar site** a partir do segmento (24 perfis) ou do questionário do cliente.
4. **Publicar** em `/s/slug`, página de aprovação `/ver/slug` e edição rápida `/editar/slug`.

## API principal

| Método | Rota | Função |
|---|---|---|
| POST | `/api/prospectar` | busca empresas (`fonte: "gemini"` ou `"osm"`) |
| POST | `/api/dossie` | ficha completa de uma empresa, feita pela IA |
| GET | `/api/fontes` | quais fontes de busca o servidor tem ligadas |
| GET/POST | `/api/leads` | listar / salvar leads |
| PATCH/DELETE | `/api/leads/:id` | atualizar / excluir |
| GET/POST | `/api/sites` | listar / publicar |
| POST | `/api/brief` | respostas do cliente → site |
| POST | `/api/fotos` | salva foto e devolve URL |
| GET | `/s/:slug` | site publicado |
| GET | `/ver/:slug` · `/editar/:slug` | aprovação e edição |

## Notas

- Dados do OSM são ODbL — cite o OpenStreetMap se republicar.
- A busca com IA tem **5.000 chamadas por mês de graça** e faz uma chamada por
  cidade (não por empresa). O dossiê gasta uma por empresa e só roda quando você clica.
- Dado de mapa muda e IA erra: o app marca o que o Google confirmou. Confira antes de ligar.
- Não cole token do GitHub no código, no chat ou no README. Use variável de ambiente.
- Backup: `data/db.json` são os seus leads.
