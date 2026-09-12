# Subir no GitHub (2 caminhos)

## A) Upload pelo navegador (sem token, ~3 min)
1. github.com → abra seu repositório → botão **Add file → Upload files**
2. Arraste TODOS os arquivos e pastas deste projeto (index.html, fotos/, public/, server.js, etc.)
3. **Commit changes**
4. Para o site no ar: **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**
5. Espere ~1 minuto. Link: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`

## B) Pelo terminal (se tiver git instalado)
```bash
git clone https://github.com/SEU-USUARIO/NOME-DO-REPO.git
# copie os arquivos deste projeto para dentro da pasta
git add -A && git commit -m "LeadSite v3" && git push
```

## O que o GitHub Pages serve (raiz do repo)
- `index.html` → app LeadSite Celular (funciona 100% no navegador)
- `previa.html` → prévia do CRM com 230 empresas de Rondonópolis
- `previa-formulario.html` → prévia do questionário de 9 perguntas
- `padaria-pao-dourado.html` e `oficina-mecanica-confianca.html` → demos de sites gerados
- `public/`, `server.js`, `sitegen.js`... → projeto completo com servidor (rode localmente com `node server.js`)

⚠️ O GitHub Pages é estático: o CRM com servidor (public/) só roda local ou num host com Node (Render/Railway — veja COMO-HOSPEDAR.md).
