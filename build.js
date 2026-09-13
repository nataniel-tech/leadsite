#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   build.js — gera public/celular.html a partir de index.html

   POR QUE ISTO EXISTE
   -------------------
   O app celular vivia copiado em DOIS arquivos de 340 KB e ~8.000 linhas:

       index.html            ← o que o GitHub Pages publica
       public/celular.html   ← o que o node server.js serve em /celular.html

   Os dois eram idênticos, byte por byte. Toda correção tinha que ser feita
   duas vezes — e quando era feita numa só, as duas versões divergiam em
   silêncio. Foi assim que a aba "Criar site" ficou quebrada numa e não na
   outra.

   AGORA
   -----
   index.html é a ÚNICA fonte. public/celular.html é arquivo GERADO.

       node build.js          gera
       node build.js --check  só confere se está atualizado (senão, erro)

   NUNCA edite public/celular.html: o próximo build apaga a sua mudança.
   Edite index.html e rode `node build.js`.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const R = __dirname;
const FONTE = path.join(R, 'index.html');
const ALVO = path.join(R, 'public', 'celular.html');

/* Aviso plantado no arquivo gerado, para quem abrir ele sem saber. */
const AVISO = '<!-- ═══════════════════════════════════════════════════════════════\n' +
  '     ARQUIVO GERADO — NÃO EDITE.\n' +
  '     É uma cópia de index.html, feita por build.js.\n' +
  '     Para mudar qualquer coisa, edite index.html e rode:  node build.js\n' +
  '     ═══════════════════════════════════════════════════════════════ -->\n';

function gerar() {
  const fonte = fs.readFileSync(FONTE, 'utf8');

  if (!/^<!DOCTYPE html>/i.test(fonte.trimStart())) {
    throw new Error('index.html não começa com <!DOCTYPE html> — o build prefere parar a gerar algo estranho.');
  }

  /* O aviso entra logo depois do <!DOCTYPE ...>, para não quebrar o "quirks
     mode" do navegador (comentário antes do DOCTYPE muda o modo de render). */
  const m = fonte.match(/^\s*<!DOCTYPE[^>]*>/i);
  const saida = m
    ? m[0] + '\n' + AVISO + fonte.slice(m[0].length)
    : AVISO + fonte;

  return saida;
}

function principal() {
  const soChecando = process.argv.includes('--check');
  const conteudo = gerar();

  if (soChecando) {
    const atual = fs.existsSync(ALVO) ? fs.readFileSync(ALVO, 'utf8') : null;
    if (atual === conteudo) {
      console.log('✔ public/celular.html está atualizado com index.html');
      return 0;
    }
    console.error('✘ public/celular.html está DESATUALIZADO.');
    console.error('  Você editou index.html e não regenerou a cópia.');
    console.error('  Rode:  node build.js');
    return 1;
  }

  fs.writeFileSync(ALVO, conteudo);
  const kb = (fs.statSync(ALVO).size / 1024).toFixed(0);
  console.log(`✔ public/celular.html gerado a partir de index.html (${kb} KB)`);
  return 0;
}

if (require.main === module) {
  try {
    process.exit(principal());
  } catch (e) {
    console.error('build.js falhou:', e.message);
    process.exit(1);
  }
}

module.exports = { gerar };
