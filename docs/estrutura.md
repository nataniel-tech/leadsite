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
│   └── estrutura.md
└── tests/
    ├── verificar.js
    └── testar-navegador.js
```

## O que editar

| Quer mudar | Edite | Depois rode |
|---|---|---|
| App de celular | `index.html` | `node build.js` |
| App de computador | `public/index.html` e `public/app.js` | — |
| Gerador de sites | `sitegen.js` | `node build.js` |
| Servidor / API | `server.js` | — |

Não edite `public/celular.html`, `previa.html` nem `previa-formulario.html`.
Eles são gerados e a próxima build apaga a alteração.
