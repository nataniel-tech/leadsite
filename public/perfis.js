/* Perfis prontos por segmento — preenchem textos, serviços e cores automaticamente.
   Funciona no navegador e no Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Perfis = factory();
})(typeof self !== 'undefined' ? self : this, function () {

const d = (texto, autor, papel) => ({ texto, autor, papel: papel || 'Cliente' });

const PERFIS = {
  padaria: {
    rotulo:'Padaria / Confeitaria', paleta:'ambar', fonte:'friendly',
    slogan:'Pão quentinho e doces artesanais todos os dias',
    sobreTitulo:'Nossa padaria',
    sobreTexto:'Produzimos tudo diariamente, com fermentação natural e ingredientes selecionados.\nDo pão francês da manhã ao bolo da sua festa, cada receita é feita com o cuidado de quem faz por gosto.',
    diferenciais:['Fornada fresca várias vezes ao dia','Encomendas para festas e eventos','Café da manhã e lanche da tarde','Atendimento de segunda a domingo'],
    rotuloServicos:'O que fazemos', servicosSub:'Feito na hora, do nosso forno para a sua mesa',
    servicos:[
      { titulo:'Pães artesanais', descricao:'Pão francês, integral, australiano e de fermentação natural, saindo quentinho do forno.', preco:'A partir de R$ 12/kg' },
      { titulo:'Bolos e tortas', descricao:'Bolos caseiros no balcão e tortas sob encomenda para aniversários e comemorações.', preco:'Sob encomenda' },
      { titulo:'Salgados e lanches', descricao:'Coxinha, esfiha, pão de queijo e sanduíches naturais feitos na hora.', preco:'A partir de R$ 6' },
    ],
    depoimentos:[ d('O melhor pão da região, sem exagero. Passo aqui todo dia antes do trabalho.','Marcos Pereira'),
                  d('Encomendei o bolo de aniversário da minha filha e ficou perfeito. Recomendo demais!','Juliana Alves') ],
  },

  restaurante: {
    rotulo:'Restaurante', paleta:'vinho', fonte:'classica',
    slogan:'Comida caseira feita com capricho',
    sobreTitulo:'Sobre o restaurante',
    sobreTexto:'Servimos comida de verdade, daquela que lembra a casa da avó. Nosso buffet é montado todos os dias com ingredientes frescos.\nAmbiente familiar, atendimento próximo e aquele tempero que faz o cliente voltar.',
    diferenciais:['Buffet variado todos os dias','Ambiente climatizado e familiar','Marmitex e delivery','Estacionamento para clientes'],
    rotuloServicos:'Nosso cardápio', servicosSub:'Sabor caseiro em cada prato',
    servicos:[
      { titulo:'Almoço executivo', descricao:'Buffet completo com carnes, saladas, guarnições e sobremesa inclusa.', preco:'R$ 39,90' },
      { titulo:'Marmitex', descricao:'Marmita quentinha e bem servida, com entrega em toda a cidade.', preco:'A partir de R$ 22' },
      { titulo:'Eventos e grupos', descricao:'Espaço reservado para confraternizações, aniversários e almoços de empresa.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Comida excelente e porção muito bem servida. Virou meu almoço de todo dia.','Roberto Lima'),
                  d('Atendimento rápido mesmo lotado. A sobremesa é um capítulo à parte!','Fernanda Castro') ],
  },

  lanchonete: {
    rotulo:'Lanchonete / Hamburgueria', paleta:'coral', fonte:'friendly',
    slogan:'O lanche que mata sua fome de verdade',
    sobreTitulo:'Quem somos',
    sobreTexto:'Hambúrguer artesanal, pão macio e ingredientes frescos preparados na hora do pedido.\nNada de lanche montado às pressas: aqui cada pedido sai como se fosse pra gente mesmo.',
    diferenciais:['Carne artesanal 100% bovina','Entrega rápida em toda a cidade','Combos que cabem no bolso','Aberto até tarde'],
    rotuloServicos:'Nosso cardápio', servicosSub:'Peça pelo WhatsApp e receba em casa',
    servicos:[
      { titulo:'Hambúrgueres artesanais', descricao:'Blend de 160g, queijo derretido, molho da casa e pão brioche.', preco:'A partir de R$ 24' },
      { titulo:'Porções para dividir', descricao:'Batata frita, frango a passarinho e calabresa acebolada.', preco:'A partir de R$ 32' },
      { titulo:'Combos e promoções', descricao:'Lanche + bebida + batata com preço especial todos os dias.', preco:'A partir de R$ 35' },
    ],
    depoimentos:[ d('Melhor hambúrguer da cidade e chega rapidinho. Peço toda sexta!','Diego Martins'),
                  d('Porção generosa e atendimento simpático. Recomendo o combo da casa.','Patrícia Nunes') ],
  },

  bar_cafe: {
    rotulo:'Bar / Cafeteria', paleta:'grafite', fonte:'moderna',
    slogan:'O ponto de encontro que você procurava',
    sobreTitulo:'Sobre nós',
    sobreTexto:'Um espaço pensado para você relaxar depois do expediente, encontrar os amigos ou trabalhar com um bom café.\nBebidas bem servidas, petiscos preparados na hora e um ambiente que convida a ficar.',
    diferenciais:['Chope sempre gelado','Música ao vivo nos fins de semana','Petiscos preparados na hora','Wi-fi liberado para clientes'],
    rotuloServicos:'O que servimos', servicosSub:'Do café da manhã ao happy hour',
    servicos:[
      { titulo:'Bebidas', descricao:'Chope, drinks autorais, cafés especiais e sucos naturais.', preco:'A partir de R$ 9' },
      { titulo:'Petiscos', descricao:'Tábuas para compartilhar, porções e lanches rápidos.', preco:'A partir de R$ 28' },
      { titulo:'Eventos', descricao:'Reserve o espaço para aniversários e confraternizações.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Ambiente agradável e atendimento nota dez. Virou nosso ponto fixo.','Lucas Ferreira'),
                  d('O café é excelente e dá pra trabalhar tranquilo. Adoro esse lugar.','Camila Rocha') ],
  },

  mercado: {
    rotulo:'Mercado / Hortifruti', paleta:'floresta', fonte:'moderna',
    slogan:'Tudo o que sua casa precisa, pertinho de você',
    sobreTitulo:'Sobre o mercado',
    sobreTexto:'Somos um mercado de bairro que conhece o cliente pelo nome. Produtos frescos, preço justo e reposição diária.\nAqui você resolve a compra da semana sem enfrentar fila de supermercado grande.',
    diferenciais:['Hortifruti reposto diariamente','Açougue com carnes selecionadas','Entrega no bairro','Aceitamos todos os cartões e Pix'],
    rotuloServicos:'Nossos setores', servicosSub:'Qualidade e preço justo em cada corredor',
    servicos:[
      { titulo:'Hortifruti', descricao:'Frutas, verduras e legumes fresquinhos, com reposição todos os dias.', preco:'' },
      { titulo:'Açougue e frios', descricao:'Cortes bovinos, suínos, aves e frios fatiados na hora.', preco:'' },
      { titulo:'Mercearia e bebidas', descricao:'Itens de despensa, limpeza, higiene e bebidas geladas.', preco:'' },
    ],
    depoimentos:[ d('Preço melhor que o do supermercado grande e o atendimento é muito mais humano.','Sandra Oliveira'),
                  d('As verduras são sempre fresquinhas. Faço minha feira aqui há anos.','José Carlos') ],
  },

  salao: {
    rotulo:'Salão de Beleza / Estética', paleta:'violeta', fonte:'moderna',
    slogan:'Realçando a sua beleza com cuidado e técnica',
    sobreTitulo:'Sobre o salão',
    sobreTexto:'Nossa equipe é formada por profissionais em constante atualização, usando produtos de marcas reconhecidas.\nMais do que um serviço, oferecemos um momento de cuidado com você.',
    diferenciais:['Profissionais especializados','Produtos de alta qualidade','Atendimento com hora marcada','Ambiente climatizado e acolhedor'],
    rotuloServicos:'Nossos serviços', servicosSub:'Agende pelo WhatsApp e garanta seu horário',
    servicos:[
      { titulo:'Cabelo', descricao:'Corte, escova, coloração, mechas e tratamentos de reconstrução.', preco:'A partir de R$ 50' },
      { titulo:'Unhas', descricao:'Manicure, pedicure, alongamento e nail art personalizada.', preco:'A partir de R$ 35' },
      { titulo:'Estética e sobrancelhas', descricao:'Design de sobrancelhas, limpeza de pele e depilação.', preco:'A partir de R$ 30' },
    ],
    depoimentos:[ d('Saio sempre me sentindo outra pessoa. Profissionais maravilhosas!','Aline Souza'),
                  d('Respeitam o horário marcado e o resultado é sempre impecável.','Bruna Ribeiro') ],
  },

  academia: {
    rotulo:'Academia', paleta:'esmeralda', fonte:'tech',
    slogan:'Seu melhor shape começa aqui',
    sobreTitulo:'Sobre a academia',
    sobreTexto:'Estrutura completa, equipamentos modernos e acompanhamento profissional de verdade.\nSeja para emagrecer, ganhar massa ou só cuidar da saúde, montamos um treino para o seu objetivo.',
    diferenciais:['Avaliação física gratuita','Professores presentes em todos os horários','Equipamentos novos e revisados','Sem taxa de matrícula'],
    rotuloServicos:'Modalidades', servicosSub:'Treine do seu jeito, no seu ritmo',
    servicos:[
      { titulo:'Musculação', descricao:'Área completa de peso livre e máquinas, com treino individualizado.', preco:'A partir de R$ 89/mês' },
      { titulo:'Aulas coletivas', descricao:'Funcional, spinning, dança e ginástica em vários horários.', preco:'Incluso no plano' },
      { titulo:'Personal trainer', descricao:'Acompanhamento exclusivo para acelerar seus resultados.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Ambiente motivador e professores que realmente corrigem o exercício.','Thiago Barbosa'),
                  d('Perdi 12 kg em 6 meses com o acompanhamento daqui. Recomendo!','Renata Dias') ],
  },

  oficina: {
    rotulo:'Oficina Mecânica', paleta:'oceano', fonte:'tech',
    slogan:'Seu carro nas mãos de quem entende',
    sobreTitulo:'Sobre a oficina',
    sobreTexto:'Diagnóstico honesto, orçamento antes do serviço e prazo cumprido. É assim que trabalhamos desde o início.\nAtendemos veículos nacionais e importados com equipamento de diagnóstico eletrônico.',
    diferenciais:['Orçamento sem compromisso','Garantia em peças e serviços','Diagnóstico eletrônico computadorizado','Mecânicos com anos de experiência'],
    rotuloServicos:'Nossos serviços', servicosSub:'Manutenção completa para o seu veículo',
    servicos:[
      { titulo:'Revisão geral', descricao:'Checagem completa de freios, suspensão, motor e sistema elétrico.', preco:'A partir de R$ 150' },
      { titulo:'Troca de óleo e filtros', descricao:'Óleo sintético ou mineral, com troca de filtros e checklist incluso.', preco:'A partir de R$ 120' },
      { titulo:'Injeção eletrônica', descricao:'Leitura de erros, limpeza de bicos e ajuste de módulo.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Resolveram um problema que outras duas oficinas não acharam. Gente séria.','Paulo Henrique'),
                  d('Orçamento justo e entregaram no prazo combinado. Voltarei sempre.','Márcia Gomes') ],
  },

  autopecas: {
    rotulo:'Autopeças', paleta:'grafite', fonte:'tech',
    slogan:'A peça certa pelo melhor preço',
    sobreTitulo:'Sobre a loja',
    sobreTexto:'Estoque amplo de peças originais e paralelas para as principais montadoras.\nSe não tiver na loja, conseguimos rápido pra você não ficar com o carro parado.',
    diferenciais:['Peças originais e paralelas','Pronta entrega em estoque','Preço de atacado e varejo','Atendimento técnico especializado'],
    rotuloServicos:'O que temos', servicosSub:'Consulte a disponibilidade pelo WhatsApp',
    servicos:[
      { titulo:'Peças de motor', descricao:'Correias, bombas, juntas, velas e componentes de motor em geral.', preco:'' },
      { titulo:'Freios e suspensão', descricao:'Pastilhas, discos, amortecedores, molas e kits completos.', preco:'' },
      { titulo:'Elétrica e acessórios', descricao:'Baterias, lâmpadas, alternadores e acessórios automotivos.', preco:'' },
    ],
    depoimentos:[ d('Sempre tem a peça que preciso e o preço é melhor que da concessionária.','Anderson Silva'),
                  d('Atendimento rápido e ainda me orientaram sobre a instalação.','Cleber Moraes') ],
  },

  clinica: {
    rotulo:'Clínica / Consultório', paleta:'oceano', fonte:'moderna',
    slogan:'Cuidando da sua saúde com atenção e respeito',
    sobreTitulo:'Sobre a clínica',
    sobreTexto:'Atendimento humanizado, com tempo de consulta adequado e escuta de verdade.\nEstrutura moderna e equipe preparada para cuidar de você e da sua família.',
    diferenciais:['Atendimento humanizado','Agendamento sem filas','Equipamentos modernos','Convênios e particular'],
    rotuloServicos:'Especialidades', servicosSub:'Agende sua consulta pelo WhatsApp',
    servicos:[
      { titulo:'Consultas', descricao:'Atendimento clínico com avaliação completa e orientação personalizada.', preco:'Consulte valores' },
      { titulo:'Exames', descricao:'Exames realizados na própria clínica, com resultado rápido.', preco:'Consulte valores' },
      { titulo:'Acompanhamento', descricao:'Retornos e acompanhamento contínuo do seu tratamento.', preco:'' },
    ],
    depoimentos:[ d('Fui muito bem atendida, sem pressa e com explicações claras.','Vera Lúcia'),
                  d('Consegui marcar rápido e o atendimento foi pontual. Excelente.','Rodrigo Teixeira') ],
  },

  veterinaria: {
    rotulo:'Pet Shop / Veterinária', paleta:'esmeralda', fonte:'friendly',
    slogan:'Carinho e cuidado para quem é da família',
    sobreTitulo:'Sobre nós',
    sobreTexto:'Sabemos que seu pet não é só um animal, é parte da família. Por isso tratamos cada um com paciência e afeto.\nEstrutura completa para saúde, higiene e bem-estar do seu companheiro.',
    diferenciais:['Veterinário responsável presente','Banho e tosa com hidratação','Produtos e rações selecionadas','Atendimento com hora marcada'],
    rotuloServicos:'Nossos serviços', servicosSub:'Tudo o que seu pet precisa em um só lugar',
    servicos:[
      { titulo:'Banho e tosa', descricao:'Higiene completa com produtos adequados para cada tipo de pelagem.', preco:'A partir de R$ 45' },
      { titulo:'Consulta veterinária', descricao:'Avaliação clínica, vacinação e orientação de cuidados.', preco:'A partir de R$ 90' },
      { titulo:'Rações e acessórios', descricao:'Alimentos, brinquedos, camas e acessórios das melhores marcas.', preco:'' },
    ],
    depoimentos:[ d('Cuidam do meu cachorro com um carinho enorme. Confio de olhos fechados.','Larissa Campos'),
                  d('Atendimento veterinário atencioso e preço honesto. Recomendo!','Eduardo Pinto') ],
  },

  farmacia: {
    rotulo:'Farmácia / Drogaria', paleta:'esmeralda', fonte:'moderna',
    slogan:'Sua saúde bem cuidada, pertinho de casa',
    sobreTitulo:'Sobre a farmácia',
    sobreTexto:'Medicamentos, dermocosméticos e produtos de saúde com atendimento farmacêutico de verdade.\nEntregamos em casa para você não precisar sair quando não estiver bem.',
    diferenciais:['Farmacêutico sempre presente','Entrega rápida em domicílio','Aplicação de injetáveis','Descontos em medicamentos de uso contínuo'],
    rotuloServicos:'Nossos serviços', servicosSub:'Peça pelo WhatsApp e receba em casa',
    servicos:[
      { titulo:'Medicamentos', descricao:'Genéricos, similares e de marca, com os melhores preços da região.', preco:'' },
      { titulo:'Serviços farmacêuticos', descricao:'Aferição de pressão, glicemia e aplicação de injetáveis.', preco:'A partir de R$ 10' },
      { titulo:'Higiene e beleza', descricao:'Dermocosméticos, higiene pessoal e produtos infantis.', preco:'' },
    ],
    depoimentos:[ d('Entregaram o remédio em 20 minutos. Salvou meu dia!','Isabel Fonseca'),
                  d('O farmacêutico sempre tira minhas dúvidas com paciência.','Antônio Ramos') ],
  },

  roupas: {
    rotulo:'Loja de Roupas / Calçados', paleta:'violeta', fonte:'moderna',
    slogan:'Moda que combina com o seu estilo',
    sobreTitulo:'Sobre a loja',
    sobreTexto:'Selecionamos peças que unem tendência, qualidade e preço que cabe no bolso.\nColeções novas toda estação e atendimento que ajuda você a montar o look certo.',
    diferenciais:['Novidades toda semana','Parcelamos em até 6x sem juros','Provador confortável','Troca facilitada em até 30 dias'],
    rotuloServicos:'O que você encontra', servicosSub:'Veja as novidades no nosso WhatsApp',
    servicos:[
      { titulo:'Moda feminina', descricao:'Vestidos, blusas, calças e peças para o dia a dia ou ocasiões especiais.', preco:'A partir de R$ 59' },
      { titulo:'Moda masculina', descricao:'Camisas, camisetas, bermudas e calças com caimento perfeito.', preco:'A partir de R$ 69' },
      { titulo:'Calçados e acessórios', descricao:'Tênis, sandálias, bolsas e acessórios para completar o visual.', preco:'A partir de R$ 89' },
    ],
    depoimentos:[ d('Sempre acho peça bonita e o preço é bem melhor que no shopping.','Tatiane Moreira'),
                  d('As meninas ajudam a escolher sem empurrar nada. Adoro comprar aqui.','Carla Menezes') ],
  },

  construcao: {
    rotulo:'Material de Construção', paleta:'ambar', fonte:'moderna',
    slogan:'Do alicerce ao acabamento, tem aqui',
    sobreTitulo:'Sobre a loja',
    sobreTexto:'Atendemos desde o pedreiro que precisa de um saco de cimento até a obra completa.\nEstoque amplo, entrega na obra e equipe que entende do assunto para te orientar.',
    diferenciais:['Entrega na obra','Preço especial para construtores','Estoque completo','Orçamento rápido pelo WhatsApp'],
    rotuloServicos:'Nossos produtos', servicosSub:'Mande sua lista pelo WhatsApp e receba o orçamento',
    servicos:[
      { titulo:'Material básico', descricao:'Cimento, areia, brita, tijolos, blocos e argamassa.', preco:'' },
      { titulo:'Acabamento', descricao:'Pisos, azulejos, tintas, louças e metais sanitários.', preco:'' },
      { titulo:'Elétrica e hidráulica', descricao:'Fios, conduítes, tubos, conexões e caixas d\u2019água.', preco:'' },
    ],
    depoimentos:[ d('Entregaram tudo na obra no mesmo dia. Preço bom e sem enrolação.','Sebastião Farias'),
                  d('Me orientaram na escolha do piso e economizei bastante. Ótimo atendimento.','Gilberto Nascimento') ],
  },

  moveis: {
    rotulo:'Móveis e Decoração', paleta:'ambar', fonte:'classica',
    slogan:'Sua casa do jeito que você sempre quis',
    sobreTitulo:'Sobre a loja',
    sobreTexto:'Móveis que unem conforto, durabilidade e bom gosto, com preço que cabe no seu planejamento.\nAjudamos você a escolher o que combina com o seu espaço e seu estilo.',
    diferenciais:['Montagem inclusa','Parcelamento facilitado','Entrega em toda a região','Garantia de fábrica'],
    rotuloServicos:'Nossos produtos', servicosSub:'Veja o catálogo completo pelo WhatsApp',
    servicos:[
      { titulo:'Sala e quarto', descricao:'Sofás, racks, guarda-roupas, camas e colchões.', preco:'A partir de R$ 599' },
      { titulo:'Cozinha e área de serviço', descricao:'Armários planejados, mesas, cadeiras e organizadores.', preco:'A partir de R$ 799' },
      { titulo:'Decoração', descricao:'Tapetes, luminárias, quadros e itens para dar personalidade ao ambiente.', preco:'A partir de R$ 49' },
    ],
    depoimentos:[ d('Entregaram e montaram no dia marcado. Móvel de ótima qualidade.','Simone Barros'),
                  d('Consegui mobiliar o apartamento todo dentro do meu orçamento.','Wesley Andrade') ],
  },

  eletronicos: {
    rotulo:'Eletrônicos / Celulares', paleta:'oceano', fonte:'tech',
    slogan:'Tecnologia com garantia e preço justo',
    sobreTitulo:'Sobre a loja',
    sobreTexto:'Produtos originais com nota fiscal e garantia, além de assistência técnica para quando algo dá errado.\nAqui você compra com segurança e tem a quem recorrer depois.',
    diferenciais:['Produtos originais com garantia','Assistência técnica própria','Parcelamento em até 12x','Aceitamos seu aparelho usado na troca'],
    rotuloServicos:'Produtos e serviços', servicosSub:'Consulte disponibilidade e preços pelo WhatsApp',
    servicos:[
      { titulo:'Celulares e tablets', descricao:'Aparelhos novos e seminovos das principais marcas, com garantia.', preco:'A partir de R$ 699' },
      { titulo:'Assistência técnica', descricao:'Troca de tela, bateria e reparo de placa com orçamento prévio.', preco:'A partir de R$ 90' },
      { titulo:'Acessórios', descricao:'Capas, películas, carregadores, fones e caixas de som.', preco:'A partir de R$ 25' },
    ],
    depoimentos:[ d('Trocaram a tela do meu celular em uma hora e ficou perfeita.','Vinícius Lopes'),
                  d('Comprei com nota e garantia. Muito mais seguro que comprar na internet.','Daniela Prado') ],
  },

  hotel: {
    rotulo:'Hotel / Pousada', paleta:'oceano', fonte:'classica',
    slogan:'Seu descanso merece esse cuidado',
    sobreTitulo:'Sobre nós',
    sobreTexto:'Quartos confortáveis, limpeza impecável e um atendimento que faz você se sentir em casa.\nLocalização privilegiada para quem vem a trabalho ou a passeio.',
    diferenciais:['Café da manhã incluso','Wi-fi de alta velocidade','Estacionamento gratuito','Ar-condicionado em todos os quartos'],
    rotuloServicos:'Acomodações', servicosSub:'Consulte disponibilidade pelo WhatsApp',
    servicos:[
      { titulo:'Quarto individual', descricao:'Ideal para quem viaja a trabalho, com escrivaninha e wi-fi rápido.', preco:'A partir de R$ 130/noite' },
      { titulo:'Quarto casal', descricao:'Cama box queen, ar-condicionado, TV e frigobar.', preco:'A partir de R$ 180/noite' },
      { titulo:'Quarto família', descricao:'Espaço amplo, acomoda até 4 pessoas com conforto.', preco:'A partir de R$ 250/noite' },
    ],
    depoimentos:[ d('Quarto limpíssimo e café da manhã muito bom. Voltarei com certeza.','Ricardo Almeida'),
                  d('Atendimento excelente e localização ótima. Recomendo!','Priscila Tavares') ],
  },

  escola: {
    rotulo:'Escola / Curso', paleta:'violeta', fonte:'classica',
    slogan:'Educação que transforma o futuro',
    sobreTitulo:'Sobre a escola',
    sobreTexto:'Ensino de qualidade com acompanhamento próximo de cada aluno e diálogo constante com as famílias.\nUma equipe pedagógica preparada e uma estrutura pensada para o aprendizado.',
    diferenciais:['Turmas reduzidas','Acompanhamento individualizado','Material didático incluso','Professores qualificados'],
    rotuloServicos:'Nossos cursos', servicosSub:'Matrículas abertas — fale conosco',
    servicos:[
      { titulo:'Turmas regulares', descricao:'Aulas em grupos pequenos, com acompanhamento contínuo do progresso.', preco:'A partir de R$ 180/mês' },
      { titulo:'Aulas particulares', descricao:'Atendimento individual focado nas dificuldades específicas do aluno.', preco:'A partir de R$ 60/hora' },
      { titulo:'Cursos intensivos', descricao:'Programas de curta duração para resultados rápidos.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Meu filho melhorou muito as notas depois que entrou aqui.','Elaine Cardoso'),
                  d('Professores atenciosos e método que realmente funciona.','Fábio Duarte') ],
  },

  advocacia: {
    rotulo:'Escritório (Advocacia/Contabilidade)', paleta:'grafite', fonte:'classica',
    slogan:'Assessoria séria para decisões importantes',
    sobreTitulo:'Sobre o escritório',
    sobreTexto:'Atendimento técnico e transparente, com linguagem clara para você entender cada etapa do processo.\nExperiência consolidada e compromisso com o resultado de cada cliente.',
    diferenciais:['Primeira consulta sem compromisso','Atendimento presencial e online','Acompanhamento transparente do caso','Honorários combinados previamente'],
    rotuloServicos:'Áreas de atuação', servicosSub:'Agende uma conversa inicial',
    servicos:[
      { titulo:'Consultoria', descricao:'Orientação preventiva para evitar problemas antes que aconteçam.', preco:'Sob consulta' },
      { titulo:'Acompanhamento de processos', descricao:'Condução completa do seu caso, com atualizações periódicas.', preco:'Sob consulta' },
      { titulo:'Regularização', descricao:'Resolução de pendências e adequação à legislação vigente.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Explicaram tudo com clareza e resolveram meu caso mais rápido do que eu esperava.','Marcelo Vieira'),
                  d('Profissionais competentes e muito éticos. Confio plenamente.','Adriana Bastos') ],
  },

  imobiliaria: {
    rotulo:'Imobiliária', paleta:'oceano', fonte:'moderna',
    slogan:'O imóvel certo para o seu momento',
    sobreTitulo:'Sobre a imobiliária',
    sobreTexto:'Conhecemos cada bairro da cidade e ajudamos você a encontrar o imóvel que faz sentido para a sua vida.\nDocumentação conferida, negociação transparente e acompanhamento até a entrega das chaves.',
    diferenciais:['Documentação verificada','Visitas agendadas com flexibilidade','Assessoria em financiamento','Contratos claros e seguros'],
    rotuloServicos:'Nossos serviços', servicosSub:'Conte o que procura pelo WhatsApp',
    servicos:[
      { titulo:'Venda de imóveis', descricao:'Casas, apartamentos e terrenos com documentação em dia.', preco:'' },
      { titulo:'Locação', descricao:'Imóveis para alugar com contrato seguro e suporte durante toda a locação.', preco:'' },
      { titulo:'Administração de imóveis', descricao:'Cuidamos do seu imóvel alugado: cobrança, vistoria e manutenção.', preco:'Sob consulta' },
    ],
    depoimentos:[ d('Acharam exatamente o que eu procurava e cuidaram de toda a papelada.','Gustavo Siqueira'),
                  d('Processo de aluguel rápido e sem burocracia desnecessária.','Natália Braga') ],
  },

  papelaria: {
    rotulo:'Papelaria / Gráfica', paleta:'coral', fonte:'friendly',
    slogan:'Tudo para escola, escritório e sua impressão',
    sobreTitulo:'Sobre a loja',
    sobreTexto:'Da lista de material escolar ao cartão de visita da sua empresa, resolvemos tudo aqui.\nImpressão rápida, material de qualidade e atendimento que ajuda a economizar.',
    diferenciais:['Impressão na hora','Lista escolar completa','Preço especial no atacado','Orçamento rápido pelo WhatsApp'],
    rotuloServicos:'Produtos e serviços', servicosSub:'Envie seu arquivo pelo WhatsApp',
    servicos:[
      { titulo:'Impressão e cópias', descricao:'Impressão colorida e P&B, cópias, digitalização e encadernação.', preco:'A partir de R$ 0,50' },
      { titulo:'Material escolar e escritório', descricao:'Cadernos, canetas, mochilas e suprimentos em geral.', preco:'' },
      { titulo:'Gráfica rápida', descricao:'Cartões de visita, panfletos, banners e adesivos personalizados.', preco:'Sob orçamento' },
    ],
    depoimentos:[ d('Imprimiram meu TCC na hora e a encadernação ficou linda.','Bianca Ferraz'),
                  d('Fizeram os cartões da minha empresa em dois dias. Ficou ótimo!','Everton Sales') ],
  },

  floricultura: {
    rotulo:'Floricultura', paleta:'floresta', fonte:'classica',
    slogan:'Flores que dizem o que você sente',
    sobreTitulo:'Sobre a floricultura',
    sobreTexto:'Trabalhamos com flores frescas selecionadas e arranjos montados com cuidado artesanal.\nEntregamos em toda a cidade para que sua mensagem chegue no momento certo.',
    diferenciais:['Flores frescas selecionadas','Entrega no mesmo dia','Arranjos personalizados','Cartão com mensagem incluso'],
    rotuloServicos:'Nossos produtos', servicosSub:'Encomende pelo WhatsApp com entrega no mesmo dia',
    servicos:[
      { titulo:'Buquês e arranjos', descricao:'Montados na hora com as flores da sua preferência.', preco:'A partir de R$ 70' },
      { titulo:'Cestas e presentes', descricao:'Cestas de café da manhã, chocolates e presentes combinados com flores.', preco:'A partir de R$ 120' },
      { titulo:'Eventos e cerimônias', descricao:'Decoração floral para casamentos, formaturas e homenagens.', preco:'Sob orçamento' },
    ],
    depoimentos:[ d('Buquê lindíssimo e entregaram no horário combinado. Minha mãe amou.','Rafael Guimarães'),
                  d('As flores duraram mais de duas semanas. Qualidade excelente.','Luciana Peixoto') ],
  },

  lavanderia: {
    rotulo:'Lavanderia', paleta:'oceano', fonte:'moderna',
    slogan:'Sua roupa limpa, cheirosa e no prazo',
    sobreTitulo:'Sobre a lavanderia',
    sobreTexto:'Cuidamos das suas peças com o processo adequado para cada tecido, sem estragar cor ou caimento.\nPrazo cumprido e roupa entregue pronta para usar.',
    diferenciais:['Coleta e entrega em domicílio','Prazo garantido','Produtos que preservam o tecido','Cuidado especial com peças delicadas'],
    rotuloServicos:'Nossos serviços', servicosSub:'Agende a coleta pelo WhatsApp',
    servicos:[
      { titulo:'Lavagem comum', descricao:'Roupas do dia a dia lavadas, secas e dobradas.', preco:'A partir de R$ 15/kg' },
      { titulo:'Lavagem a seco', descricao:'Ternos, vestidos e peças delicadas com tratamento especializado.', preco:'A partir de R$ 35/peça' },
      { titulo:'Edredons e tapetes', descricao:'Peças grandes higienizadas com secagem completa.', preco:'A partir de R$ 60' },
    ],
    depoimentos:[ d('Pegam e entregam em casa. Praticidade que vale cada centavo.','Cristiane Lemos'),
                  d('Salvaram um terno que eu achei que tinha perdido. Profissionais!','Otávio Machado') ],
  },

  otica: {
    rotulo:'Ótica', paleta:'violeta', fonte:'moderna',
    slogan:'Enxergue bem, com o estilo que combina com você',
    sobreTitulo:'Sobre a ótica',
    sobreTexto:'Lentes de qualidade, armações para todos os gostos e um atendimento que ajuda a escolher o modelo certo para o seu rosto.\nExame de vista no local e ajustes gratuitos sempre que precisar.',
    diferenciais:['Exame de vista no local','Ajustes e manutenção gratuitos','Lentes com garantia','Parcelamento em até 10x'],
    rotuloServicos:'Nossos serviços', servicosSub:'Agende seu exame pelo WhatsApp',
    servicos:[
      { titulo:'Óculos de grau', descricao:'Armação + lentes com tratamento antirreflexo e proteção UV.', preco:'A partir de R$ 199' },
      { titulo:'Óculos de sol', descricao:'Modelos das principais marcas, com proteção UV certificada.', preco:'A partir de R$ 149' },
      { titulo:'Exame de vista', descricao:'Avaliação completa da sua visão com equipamento moderno.', preco:'Gratuito na compra' },
    ],
    depoimentos:[ d('Me ajudaram a escolher a armação perfeita e ficou ótimo no meu rosto.','Sônia Aparecida'),
                  d('Exame gratuito e óculos pronto em três dias. Muito bom!','Jaime Correia') ],
  },

  generico: {
    rotulo:'Outro segmento', paleta:'esmeralda', fonte:'moderna',
    slogan:'Qualidade e confiança em cada atendimento',
    sobreTitulo:'Quem somos',
    sobreTexto:'Somos uma empresa local comprometida em oferecer o melhor atendimento e produtos de qualidade.\nTrabalhamos para que cada cliente saia satisfeito e volte sempre.',
    diferenciais:['Anos de experiência no mercado','Atendimento personalizado','Preço justo e transparente','Garantia em todos os serviços'],
    rotuloServicos:'Nossos serviços', servicosSub:'Soluções completas para você',
    servicos:[
      { titulo:'Serviço principal', descricao:'Descreva aqui o principal serviço oferecido pela empresa.', preco:'' },
      { titulo:'Segundo serviço', descricao:'Outro serviço importante que vocês oferecem aos clientes.', preco:'' },
      { titulo:'Terceiro serviço', descricao:'Complete com mais um diferencial do seu negócio.', preco:'' },
    ],
    depoimentos:[ d('Atendimento excelente e profissionais muito atenciosos. Recomendo!','Maria Silva'),
                  d('Melhor da região, sem dúvidas. Já sou cliente há anos.','Carlos Souza') ],
  },
};


/* ─── números e dúvidas frequentes por segmento ─── */
const NUM_PADRAO = [
  { valor:'+10', rotulo:'anos de experiência' },
  { valor:'+500', rotulo:'clientes atendidos' },
  { valor:'100%', rotulo:'satisfação garantida' },
];
const NUMEROS = {
  padaria:[{valor:'+15',rotulo:'variedades de pães'},{valor:'3x',rotulo:'fornadas por dia'},{valor:'+2 mil',rotulo:'clientes por mês'}],
  restaurante:[{valor:'+30',rotulo:'pratos no cardápio'},{valor:'+10',rotulo:'anos servindo bem'},{valor:'+300',rotulo:'refeições por dia'}],
  academia:[{valor:'+50',rotulo:'equipamentos'},{valor:'+20',rotulo:'aulas por semana'},{valor:'+800',rotulo:'alunos ativos'}],
  oficina:[{valor:'+20',rotulo:'anos de oficina'},{valor:'+5 mil',rotulo:'veículos atendidos'},{valor:'90 dias',rotulo:'de garantia'}],
  salao:[{valor:'+10',rotulo:'profissionais'},{valor:'+15',rotulo:'serviços diferentes'},{valor:'+1500',rotulo:'clientes fiéis'}],
  clinica:[{valor:'+10',rotulo:'anos cuidando de você'},{valor:'+5 mil',rotulo:'pacientes atendidos'},{valor:'24h',rotulo:'para agendar online'}],
  construcao:[{valor:'+5 mil',rotulo:'itens em estoque'},{valor:'24h',rotulo:'para entrega na obra'},{valor:'+20',rotulo:'anos no mercado'}],
  veterinaria:[{valor:'+3 mil',rotulo:'pets atendidos'},{valor:'+10',rotulo:'anos de carinho'},{valor:'100%',rotulo:'amor pelos animais'}],
  hotel:[{valor:'+25',rotulo:'acomodações'},{valor:'4.8',rotulo:'nota dos hóspedes'},{valor:'24h',rotulo:'recepção'}],
  escola:[{valor:'+500',rotulo:'alunos formados'},{valor:'+15',rotulo:'professores'},{valor:'+12',rotulo:'anos de ensino'}],
};

