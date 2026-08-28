/**
 * GENOS · Orçamento Parado · v2.0
 * Recebe os leads do formulário e grava na planilha.
 *
 * COMO INSTALAR
 * 1. Abra a planilha [Funil AVALIAÇÃO] Leads
 * 2. Menu Extensões > Apps Script
 * 3. Apague o conteúdo do arquivo Code.gs e cole este código inteiro
 * 4. Salve (ícone de disquete)
 * 5. Clique em Implantar > Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL gerada (termina em /exec)
 * 7. Cole essa URL no CONFIG.WEBHOOK do arquivo HTML
 *
 * IMPORTANTE: toda vez que alterar este código, é preciso criar uma NOVA
 * implantação (ou editar a existente e trocar a versão), senão a URL
 * continua servindo o código antigo.
 *
 * ATENÇÃO AO ATUALIZAR DA v1: o cabeçalho mudou. Renomeie a aba antiga
 * para "Leads v1" antes de rodar, senão as colunas novas entram
 * desalinhadas em cima dos dados velhos.
 */

var ABA = 'Leads';

var CABECALHO = [
  'Data e hora','Nome','WhatsApp',
  // classificação
  'SAÍDA','Gargalo','Índice','Leitura','Faixa de demanda',
  // dinheiro
  'Número principal','Estoque total','Orçamento parado','Base dormindo','Escapa por mês','Anual','Potencial/mês',
  // qualidade do dado
  'Não sei (qtd)','Quais não sei','Não se mede','Orçamentos estimados',
  // respostas, na ordem do formulário
  'Percepção','Cadeiras','Ticket','Contatos/mês','Tempo de resposta',
  'Agendamento','Comparecimento','Conversão','Orçamentos abertos',
  'Quem acompanha','Base de contatos','Quem cuida do comercial','Sistema de gestão',
  // contexto
  'Contatos por cadeira','Origem','UTM Source','UTM Medium','UTM Campaign','UTM Content','URL',
  // operação
  'ID Kommo','Status sincronização'
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var c = d.calculo || {};
    var r = d.respostas || {};
    var u = d.utm || {};
    var aba = pegarAba();

    var linha = [
      new Date(),
      d.nome || '',
      d.whatsapp || '',

      traduzirSaida(d.saida),
      traduzirGargalo(c.gargalo),
      c.indice || '',
      traduzirLeitura(c.leitura),
      c.faixa_demanda || '',

      c.numero_principal || 0,
      c.estoque_total || 0,
      c.estoque_orcamento || 0,
      c.estoque_base || 0,
      c.fluxo_mensal || 0,
      c.anual === null || c.anual === undefined ? 'NÃO ESTIMADO' : c.anual,
      c.potencial_mes || 0,

      c.nao_sei === undefined ? '' : c.nao_sei,
      c.campos_nao_sei || '',
      c.nao_mede ? 'SIM' : 'NÃO',
      c.orcamentos_estimados ? 'SIM' : 'NÃO',

      r.percepcao || '',
      r.cadeiras || '',
      r.ticket || '',
      r.contatos || '',
      r.resposta || '',
      r.agendamento || '',
      r.comparecimento || '',
      r.conversao || '',
      r.orcamentos || '',
      r.acompanha || '',
      r.base || '',
      r.estrutura || '',
      d.sistema || '',

      c.por_cadeira === undefined ? '' : c.por_cadeira,
      d.origem || '',
      u.utm_source || '',
      u.utm_medium || '',
      u.utm_campaign || '',
      u.utm_content || '',
      d.url || '',

      '', ''
    ];

    // A segunda chamada só traz o sistema de gestão. Em vez de criar uma
    // linha duplicada, procuramos a linha do mesmo WhatsApp e completamos.
    if (d.atualizacao) {
      if (completarSistema(aba, d.whatsapp, d.sistema)) {
        return responder({ok: true, msg: 'sistema atualizado'});
      }
      // Se não achou a linha (envio anterior falhou), grava a linha inteira.
    }

    aba.appendRow(linha);
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
  return responder({ok: true, msg: 'Endpoint do Orçamento Parado v2.0 no ar.'});
}

function pegarAba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA);
  if (!aba) {
    aba = ss.insertSheet(ABA);
    aba.appendRow(CABECALHO);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
    aba.setFrozenRows(1);
    aba.setFrozenColumns(3);
  }
  return aba;
}

/**
 * Procura de trás para frente a linha mais recente do mesmo WhatsApp e
 * preenche a coluna do sistema de gestão. Devolve true se conseguiu.
 */
function completarSistema(aba, whatsapp, sistema) {
  if (!whatsapp || !sistema) return false;
  var col = CABECALHO.indexOf('Sistema de gestão') + 1;
  var colZap = CABECALHO.indexOf('WhatsApp') + 1;
  var n = aba.getLastRow();
  if (n < 2) return false;

  var limite = Math.max(2, n - 50); // só olha as últimas 50 linhas
  var valores = aba.getRange(limite, colZap, n - limite + 1, 1).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {
    if (String(valores[i][0]) === String(whatsapp)) {
      aba.getRange(limite + i, col).setValue(sistema);
      return true;
    }
  }
  return false;
}

function traduzirSaida(chave) {
  var mapa = {
    tratamento:  'TRATAMENTO · reunião',
    intervencao: 'INTERVENÇÃO · sem reunião'
  };
  return mapa[chave] || chave || '';
}

function traduzirGargalo(chave) {
  var mapa = {
    medicao:     'A clínica não se mede',
    agendamento: 'Fala com a clínica e não marca',
    falta:       'Marca e não comparece',
    parado:      'Orçamento sem resposta final',
    base:        'Base dormindo'
  };
  return mapa[chave] || chave || '';
}

function traduzirLeitura(chave) {
  var mapa = {
    faltaDemanda:  'Falta gente chegando',
    faltaProcesso: 'Chega gente e escapa',
    saudavel:      'Volume e aproveitamento em pé',
    ambos:         'Chega pouco e ainda escapa'
  };
  return mapa[chave] || chave || '';
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
