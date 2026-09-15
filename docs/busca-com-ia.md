# Busca com IA — Gemini + Google Maps

A busca de clientes deixa de ser "o que está cadastrado no mapa" e passa a ser
"o que a IA consegue descobrir sobre cada empresa". Numa chamada só o Gemini
consulta o **Google Maps** (250 milhões de lugares) **e a busca do Google**, e
devolve a empresa já pronta pra abordar.

## O que muda na prática

| Antes (OpenStreetMap) | Agora (Gemini + Maps) |
|---|---|
| nome, endereço, às vezes telefone | nome, endereço, bairro, telefone, **WhatsApp**, e-mail |
| site (raro) | site **de verdade** — Instagram/Facebook não contam como site |
| nada de rede social | **Instagram e Facebook** |
| nada | **nota e nº de avaliações** do Google |
| nada | **nome do dono** |
| nada | **gancho de venda** escrito, citando algo real daquela empresa |
| nada | **ponto fraco online** em uma frase |
| nada | link direto pro lugar no Google Maps + `placeId` |

E ainda tem o **dossiê** (`🔎 Investigar a fundo`): uma chamada por empresa que
volta com CNPJ, ano de abertura, tamanho da equipe, quantas fotos tem no Maps,
o que os clientes **reclamam** e **elogiam** nas avaliações, se o Instagram está
abandonado, os concorrentes, o que um site resolveria — e uma **mensagem de
WhatsApp pronta** que cita um fato real daquele negócio.

## Como ligar

### App de celular (GitHub Pages)
⚙ Ajustes → **🔍 Busca de clientes** → *Chave do Gemini*.
Chave grátis em **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** —
entre com a conta Google e toque em *Create API key*.

Se você já escolheu **Gemini** como provedor de IA e colou a chave lá, não
precisa colar duas vezes: a busca aproveita a mesma chave.

### App de computador (servidor Node)
```bash
GEMINI_API_KEY=AIza... node server.js
```

| Variável | Para quê | Padrão |
|---|---|---|
| `GEMINI_API_KEY` | liga a busca com IA e o `/api/dossie` | desligado |
| `GEMINI_MODEL` | força um modelo | o app escolhe e troca sozinho se um sair do ar |

Sem a chave nada quebra: `/api/prospectar` continua no OpenStreetMap e os botões
de IA ficam escondidos.

## Custo

- **5.000 buscas com Maps por mês de graça** (família Gemini 3).
- Depois disso, ~US$ 14 por 1.000 consultas.
- A busca faz **uma chamada por cidade**, não por empresa. A caçada na região
  inteira (37 cidades) gasta 37. O dossiê gasta 1 por empresa e só roda quando
  você clica — e no lote ele avisa quantas chamadas vai gastar antes.

Modelos suportados: `gemini-3.8-flash`, `3.7-flash`, `3.6-flash`, `3.5-flash`,
`3.5-flash-lite`, `3.1-pro-preview`, `2.5-pro/flash/flash-lite`.

## As três pegadinhas (por que o código é assim)

Quem copia o exemplo da documentação e sai usando cai nestas três. Nenhuma
delas dá erro no console — todas produzem **uma lista bonita de empresas que não
existem**, o que é muito pior, porque o usuário liga pra número inventado.

### 1. O prompt TEM que ser inglês
O Grounding with Google Maps **só entende prompt em inglês** (limitação oficial
do Google). Em português a ferramenta é ignorada em silêncio e o modelo responde
de cabeça. Por isso `promptBuscaGemini()` escreve em inglês e manda o modelo
devolver nome/endereço/bairro **como estão no Maps brasileiro**.

Existe um teste que falha se alguém adicionar uma categoria em `CATEGORIAS`
sem traduzir em `GEMINI_CAT_EN` — é justamente por isso.

### 2. Nada de `responseMimeType: "application/json"`
O módulo que escreve os textos do site usa JSON estruturado. Com grounding a API
recusa ou devolve vazio. O JSON é pedido **no texto** e extraído por
`extrairListaIA()`, que tolera:

