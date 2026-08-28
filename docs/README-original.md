# Orçamento Parado · Genos · v2.0

Diagnóstico digital de 12 perguntas que faz a clínica descobrir sozinha onde está o dinheiro. É a porta de entrada do funil AVALIAÇÃO e classifica o lead entre as duas saídas: Tratamento e Intervenção.

---

## FAÇA NESTA ORDEM

A ordem importa. Se subir a página antes de ter a URL do Apps Script, ela vai ao ar sem gravar lead nenhum, e você não percebe: a tela funciona normalmente, o número aparece, e o lead evapora.

**1. Prepare a planilha** (5 min)
Renomeie a aba `Leads` para `Leads v1`. Se não fizer isso, as 41 colunas novas entram desalinhadas em cima dos dados antigos.

**2. Publique o Apps Script** (10 min)
Cole o `apps-script-leads.gs`, implante como app da web e **copie a URL que termina em `/exec`**. Passo a passo detalhado na seção "Ligar a planilha de leads".

**3. Teste o endpoint sozinho** (1 min)
Abra a URL do `/exec` no navegador. Tem que responder `{"ok":true,"msg":"Endpoint do Orçamento Parado v2.0 no ar."}`. Se não responder isso, pare aqui: o resto não vai funcionar.

**4. Cole a URL no HTML** (1 min)
No `site/index.html`, procure `WEBHOOK: ''` e cole a URL entre as aspas. É a linha 3 do bloco `CONFIG`, logo no começo do `<script>`.

**5. Só agora suba a página**
Para `clinicas.genosgroup.com.br/orcamento-parado`. Detalhes na seção "Onde subir".

**6. Preencha o formulário inteiro no ar e confira a planilha**
A linha tem que aparecer com as 41 colunas. Se não aparecer, veja a aba `Erros` da planilha: o script grava lá o que deu errado, com o conteúdo do envio, para o lead não sumir em silêncio.

**7. Avise qual ficou sendo a URL final**
Ela vai para bio, anúncio e mensagem de prospecção, e os links rastreados são montados em cima dela.

> **Se precisar mexer no HTML depois de subir:** o `CONFIG.WEBHOOK` mora dentro do arquivo. Toda vez que substituir o arquivo no servidor, confira se a URL continua lá.

> **Se precisar mexer no Apps Script depois de publicar:** salvar não basta. É preciso criar uma **nova implantação**, ou editar a existente e trocar a versão. Senão a URL continua servindo o código antigo, e você vai depurar um problema que já corrigiu.

---

## O que mudou da v1 para a v2

| | v1 | v2 |
| --- | --- | --- |
| Perguntas | 8 | 12, mais 1 depois do gate |
| Topo do funil | começava nas avaliações | começa nos contatos novos |
| Ordem | agrupada por tema | sequência de funil, e ela é o diagnóstico |
| "Não sei dizer" | só em orçamentos | em todas as 4 perguntas do funil |
| Estoque e fluxo | somados no mesmo número | separados |
| Índice | conversão, no-show e processo | 3 etapas do funil mais acompanhamento |
| Segundo eixo | não existia | contatos por cadeira |
| Classificação de saída | tamanho da base | caixa, via ticket e potencial |
| Colunas na planilha | 24 | 41 |

**A ordem das perguntas não é negociável.** Volume, agendamento, comparecimento e conversão estão em sequência de propósito: o dono vê o próprio funil encolher enquanto responde, antes de qualquer número calculado aparecer. Reagrupar por tema transforma o diagnóstico em cadastro.

---

## O que é o arquivo

`orcamento-parado.html` é um **arquivo único e autocontido**. Todo o CSS e o JavaScript estão dentro dele. Não usa CDN, não usa framework, não tem build, não tem dependência. Abre com duplo clique e funciona offline.

---

## Onde subir

A URL de destino é **`clinicas.genosgroup.com.br/orcamento-parado`**.

Se o servidor serve arquivos estáticos por pasta, renomeie o arquivo para `index.html` e coloque dentro da pasta `orcamento-parado`. Assim a URL fica limpa, sem `.html` no fim.

---

## As duas configurações obrigatórias

No topo do `<script>`:

```js
const CONFIG = {
  WEBHOOK: '',
  WHATSAPP: '5521975613690',
  ORIGEM: 'orcamento-parado'
};
```

**`WEBHOOK`** precisa receber a URL do Google Apps Script. Enquanto estiver vazio, o formulário funciona na tela mas **o lead não é gravado em lugar nenhum**.

---

## Ligar a planilha de leads

**[Funil AVALIAÇÃO] Leads**
https://docs.google.com/spreadsheets/d/1THyTEurgi6jYSL110C9FSwK6pse1psTCxnlz_yOyKYQ/edit

> ⚠️ **Atualizando da v1:** o cabeçalho mudou de 24 para 41 colunas. **Renomeie a aba `Leads` para `Leads v1` antes de rodar o script novo**, senão as colunas novas entram desalinhadas em cima dos dados antigos. O script cria a aba nova sozinho.