const FAQ_EXTRA = {
  padaria:[{p:'Vocês fazem bolos sob encomenda?',r:'Sim! Aceitamos encomendas de bolos e doces para festas. Recomendamos pedir com pelo menos 48 horas de antecedência.'},
           {p:'Qual o horário das fornadas?',r:'Temos pão quentinho saindo do forno várias vezes ao dia, começando bem cedo pela manhã.'}],
  restaurante:[{p:'Vocês têm delivery?',r:'Sim, entregamos na região. É só chamar no WhatsApp e fazer seu pedido.'},
               {p:'Aceitam reserva para grupos?',r:'Sim, aceitamos reservas para grupos e confraternizações. Fale conosco para combinar.'}],
  lanchonete:[{p:'Quanto tempo demora a entrega?',r:'Em média de 30 a 45 minutos, dependendo da região e do movimento.'},
              {p:'Vocês têm opções vegetarianas?',r:'Sim! Consulte nosso cardápio pelo WhatsApp que mostramos as opções disponíveis.'}],
  salao:[{p:'Preciso agendar horário?',r:'Recomendamos sim, para você não precisar esperar. É só chamar no WhatsApp e escolher o melhor horário.'},
         {p:'Quais marcas de produtos vocês usam?',r:'Trabalhamos apenas com produtos profissionais de marcas reconhecidas, que preservam a saúde do fio.'}],
  academia:[{p:'Tem taxa de matrícula?',r:'Não cobramos taxa de matrícula. Você paga apenas a mensalidade do plano escolhido.'},
            {p:'Posso fazer uma aula experimental?',r:'Pode sim! Chame no WhatsApp e agende sua avaliação física gratuita.'}],
  oficina:[{p:'O orçamento é cobrado?',r:'Não. Fazemos o diagnóstico e passamos o orçamento sem compromisso — você só autoriza se concordar.'},
           {p:'Vocês dão garantia?',r:'Sim, damos garantia nas peças e na mão de obra de todos os serviços realizados.'}],
  clinica:[{p:'Vocês atendem convênio?',r:'Atendemos particular e alguns convênios. Consulte pelo WhatsApp qual é o seu caso.'},
           {p:'Como faço para agendar?',r:'É só chamar no WhatsApp que verificamos os horários disponíveis na hora.'}],
  veterinaria:[{p:'Precisa agendar o banho e tosa?',r:'Sim, recomendamos agendar para garantir o horário e o atendimento tranquilo do seu pet.'},
               {p:'Atendem emergências?',r:'Entre em contato pelo WhatsApp para verificarmos a disponibilidade do veterinário.'}],
  construcao:[{p:'Vocês entregam na obra?',r:'Sim, entregamos direto na sua obra. Consulte as condições para a sua região.'},
              {p:'Fazem preço especial para construtores?',r:'Sim, temos condições diferenciadas para profissionais e compras em volume.'}],
  roupas:[{p:'Posso trocar se não servir?',r:'Sim, aceitamos trocas em até 30 dias com a etiqueta e o comprovante.'},
          {p:'Em quantas vezes posso parcelar?',r:'Parcelamos em até 6x sem juros no cartão de crédito.'}],
  eletronicos:[{p:'Os produtos têm garantia?',r:'Sim, todos os produtos são originais, com nota fiscal e garantia.'},
               {p:'Vocês consertam meu aparelho?',r:'Sim, temos assistência técnica própria. Traga o aparelho para avaliação sem compromisso.'}],
  hotel:[{p:'O café da manhã está incluso?',r:'Sim, o café da manhã está incluso em todas as diárias.'},
         {p:'Tem estacionamento?',r:'Sim, oferecemos estacionamento gratuito para os hóspedes.'}],
  imobiliaria:[{p:'Quais documentos preciso para alugar?',r:'Geralmente RG, CPF, comprovante de renda e de residência. Confirmamos os detalhes no atendimento.'},
               {p:'Vocês ajudam com financiamento?',r:'Sim, damos toda a assessoria no processo de financiamento junto aos bancos.'}],
  farmacia:[{p:'Vocês entregam em casa?',r:'Sim! Faça seu pedido pelo WhatsApp que entregamos rapidinho.'},
            {p:'Tem farmacêutico no local?',r:'Sim, contamos com farmacêutico responsável presente para orientar você.'}],
};

