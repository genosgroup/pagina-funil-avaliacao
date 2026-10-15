/**
 * GENOS · Orçamento Parado · versão 3
 * Recebe os leads do formulário e grava na planilha.
 *
 * =====================================================================
 * JÁ INSTALADO E PUBLICADO. Não precisa implantar de novo.
 * =====================================================================
 *
 * Este script já está no ar na planilha [Funil AVALIAÇÃO] Leads, e a
 * URL do app da web já está funcionando. Se você só colou uma versão
 * nova deste arquivo: salve e rode prepararPlanilha. Só isso.
 *
 * NÃO clique em Implantar sem necessidade. Criar uma implantação nova
 * gera uma URL diferente, e a URL antiga continua sendo a que está
 * dentro do HTML. Isso quebra a gravação de leads sem dar nenhum aviso.
 *
 * ---------------------------------------------------------------------
 * SE UM DIA PRECISAR INSTALAR DO ZERO, em outra planilha:
 *   1. Abra a planilha
 *   2. Menu Extensões > Apps Script
 *   3. Apague o Code.gs e cole este código inteiro
 *   4. Salve
 *   5. Selecione prepararPlanilha no seletor de função e clique Executar
 *   6. Implantar > Nova implantação
 *        Tipo: App da Web · Executar como: Eu · Acesso: Qualquer pessoa
 *   7. Copie a URL (termina em /exec) e cole no CONFIG.WEBHOOK do HTML
 *
 * SE ALTERAR ESTE CÓDIGO no futuro: salvar não basta para o endpoint.
 * Vá em Implantar > Gerenciar implantações, edite a existente e troque
 * a Versão para "Nova versão". Assim a URL continua a mesma.
 */

/* Tem que bater EXATAMENTE com o nome da aba na planilha. Se alguém renomear
   a aba e não mexer aqui, o script não dá erro: ele cria uma aba nova com este
   nome e passa a escrever nela, deixando a antiga órfã. Aconteceu quando a aba
   'Leads' virou 'Clínicas' para ficar simétrica com 'Outros negócios'. */
var ABA = 'Clínicas';

/**
 * Quem chegou pelo link da bio e NÃO é clínica. Vive numa aba própria de
 * propósito: não é lead comercial, não entra no funil, e misturar na aba Leads
 * sujaria a taxa de conversão e faria a campanha otimizar por quem não queremos.
 * Serve para uma coisa só: saber quanto do orgânico chega fora do perfil.
 */
var ABA_OUTROS = 'Outros negócios';
var CABECALHO_OUTROS = [
  'Data', 'Instagram', 'WhatsApp',
  'Parado/mês', 'Parado na base', 'Faixa',
  'Contatos/mês', 'Fecham', 'Somem sem retomar', 'Ticket', 'Base de contatos',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'URL',

  /* Mesma coluna do n8n da aba de clínica. O script não escreve nela: a célula
     vazia é o estado "ainda não avisado". Está no array para a contagem bater
     e a aba nunca ser arquivada por causa dela. */
  'Avisado?'
];

/**
 * A coluna "Data" é gravada no fuso da PLANILHA, não no do script. Planilha
 * nova do Google nasce em horário do Pacífico e o lead chega 4 horas atrasado
 * sem ninguém perceber, porque a hora existe, só está errada.
 */
var FUSO = 'America/Sao_Paulo';

/**
 * A planilha guarda O QUE O LEAD RESPONDEU, mais a leitura que sai dessas
 * respostas. Os valores em reais ficam só na tela do lead: eles servem para
 * ele se convencer, não para o comercial filtrar.
 *
 * BLOCO 1 · QUEM É       → para quem ligar, e por qual porta
 * BLOCO 2 · A LEITURA    → como abrir a conversa
 * BLOCO 3 · AS RESPOSTAS → o que ele disse, palavra por palavra
 * BLOCO 4 · DE ONDE VEIO → para o relatório de canal
 *
 * Não existem colunas de ID de CRM aqui. Quando o fluxo para o Kommo for
 * montado, acrescente as que ele precisar no fim desta lista E na mesma
 * posição dentro do appendRow, porque a gravação é por posição.
 */