1. Abra a planilha
2. Menu **Extensões > Apps Script**
3. Apague o conteúdo de `Code.gs` e cole o conteúdo de **`apps-script-leads.gs`**
4. Salve
5. **Implantar > Nova implantação**
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL gerada (termina em `/exec`)
7. Cole essa URL no `CONFIG.WEBHOOK` do HTML

Para testar, abra a URL do `/exec` no navegador. Deve responder:

```json
{"ok":true,"msg":"Endpoint do Orçamento Parado v2.0 no ar."}
```

> **Nota técnica:** o envio usa `Content-Type: text/plain` de propósito. Com `application/json` o navegador dispara um preflight CORS que o Apps Script não responde, e o lead se perde silenciosamente. Não troque.

> **Dois envios por lead.** O primeiro acontece no gate, com tudo. O segundo acontece se o lead responder a pergunta do sistema de gestão na tela de resultado, e vem com `atualizacao: true`. O script procura a linha do mesmo WhatsApp nas últimas 50 e completa a coluna, em vez de duplicar.

---

## As regras que fazem o cálculo funcionar

### 1. Estoque e fluxo nunca se somam no mesmo número

O que está parado agora se recupera **uma vez**. O que se perde todo mês **volta a se perder**. Somar os dois no número em destaque infla a conta, e é o erro mais comum nesse tipo de calculadora.

```js
// ESTOQUE: recuperável uma vez
estoqueOrcamento = orcamentosAbertos × ticket × 0.15 × mult
estoqueBase      = base × 0.03 × ticket × 0.10 × mult

// FLUXO: perde todo mês
perdaAgendamento = contatos × (1 − tAgend) × 0.10 × tComp × tConv × ticket × mult
perdaFalta       = (contatos × tAgend) × (1 − tComp) × tConv × ticket × 0.30 × mult

numeroPrincipal = estoqueOrcamento
anual           = (fluxoMensal × 12) + estoqueOrcamento + estoqueBase

// o que aparece no numerão da tela
destaque = naoMede ? estoqueOrcamento : anual
```

**A taxa da base mudou, e o motivo importa.** O documento fixava 0,2% de reativação com meio ticket. Fomos checar o benchmark: reativação de paciente inativo em odontologia fica entre **10% e 20% ao ano**, e campanhas específicas entre 8% e 15%. Ou seja, 0,2% estava duas ordens de grandeza abaixo do mercado.

Passou para **3% de reativação, com cada pessoa valendo 10% do ticket**. As duas premissas ficam separadas de propósito, porque cada uma responde por uma coisa e cada uma precisa se sustentar sozinha:

- **3%** continua conservador contra o benchmark, e precisa continuar, porque a pergunta 11 mistura paciente antigo com lead que nunca fechou, e o segundo reativa muito abaixo do primeiro.
- **10% do ticket** porque quem volta de base parada marca uma consulta ou uma limpeza. Não fecha o tratamento mais caro da clínica de cara.

Cuidado ao mexer: 3% com meio ticket (as duas premissas generosas multiplicadas) dava **R$4 milhões** no cenário extremo, e acima de dois meses de faturamento parado o dono para de acreditar na página inteira.

### O numerão é o anual

Testamos três candidatos para o número em destaque:

| Candidato | Clínica pequena | Problema |
| --- | --- | --- |
| Estoque somado (orçamento + base) | R$8.972 | Com 3%, a base fica de 2 a 9 vezes maior que o orçamento, e a página chamada Orçamento Parado destacaria a base, que é a parte mais frágil da conta |
| Só o orçamento parado | R$2.991 | Honesto e coerente com o nome, mas fraco demais como abertura |
| **Anual** | **R$41.127** | Nenhum: engloba tudo, e a tela logo abaixo o decompõe em três |

Ficou o anual. Logo abaixo do numerão, três blocos mostram de onde ele vem, separando o que está parado (orçamento e base, que se recuperam uma vez) do que escapa todo mês (que volta a escapar). O bloco do somatório fecha explicando a conta.

**Exceção:** quem cai na regra dos três "não sei" não tem anual confiável, então o destaque cai para o orçamento parado, com um texto diferente explicando por quê. É a única coisa que essa pessoa soube responder.

`mult` é a média das perguntas de tempo de resposta e acompanhamento, com teto de 1,00. **Nunca aumenta a estimativa, só reduz:** processo pior deixa a conta mais conservadora, e não o contrário.

### 2. Três ou mais "não sei" mudam o diagnóstico

O gargalo deixa de ser conversão ou agendamento e passa a ser **a clínica não se mede**. Quando isso acontece:

- aparece o bloco de limite no topo do resultado
- o valor anual **não é exibido**
- o índice de aproveitamento **não é exibido**, porque seria calculado com referência de mercado nos buracos e sairia alto justamente para quem não sabe nada

Admitir o limite do próprio cálculo é o que faz o resto do relatório ser levado a sério.

### 3. O índice normaliza pelo teto da escala, não pela referência de mercado

**Isto é uma decisão de implementação e diverge do documento de perguntas.** O documento fixa referências de 0,60 para agendamento, 0,88 para comparecimento e 0,60 para conversão.

