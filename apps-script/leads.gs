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

var ABA = 'Leads';

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
  'Canal', 'Formato', 'Campanha', 'Variação', 'URL'
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
function prepararPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var antiga = ss.getSheetByName(ABA);
  var msg = [];

  if (antiga) {
    // Compara o cabeçalho INTEIRO, coluna por coluna.
    // Conferir só duas células não basta: já aconteceu de o cabeçalho mudar
    // de 35 para 39 colunas mantendo "Data" e "SAÍDA" no lugar, e a função
    // concluir que estava tudo certo quando não estava.
    var largura = Math.max(antiga.getLastColumn(), CABECALHO.length);
    var cab = antiga.getRange(1, 1, 1, largura).getValues()[0];
    var jaAtual = antiga.getLastColumn() === CABECALHO.length &&
      CABECALHO.every(function (titulo, i) { return String(cab[i]) === titulo; });

    if (jaAtual) {
      Logger.log('A aba "Leads" já está no formato atual. Nada foi alterado.');
      return 'A aba "Leads" já está no formato atual. Nada foi alterado.';
    }

    // Acha um nome livre, para não sobrescrever um arquivamento anterior
    var nome = 'Leads v1', n = 1;
    while (ss.getSheetByName(nome)) { n++; nome = 'Leads v' + n; }
    antiga.setName(nome);
    msg.push('OK: a aba antiga virou "' + nome + '", com os dados preservados.');
  } else {
    msg.push('Não havia aba "Leads" anterior.');
  }

  pegarAba(); // cria a nova, já formatada
  msg.push('OK: a aba "Leads" nova foi criada com ' + CABECALHO.length + ' colunas.');
  msg.push('Pode apagar as abas antigas quando quiser.');

  var texto = msg.join('\n');
  Logger.log(texto);
  return texto;
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
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
    // Registra o erro numa aba separada, para não perder lead em silêncio
    try {
      var log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Erros')
             || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Erros');
      log.appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : '']);
    } catch (e2) {}
    return responder({ok: false, erro: String(err)});
  }
}

function doGet() {
  return responder({ok: true, msg: 'Endpoint do Orçamento Parado v3 no ar.'});
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
    pintar(aba, 1,  5,  '#FDF3EC'); // quem é
    pintar(aba, 6,  2,  '#F5F2ED'); // a leitura
    pintar(aba, 8,  12, '#FFFFFF'); // respostas
    pintar(aba, 20, 5,  '#F5F2ED'); // de onde veio

    aba.getRange(2, 1, 5000, 1).setNumberFormat('dd/mm/yyyy HH:mm');

    // Largura por coluna, senão tudo fica ilegível
    var larguras = [140,170,130,180,150,
                    200,210,
                    220,90,200,130,240,230,180,110,130,110,160,160,
                    110,110,170,130,320];
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