/* As quatro colunas de origem usam o nome do parâmetro, não um nome traduzido.
   Com "Formato" no lugar de utm_medium, chegou um lead com utm_medium=set.26:
   um mês no campo que define o tipo de canal, que o GA4 joga em Não atribuído.
   O nome da coluna convidou ao erro. Com o nome do parâmetro, quem monta o
   anúncio vê a mesma palavra no Gerenciador, na planilha de UTMs e aqui. */
var CABECALHO = [
  // BLOCO 1 · quem é
  'Data', 'Nome', 'WhatsApp', 'Instagram', 'SAÍDA',

  // BLOCO 2 · a leitura
  'Maior gargalo', 'Diagnóstico',

  // BLOCO 3 · as respostas, na ordem do formulário
  'Acha que o problema é', 'Cadeiras', 'Ticket', 'Contatos/mês',
  'Quem cuida do comercial', 'Quem faz follow-up', 'Tempo de resposta',
  'Agendam', 'Comparecem', 'Fecham', 'Base de contatos', 'Sistema',

  // BLOCO 4 · de onde veio
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'URL',

  /* Coluna do n8n, não desta página: a automação marca aqui quem já foi
     avisado. O script nunca escreve nela — appendRow manda 25 valores e a 26ª
     fica vazia, que é o estado "ainda não avisado".

     Ela PRECISA estar neste array mesmo sem ser preenchida aqui. prepararPlanilha
     compara getLastColumn() com CABECALHO.length: faltando aqui, a aba tem uma
     coluna a mais que o esperado, a função conclui que o formato está errado,
     arquiva a aba como "Leads v1" e cria uma nova sem esta coluna. Foi o que
     aconteceu em 15/10/2026, e derrubou a automação em silêncio. */
  'Avisado?'
];

/**
 * ============================================================
 * RODE ESTA FUNÇÃO UMA VEZ, ANTES DE QUALQUER COISA.
 * ============================================================
 *
 * No editor do Apps Script: escolha "prepararPlanilha" na lista de
 * funções, no topo, e clique em Executar. Na primeira vez o Google
 * pede autorização, é normal, é a sua própria conta acessando a sua
 * própria planilha.
 *
 * O que ela faz:
 *   1. Arquiva a aba "Leads" antiga com um nome livre ("Leads v2",
 *      "Leads v3"...), preservando tudo que já estava lá
 *   2. Cria a aba "Leads" nova com as 24 colunas, blocos coloridos,
 *      cabeçalho congelado, larguras, filtro e formato de moeda
 *   3. Escreve o resultado no Registro de execução, que aparece
 *      logo abaixo do editor quando a função termina
 *
 * Rodar de novo não estraga nada: se a aba já estiver no formato novo,
 * a função avisa e não mexe.
 *
 * NÃO use SpreadsheetApp.getUi() aqui. Ele só funciona quando o script
 * é chamado a partir da planilha, e lança erro quando a função é
 * executada pelo botão do editor, que é justamente como ela é usada.
 */
/* Confere se a aba bate com o CABECALHO. SÓ CONFERE: não renomeia, não cria,
   não apaga nada.

   Ela arquivava a aba e criava outra quando achava diferença. A intenção era
   boa — gravar numa aba de largura errada desalinha tudo em silêncio — mas o
   remédio era pior que a doença: em 15/10/2026 ela arquivou a aba de leads
   duas vezes, levando junto o lead, a formatação da casa e a coluna que o n8n
   lê. Nas duas as abas só estavam fora de sincronia por alguns minutos,
   enquanto o script novo ainda não tinha sido colado.

   Arquivar automaticamente uma aba que tem lead dentro nunca é a decisão
   certa: quem está olhando sabe o que fazer, a função não. Então ela agora
   relata e para. A correção é manual e leva um minuto.

   A proteção real contra desalinhamento continua existindo, e é outra: o
   doPost grava por appendRow com a quantidade de valores do CABECALHO. */
function prepararPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA);

  if (!aba) {
    return 'Não existe aba "' + ABA + '". Ela será criada sozinha no primeiro lead.';
  }

  var largura = Math.max(aba.getLastColumn(), CABECALHO.length);
  var cab = aba.getRange(1, 1, 1, largura).getValues()[0];
  var difs = [];

  if (aba.getLastColumn() !== CABECALHO.length) {
    difs.push('A aba tem ' + aba.getLastColumn() + ' colunas e o script espera ' +
              CABECALHO.length + '.');
  }
  for (var i = 0; i < largura; i++) {
    var naAba = String(cab[i] || ''), noScript = CABECALHO[i] || '';
    if (naAba !== noScript) {
      difs.push('Coluna ' + (i + 1) + ': a aba diz "' + naAba +
                '" e o script espera "' + noScript + '".');
    }
  }

  if (!difs.length) {
    var ok = 'OK: a aba "' + ABA + '" bate com o script. ' + CABECALHO.length + ' colunas.';
    Logger.log(ok);
    return ok;
  }

  var texto = 'ATENÇÃO: a aba "' + ABA + '" NÃO bate com o script.\n\n' +
    difs.join('\n') +
    '\n\nNada foi alterado. Acerte o cabeçalho na planilha OU cole a versão ' +
    'certa do script, até esta função dizer OK. Não grave lead antes disso: ' +
    'a gravação é posicional e entraria desalinhada.';
  Logger.log(texto);
  return texto;
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    // Desvio do braço "outro tipo de negócio". Sai daqui antes de tocar em
    // qualquer coisa do fluxo de clínica, que segue exatamente como estava.
    if (d.tipo === 'outro') { return gravarOutro(d); }

    var c = d.calculo || {};
    var r = d.respostas || {};
    var u = d.utm || {};
    var aba = pegarAba();

    // A segunda chamada só traz Instagram e sistema. Completa a linha
    // existente em vez de duplicar o lead.
    if (d.atualizacao) {
      if (completarLinha(aba, d.whatsapp, d.instagram, d.sistema)) {
        return responder({ok: true, msg: 'linha completada'});
      }
      // Se não achou (o primeiro envio falhou), grava a linha inteira.
    }

    aba.appendRow([
      new Date(),
      d.nome || '',
      d.whatsapp || '',
      d.instagram || '',
      d.saida === 'tratamento' ? 'TRATAMENTO' : 'INTERVENÇÃO',

      traduzirGargalo(c.gargalo),
      traduzirDiagnostico(c.diagnostico),

      r.percepcao || '',
      r.cadeiras || '',
      r.ticket || '',
      r.contatos || '',
      r.estrutura || '',
      r.acompanha || '',
      r.resposta || '',
      r.agendamento || '',
      r.comparecimento || '',
      r.conversao || '',
      r.base || '',
      d.sistema || '',

      u.utm_source || '',
      u.utm_medium || '',
      u.utm_campaign || '',
      u.utm_content || '',
      d.url || ''
    ]);

    return responder({ok: true});

  } catch (err) {
    anotarErro(String(err), e && e.postData ? e.postData.contents : '');
    return responder({ok: false, erro: String(err)});
  }
}

/* Registra numa aba separada o que deu errado, para nada falhar em silêncio.
   Envolvida em try porque o registro do erro nunca pode derrubar a gravação do
   lead: se nem isto funcionar, perder o aviso é melhor que perder o lead. */
function anotarErro(texto, contexto) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = ss.getSheetByName('Erros') || ss.insertSheet('Erros');
    log.appendRow([new Date(), texto, contexto || '']);
  } catch (e2) {}
}

function doGet() {
  return responder({ok: true, msg: 'Endpoint do Orçamento Parado v3.2 no ar.'});
}