Normalizar por elas satura: com referência 0,60, uma clínica que faz 0,70 já bate 100 na etapa, e quase toda clínica sai com índice acima de 90. Nos testes, o cenário "funil bom sem nenhum follow-up" tirava **89** e o cenário "clínica organizada" tirava **98**. Isso destrói a comparação com a média (52) e o topo (78) que aparecem na mesma tela: a clínica sempre ficaria acima do topo.

A nota passa a ser calculada contra o **teto de cada escala** (0,90 / 0,97 / 0,90). Com isso os mesmos cenários passaram a dar **75** e **98**, e a faixa de resultados foi de 34 a 98 nos oito cenários testados.

Pesos: agendamento 20%, comparecimento 20%, conversão 35%, **acompanhamento 25%**.

O acompanhamento entra no índice de propósito, mesmo já sendo usado no `mult`. Sem ele, uma clínica que converte bem e não tem ninguém indo atrás de quem não fechou recebe nota alta **enquanto a mesma tela mostra o estoque parado dela**. A leitura se contradiria. No teste, duas clínicas com funil idêntico e apenas o follow-up diferente ficaram separadas por 10 pontos.

### 4. O segundo eixo evita o diagnóstico errado

Contatos por cadeira. Abaixo de 12 é volume baixo, de 12 a 25 é adequado, acima de 25 é alto. Cruzado com o índice, produz quatro leituras: falta demanda, chega e escapa, saudável, ou os dois problemas.

Quando a leitura é **falta demanda**, o gargalo vira `demanda`. Sem isso, uma clínica que agenda 9 em 10 e converte 9 em 10 recebia "seu gargalo é agendamento", só porque essa etapa era a maior em reais. Era tecnicamente correto e comercialmente absurdo.

Se o dono não soube dizer o volume de contatos, **o eixo inteiro não aparece** e o campo vai vazio para a planilha, em vez de mostrar um número calculado em cima do fallback.

### 5. Classificação de saída

Critério é caixa, decidido em 26/08 (ver Log de Decisões da Oferta).

```
potencialMes = contatos × tAgend × tComp × tConv × ticket

ticket ≤ 2.000                       → INTERVENÇÃO
ticket ≤ 5.500 e potencial < 40.000  → INTERVENÇÃO
ticket ≤ 5.500 e potencial ≥ 40.000  → TRATAMENTO
ticket > 5.500                       → TRATAMENTO
```

O corte de R$40 mil existe porque o Tratamento custa R$6.900 por mês. Abaixo disso a Genos vira fatia grande demais do faturamento da clínica, que é o perfil Fôlego de Caixa, maior causa isolada de churn.

---

## Checagem antes de publicar

- [ ] `CONFIG.WEBHOOK` preenchido com a URL do `/exec`
- [ ] Aba `Leads` da v1 renomeada antes de rodar o script novo
- [ ] Teste completo preenchido, e a linha apareceu na planilha com as 41 colunas
- [ ] Teste com três "não sei", conferindo que o anual e o índice somem
- [ ] Pergunta do sistema de gestão respondida, conferindo que **completou a linha em vez de criar outra**
- [ ] Botão final abre o WhatsApp com a mensagem já escrita
- [ ] Testado no celular, que é onde o dentista vai responder
- [ ] URL final confirmada e comunicada

---

## Manutenção

**Trocar perguntas ou faixas:** array `PERGUNTAS`. Cada opção tem `t` (o texto que aparece) e `v` (o valor usado na conta).

**Trocar as taxas:** função `calcular()`. Se mudar taxa, **mude também o texto do acordeão "Como essa conta é feita"**, senão a página passa a mentir sobre a própria conta.

**Trocar as referências de mercado:** constante `REF`. **Trocar os tetos do índice:** constante `TETO`, dentro de `calcular()`.

---

## Pendências conhecidas

1. **Os números 52 e 78 do Índice são chute.** Precisam sair da base real de clínicas. É a única parte da tela que não se sustenta em dado próprio. Marcado com comentário no código.
2. **A pergunta 11 mistura dois públicos com comportamento muito diferente.** Ela pede "pacientes antigos e interessados que nunca fecharam, tudo somado", e essas duas coisas reativam em ritmos incomparáveis: paciente que já pagou volta a 10% ou 20% ao ano, e lead frio que nunca fechou volta a uma fração disso. Enquanto estiverem somados, a taxa usada é sempre um meio-termo insatisfatório para os dois. **Separar em duas perguntas é a melhoria mais valiosa para uma v2.1**, e daria dois blocos distintos no relatório em vez de um número morno.
3. **A régua de pós-conversão não existe.** Hoje o lead cai na planilha e depende de alguém olhar. O previsto é mensagem automática em 2 minutos e contato humano em até 1 hora.
4. **A Saída 2 ainda não tem destino próprio.** Por decisão de 26/08, todos vão para o mesmo WhatsApp por enquanto, e a separação vive na coluna `SAÍDA` da planilha. Quando a página da Intervenção existir, trocar o botão.
5. **`ID Kommo` e `Status sincronização`** já existem como colunas vazias, prontas para quando o fluxo para o CRM for montado.
