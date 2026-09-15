# Estrutura do repositório

Alguns arquivos precisam ficar na **raiz** porque o GitHub Pages
publica a pasta `/` e o servidor procura `server.js`, `sitegen.js`
e as prévias nesse mesmo lugar.

```
leadsite/
├── README.md
├── package.json
├── .gitignore
├── server.js              API + CRM + sites publicados
├── sitegen.js             gerador de HTML (Node e navegador)
├── brief-schema.js        perguntas do formulário
├── build.js               gera public/celular.html a partir de index.html
├── build-previa.js        gera previa.html e previa-formulario.html
├── index.html             app celular (fonte única do GitHub Pages)
├── previa.html            prévia standalone (GERADO)
├── previa-formulario.html prévia do questionário (GERADO)
├── padaria-pao-dourado.html
├── oficina-mecanica-confianca.html
├── exemplo-site-gerado.html
├── questionario.html
├── fotos/banco/           fotos de demo no Pages
├── public/                app do computador + assets do servidor
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── perfis.js
│   ├── brief.html
│   ├── qrcode.js
│   ├── celular.html       GERADO — não edite
│   └── fotos/banco/
├── data/
│   └── prospeccao-demo.json
├── docs/
│   ├── hospedar.md
│   ├── github-pages.md
│   ├── busca-com-ia.md
│   └── estrutura.md
└── tests/
    ├── verificar.js
    ├── testar-navegador.js
    └── testar-busca-ia.js
```

## O que editar

| Quer mudar | Edite | Depois rode |
|---|---|---|
| App de celular | `index.html` | `node build.js` |
| App de computador | `public/index.html` e `public/app.js` | — |
| Gerador de sites | `sitegen.js` | `node build.js` |
| Servidor / API | `server.js` | — |
| Busca com IA (celular) | `index.html` (bloco da busca) | `node build.js` |
| Busca com IA (servidor) | `server.js` | — |
| Busca com IA (computador) | `public/app.js` | — |

A busca com IA mora em três lugares que precisam continuar dizendo a mesma coisa:
`index.html` (celular), `server.js` (servidor) e `public/app.js` (computador).
Mudou o prompt ou a limpeza de campos num? Confira os outros dois — e rode
`npm run test:ia`, que é o que pega divergência silenciosa.

Não edite `public/celular.html`, `previa.html` nem `previa-formulario.html`.
Eles são gerados e a próxima build apaga a alteração.