/**
 * Deixa a planilha em horário de Brasília. Se a conta não tiver permissão para
 * mudar o fuso pelo código, apenas avisa no log: perder o lead por causa do
 * relógio seria pior do que gravá-lo com a hora torta.
 */
function garantirFuso(ss) {
  try {
    if (ss.getSpreadsheetTimeZone() !== FUSO) { ss.setSpreadsheetTimeZone(FUSO); }
  } catch (err) {
    console.warn('Não foi possível ajustar o fuso da planilha: ' + err);
  }
}

/**
 * Grava na aba de outros negócios, criando-a na primeira vez. Independente do
 * pegarAba(): se um dia a aba Leads mudar de formato, esta não é afetada.
 */
function gravarOutro(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  garantirFuso(ss);
  var aba = ss.getSheetByName(ABA_OUTROS);

  /* Antes, largura diferente da esperada fazia a função arquivar a aba e criar
     outra. Isso saiu: arquivar sozinha uma aba com lead dentro causou estrago
     real duas vezes em 15/10/2026, e no caminho da gravação é pior ainda,
     porque dispara a cada lead que chega.

     Agora ela só registra o desencontro em "Erros" e grava assim mesmo. Linha
     com rótulo errado é visível e se conserta; lead perdido ou aba arquivada
     no meio de uma campanha, não. */
  if (aba && aba.getLastColumn() !== CABECALHO_OUTROS.length) {
    anotarErro('Aba "' + ABA_OUTROS + '" com ' + aba.getLastColumn() +
               ' colunas e o script espera ' + CABECALHO_OUTROS.length +
               '. O lead foi gravado assim mesmo. Acerte o cabeçalho.');
  }

  if (!aba) {
    aba = ss.insertSheet(ABA_OUTROS);
    aba.appendRow(CABECALHO_OUTROS);
    aba.getRange(1, 1, 1, CABECALHO_OUTROS.length)
       .setFontWeight('bold').setVerticalAlignment('middle');
    aba.setFrozenRows(1);
    // Mesmas três primeiras colunas congeladas da aba de clínica: quem é o lead
    // acompanha a rolagem horizontal, senão as colunas de origem ficam soltas.
    aba.setFrozenColumns(3);
    aba.setRowHeight(1, 38);

    // Mesmos blocos de cor da aba de clínica, para as duas se lerem igual
    pintar(aba, 1,  6, LARANJA);   // quem é + a leitura
    pintar(aba, 7,  5, '#FFFFFF'); // respostas
    pintar(aba, 12, 6, '#F5F2ED'); // de onde veio, e o Avisado? do n8n

    aba.getRange(2, 1, 5000, 1).setNumberFormat('dd/mm/yyyy HH:mm');
    var larg = [140, 190, 140,
                130, 140, 100,
                120, 150, 170, 120, 150,
                110, 110, 170, 130, 320, 130];
    for (var i = 0; i < larg.length; i++) aba.setColumnWidth(i + 1, larg[i]);
    aba.getRange(2, 4, 5000, 2).setNumberFormat('R$ #,##0');

    // Filtro no cabeçalho, como na aba de clínica. Sem ele o comercial não
    // consegue separar por origem nem por faixa, e tem que ler tudo na mão.
    aba.getRange(1, 1, aba.getMaxRows(), CABECALHO_OUTROS.length).createFilter();
  }

  var u = d.utm || {};
  var c = d.calculo || {};
  var r = d.respostas || {};
  aba.appendRow([
    new Date(),
    d.instagram || '',
    d.whatsapp || '',

    c.parado_mes || 0,
    c.parado_base || 0,
    c.faixa || '',

    r.g_contatos || '',
    r.g_fecho || '',
    r.g_vazamento || '',
    r.g_ticket || '',
    r.g_base || '',

    u.utm_source || '',
    u.utm_medium || '',
    u.utm_campaign || '',
    u.utm_content || '',
    d.url || ''
  ]);
  return responder({ok: true, msg: 'outro negócio registrado'});
}

