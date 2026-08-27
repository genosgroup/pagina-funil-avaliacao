/**
 * GENOS · Orçamento Parado
 * Recebe os leads do formulário e grava na planilha.
 *
 * COMO INSTALAR
 * 1. Abra a planilha [GENOS] Leads · Orçamento Parado
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
 */

var ABA = 'Leads';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var aba = pegarAba();
    var c = d.calculo || {};
    var r = d.respostas || {};
    var u = d.utm || {};

    aba.appendRow([
      new Date(),                          // Data e hora
      d.nome || '',                        // Nome
      d.whatsapp || '',                    // WhatsApp
      c.parado || 0,                       // Parado agora
      c.perdido_mes || 0,                  // Perdido por mês
      c.dormindo || 0,                     // Dormindo na base
      c.anual || 0,                        // Total anual
      c.indice || '',                      // Índice
      traduzirGargalo(c.gargalo),          // Maior gargalo
      r.avaliacoes || '',                  // Avaliações/mês
      r.ticket || '',                      // Ticket médio
      r.conversao || '',                   // Conversão
      r.noshow || '',                      // No-show
      r.abertos || '',                     // Orçamentos abertos
      r.acompanha || '',                   // Quem acompanha
      r.base || '',                        // Tamanho da base
      r.resposta || '',                    // Tempo de resposta
      c.qualifica_intervencao === undefined
        ? (d.qualifica_intervencao ? 'SIM' : 'NÃO')
        : (c.qualifica_intervencao ? 'SIM' : 'NÃO'),
      c.orcamentos_estimados ? 'SIM' : 'NÃO', // Orçamentos estimados
      d.origem || '',                      // Origem
      u.utm_source || '',                  // UTM Source
      u.utm_medium || '',                  // UTM Medium
      u.utm_campaign || '',                // UTM Campaign
      d.url || ''                          // URL
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
  return responder({ok: true, msg: 'Endpoint do Orçamento Parado no ar.'});
}

function pegarAba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA);
  if (!aba) {
    aba = ss.insertSheet(ABA);
    aba.appendRow([
      'Data e hora','Nome','WhatsApp','Parado agora','Perdido por mês',
      'Dormindo na base','Total anual','Índice','Maior gargalo',
      'Avaliações/mês','Ticket médio','Conversão','No-show',
      'Orçamentos abertos','Quem acompanha','Tamanho da base',
      'Tempo de resposta','Qualifica Intervenção','Orçamentos estimados',
      'Origem','UTM Source','UTM Medium','UTM Campaign','URL'
    ]);
    aba.getRange(1,1,1,24).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function traduzirGargalo(chave) {
  var mapa = {
    orcamento: 'Avaliação que não vira protocolo',
    falta:     'Paciente que não comparece',
    parado:    'Orçamento aprovado parado',
    base:      'Base dormindo'
  };
  return mapa[chave] || chave || '';
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