function faqPara(chave, p) {
  const rot = (p && p.rotulo ? p.rotulo : 'nosso serviço').toLowerCase();
  const base = [
    { p:'Quais formas de pagamento vocês aceitam?',
      r:'Aceitamos dinheiro, Pix e cartões de débito e crédito. Consulte as condições de parcelamento.' },
    { p:'Como faço para falar com vocês?',
      r:'O jeito mais rápido é pelo WhatsApp — o botão verde no canto da tela. Respondemos no horário de atendimento.' },
  ];
  return [...(FAQ_EXTRA[chave] || []), ...base].slice(0, 4);
}

/* categoria crua do OpenStreetMap -> perfil */
const MAPA = {
  bakery:'padaria', pastry:'padaria', confectionery:'padaria',
  restaurant:'restaurante',
  fast_food:'lanchonete', ice_cream:'lanchonete',
  cafe:'bar_cafe', bar:'bar_cafe', pub:'bar_cafe',
  supermarket:'mercado', convenience:'mercado', greengrocer:'mercado', butcher:'mercado', grocery:'mercado',
  hairdresser:'salao', beauty:'salao', massage:'salao', tattoo:'salao',
  fitness_centre:'academia', sports_centre:'academia', gym:'academia',
  car_repair:'oficina', tyres:'oficina', motorcycle_repair:'oficina',
  car_parts:'autopecas', car:'autopecas', motorcycle:'autopecas',
  clinic:'clinica', doctors:'clinica', dentist:'clinica',
  veterinary:'veterinaria', pet:'veterinaria', pet_grooming:'veterinaria',
  pharmacy:'farmacia', chemist:'farmacia',
  clothes:'roupas', shoes:'roupas', boutique:'roupas', fashion_accessories:'roupas', jewelry:'roupas',
  hardware:'construcao', doityourself:'construcao', paint:'construcao', trade:'construcao',
  building_materials:'construcao', electrical:'construcao',
  furniture:'moveis', interior_decoration:'moveis', houseware:'moveis', bed:'moveis',
  electronics:'eletronicos', computer:'eletronicos', mobile_phone:'eletronicos', hifi:'eletronicos',
  hotel:'hotel', guest_house:'hotel', motel:'hotel', hostel:'hotel', apartment:'hotel',
  school:'escola', language_school:'escola', driving_school:'escola', college:'escola', kindergarten:'escola',
  lawyer:'advocacia', accountant:'advocacia', insurance:'advocacia', financial:'advocacia', company:'advocacia',
  estate_agent:'imobiliaria',
  stationery:'papelaria', copyshop:'papelaria', books:'papelaria', printing:'papelaria',
  florist:'floricultura', garden_centre:'floricultura',
  laundry:'lavanderia', dry_cleaning:'lavanderia',
  optician:'otica', hearing_aids:'otica',
};

const paraCategoria = cat => MAPA[cat] || 'generico';

/* aplica um perfil sobre a config, preservando dados do cliente (nome, contatos) */
function aplicar(cfg, chave) {
  const p = PERFIS[chave] || PERFIS.generico;
  const copia = o => JSON.parse(JSON.stringify(o));
  Object.assign(cfg, {
    slogan: p.slogan, paleta: p.paleta, fonte: p.fonte,
    sobreTitulo: p.sobreTitulo, sobreTexto: p.sobreTexto,
    diferenciais: copia(p.diferenciais),
    rotuloServicos: p.rotuloServicos, servicosSub: p.servicosSub,
    servicos: copia(p.servicos), depoimentos: copia(p.depoimentos),
    numeros: copia(NUMEROS[chave] || NUM_PADRAO),
    faq: faqPara(chave, p),
    perfil: chave,
  });
  return cfg;
}

return { PERFIS, MAPA, NUMEROS, faqPara, paraCategoria, aplicar };
});