function pegarAba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  garantirFuso(ss);
  var aba = ss.getSheetByName(ABA);
  if (!aba) {
    aba = ss.insertSheet(ABA);
    aba.appendRow(CABECALHO);
    var h = aba.getRange(1, 1, 1, CABECALHO.length);
    h.setFontWeight('bold').setVerticalAlignment('middle');
    aba.setFrozenRows(1);
    aba.setFrozenColumns(3);
    aba.setRowHeight(1, 38);

    // Cor por bloco, para bater o olho e saber onde está
    pintar(aba, 1,  7,  LARANJA);   // quem é + a leitura
    pintar(aba, 8,  12, '#FFFFFF'); // respostas
    pintar(aba, 20, 6,  '#F5F2ED'); // de onde veio, e o Avisado? do n8n

    aba.getRange(2, 1, 5000, 1).setNumberFormat('dd/mm/yyyy HH:mm');

    // Largura por coluna, senão tudo fica ilegível
    var larguras = [140,170,130,180,150,
                    200,210,
                    220,90,200,130,240,230,180,110,130,110,160,160,
                    110,110,170,130,320,130];
    for (var i = 0; i < larguras.length; i++) aba.setColumnWidth(i + 1, larguras[i]);

    // Filtro no cabeçalho, para o comercial filtrar por SAÍDA
    aba.getRange(1, 1, aba.getMaxRows(), CABECALHO.length).createFilter();

    // TRATAMENTO em laranja, para saltar aos olhos na coluna E
    var regra = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('TRATAMENTO')
      .setBold(true).setFontColor('#C4501B')
      .setRanges([aba.getRange(2, 5, 5000, 1)])  // coluna SAÍDA
      .build();
    aba.setConditionalFormatRules([regra]);
  }
  return aba;
}

/* O laranja do cabeçalho é #FF6D01, o ACCENT5 do tema desta planilha — a cor
   da marca. Já veio pintado assim à mão; o script precisa repetir ao recriar
   uma aba, senão a recriação devolve um bege que ninguém escolheu. */
var LARANJA = '#FF6D01';

function pintar(aba, col, qtd, cor) {
  aba.getRange(1, col, 1, qtd)
     .setBackground(cor)
     .setWrap(true)
     .setVerticalAlignment('middle');
}

/**
 * Procura de trás para frente a linha mais recente do mesmo WhatsApp e
 * preenche Instagram e sistema. Devolve true se conseguiu.
 */
function completarLinha(aba, whatsapp, instagram, sistema) {
  if (!whatsapp) return false;
  var colZap   = CABECALHO.indexOf('WhatsApp') + 1;
  var colInsta = CABECALHO.indexOf('Instagram') + 1;
  var colSist  = CABECALHO.indexOf('Sistema') + 1;
  var n = aba.getLastRow();
  if (n < 2) return false;

  var limite = Math.max(2, n - 50); // só olha as últimas 50 linhas
  var valores = aba.getRange(limite, colZap, n - limite + 1, 1).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {
    if (String(valores[i][0]) === String(whatsapp)) {
      var linha = limite + i;
      if (instagram) aba.getRange(linha, colInsta).setValue(instagram);
      if (sistema)   aba.getRange(linha, colSist).setValue(sistema);
      return true;
    }
  }
  return false;
}

function traduzirGargalo(chave) {
  var mapa = {
    medicao:     'Não se mede',
    demanda:     'Chega pouca gente',
    agendamento: 'Fala e não marca',
    falta:       'Marca e não vem',
    parado:      'Orçamento sem resposta',
    base:        'Base dormindo'
  };
  return mapa[chave] || chave || '';
}

function traduzirDiagnostico(chave) {
  var mapa = {
    faltaDemanda:  'Falta gente chegando',
    faltaProcesso: 'Chega gente e escapa',
    saudavel:      'Volume e processo em pé',
    ambos:         'Chega pouco e ainda escapa',
    semVolume:     'Não soube o volume'
  };
  return mapa[chave] || chave || '';
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