- cerca de ```` ```json ````
- texto antes e depois ("Claro! Aqui está: …")
- lista sem o objeto em volta
- **resposta cortada no meio** por falta de token — salva as empresas completas
  e descarta só a última, em vez de perder as 39 que vieram antes

### 3. Alucinação se combate com o grounding, não com fé
O prompt proíbe inventar, mas isso não basta. Toda empresa é comparada com os
lugares que o Google devolveu em `groundingMetadata.groundingChunks[].maps`:

- **casou** → ganha `placeId`, link real do Maps, selo `✓ no Google Maps` e +10 pontos
- **não casou** → entra como `🤖 IA · conferir`, sem se passar por verificada
- lista inteira sem nenhum lugar no grounding **e** sem telefone/endereço →
  a busca **estoura com aviso** em vez de encher o CRM de fantasma

O casamento ignora acento, maiúscula e sufixo de razão social, então
`PADARIA PAO DOURADO LTDA` casa com `Padaria Pão Dourado`.

## Duas regras de negócio que valem dinheiro

**Instagram não é site.** Empresa pequena frequentemente tem o Instagram *como*
site. Se o campo `site` vier com uma URL de rede social, ela vai pro campo
`instagram` e `temSite` continua **falso** — porque esse é justamente o melhor
lead da lista. Sem essa regra ele some no filtro "só quem não tem site".

**Lead já salvo não é descartado, é enriquecido.** A busca com IA quase sempre
sabe mais que a anterior. `enriquecerLead()` preenche o que estava vazio,
**nunca sobrescreve** o que já tinha, registra no histórico o que mudou e
recalcula o score.

## Pontuação

A base é a mesma de sempre (telefone 40, sem site 35, sem rede social 15,
endereço 10, e-mail 10, horário 5 = 115). A IA **soma** por cima:

| +10 | confirmado no Google Maps |
|---|---|
| +8 | tem WhatsApp (dá pra chamar hoje) |
| +7 | nota boa mas poucas avaliações (reputação frágil) |
| +5 | sabe o nome do dono |
| +5 | já tem gancho de venda escrito |
| +5 | vende pelo Instagram e não tem site |

Quem vem do OpenStreetMap não tem esses campos, então **o score antigo não muda
nada** — há teste garantindo isso.

## API

| Método | Rota | Função |
|---|---|---|
| POST | `/api/prospectar` | aceita `fonte: "gemini" \| "osm"`; sem `fonte`, usa a IA se houver chave |
| POST | `/api/dossie` | `{empresa:{nome,cidade,…}}` → ficha completa |
| GET | `/api/fontes` | diz ao app o que o servidor consegue fazer (`{padrao,gemini,modelo}`) |

A resposta de `/api/prospectar` ganha `fonte`, `modelo` e `confirmados`.
As empresas ganham `whatsapp`, `instagram`/`facebook` (em `redes`), `dono`,
`nota`, `avaliacoes`, `bairro`, `gancho`, `problema`, `placeId`, `confirmado`,
`servicos` e `fonte`. O CSV do app de computador exporta tudo isso.

## Testes

```bash
npm run test:ia
```

`tests/testar-busca-ia.js` finge o Gemini com respostas no formato real da API
(`groundingMetadata` incluído) e cobre as três pegadinhas acima, mais: limpeza de
telefone/URL, casamento de nome, score, enriquecimento de lead, ficha cortada,
fusão do dossiê, **XSS** (texto da IA indo pro `innerHTML` é sempre escapado) e
a tela de Ajustes. Roda sem internet e sem gastar cota.

## Aviso

Dados de mapa mudam e a IA pode errar. O app marca o que foi confirmado pelo
Google e o que não foi — **confira antes de ligar**. E os termos de uso do
Grounding pedem que a fonte seja citada: os cartões e a ficha mostram
"Google Maps" e o modelo que respondeu.
