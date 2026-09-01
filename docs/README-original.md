# Orçamento Parado · Genos

**Versão 3** · agosto de 2026

Diagnóstico digital de 11 perguntas que faz a clínica descobrir sozinha onde está o dinheiro. É a porta de entrada do funil AVALIAÇÃO e classifica o lead entre as duas saídas: Tratamento e Intervenção.

---

## O QUE JÁ ESTÁ PRONTO

Nada disso precisa ser refeito. Está tudo testado e no ar.

- ✅ **Planilha** com as 24 colunas, blocos coloridos, filtros e formato de moeda
- ✅ **Apps Script publicado** como app da web, com a URL do `/exec` funcionando
- ✅ **Gravação testada de ponta a ponta**, com um lead real caindo na linha certa

---

## O QUE FALTA · publicar a página

**1. Cole a URL do webhook no HTML**
No `site/index.html`, procure `WEBHOOK: ''` e cole a URL do `/exec` entre as aspas. É a linha 3 do bloco `CONFIG`, logo no começo do `<script>`. **A Thalita passa essa URL.**

Sem ela a página funciona na tela, o número aparece, e o lead evapora sem nenhum aviso.

**2. Publique em `clinicas.genosgroup.com.br/orcamento-parado`**
Se for servir por pasta, o caminho é `/orcamento-parado/index.html`, para a URL ficar limpa sem `.html` no fim.

**3. Preencha o formulário inteiro no ar e confira a planilha**
A linha tem que aparecer na aba `Leads`. Se não aparecer, veja a aba `Erros`: o script grava lá o que deu errado, com o conteúdo do envio, para o lead não sumir em silêncio.

**4. Confirme qual ficou sendo a URL final**
Ela vai para bio, anúncio e mensagem de prospecção, e os links rastreados são montados em cima dela.

> **Ao substituir o arquivo no servidor:** o `CONFIG.WEBHOOK` mora dentro do HTML. Toda vez que trocar o arquivo, confira se a URL continua lá.

> **Não mexa no Apps Script sem necessidade.** Ele já está publicado. Se um dia precisar alterar o código, vá em **Implantar > Gerenciar implantações**, edite a existente e troque a Versão para "Nova versão". Criar uma implantação nova gera uma URL diferente, e a que está dentro do HTML continua sendo a antiga.

---

## O que mudou

| | Versão 1 | Versão 3 |
| --- | --- | --- |
| Perguntas | 8 | 11, mais 2 depois do gate |
| Topo do funil | começava nas avaliações | começa nos contatos novos |
| Ordem | agrupada por tema | porte, depois quem atende, depois o funil |
| "Não sei dizer" | só em orçamentos | nas 4 perguntas do funil |
| O número em destaque | anual, com taxas embutidas | mensal, sem taxa nenhuma |
| Aproveitamento | índice 0 a 100 com pesos inventados | quantos de cada 100 viram paciente |
| Blocos de apoio | tudo em reais | os frágeis só em pessoas |
| Segundo eixo | não existia | contatos por cadeira |
| Classificação de saída | tamanho da base | 3 critérios: cadeiras, ticket e volume |
| Colunas na planilha | 24 | 24, só respostas e leitura |

**A ordem das perguntas.** O funil (agendamento, comparecimento, conversão) segue em sequência, mas agora vem depois de três perguntas sobre quem atende: quem cuida do comercial, quem faz follow-up e em quanto tempo responde.

O efeito muda, e para melhor. O dono primeiro conta que o processo é frágil, e só então responde as taxas. O resultado ruim deixa de ser surpresa e vira consequência do que ele mesmo acabou de descrever.

**A pergunta de orçamentos parados saiu, e não voltou.** Era a que mais exigia consultar o sistema, e mesmo reformulada ela convidaria o dono a se defender: ele acha que faz follow-up, então responderia "limpamos sempre" mesmo tendo pilha parada. É o mesmo vício que fez a pergunta de comparecimento ser invertida.

**O número principal virou mensal.** Era o valor anual, que multiplicava tudo por doze e transformava qualquer conta em número que ninguém acredita.

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
  WHATSAPP: '5521985237650',
  ORIGEM: 'orcamento-parado'
};
```

**`WEBHOOK`** precisa receber a URL do Google Apps Script. Enquanto estiver vazio, o formulário funciona na tela mas **o lead não é gravado em lugar nenhum**.

---

## A planilha de leads

**[Funil AVALIAÇÃO] Leads** · já configurada, referência abaixo
https://docs.google.com/spreadsheets/d/1THyTEurgi6jYSL110C9FSwK6pse1psTCxnlz_yOyKYQ/edit

**Se um dia precisar recriar a aba do zero** (outra planilha, ou se a estrutura for corrompida): abra **Extensões > Apps Script**, selecione **`prepararPlanilha`** no seletor de função ao lado do botão Executar, e execute.

Ela arquiva a aba `Leads` existente com um nome livre (`Leads v3`, `Leads v4`...) preservando os dados, e monta a aba nova formatada. O resultado aparece no **Registro de execução**, abaixo do editor. Rodar duas vezes não estraga: se a aba já estiver no formato certo, ela avisa e não mexe.

Para conferir se o endpoint está de pé, abra a URL do `/exec` no navegador. Deve responder:

```json
{"ok":true,"msg":"Endpoint do Orçamento Parado v3 no ar."}
```

> **Nota técnica:** o envio usa `Content-Type: text/plain` de propósito. Com `application/json` o navegador dispara um preflight CORS que o Apps Script não responde, e o lead se perde silenciosamente. Não troque.

> **Dois envios por lead.** O primeiro acontece no gate, com tudo. O segundo acontece se o lead responder o sistema de gestão ou o Instagram na tela de resultado, e vem com `atualizacao: true`. O script procura a linha do mesmo WhatsApp nas últimas 50 e completa as colunas, em vez de duplicar.

---

## As regras que fazem o cálculo funcionar

### 1. A mesma régua nas três etapas

Cada pessoa que se perde vale o que valeria **se tivesse seguido o funil na taxa que a clínica pratica hoje**. Não numa taxa ideal, não em 100%.

```js
marcam     = contatos   × taxa de agendamento
avaliacoes = marcam     × taxa de comparecimento
fecham     = avaliacoes × taxa de conversão

// quem se perde em cada etapa
perdeuNoContato = contatos   − marcam        // falou e não marcou
perdeuNaFalta   = marcam     − avaliacoes    // marcou e não apareceu
naoFecharam     = avaliacoes × (1 − tConv)   // sentou e não fechou

// o que cada um valeria seguindo o funil NA TAXA DELE
vContato = perdeuNoContato × tComp × tConv × ticket
vFalta   = perdeuNaFalta   × tConv × ticket
vFechou  = naoFecharam     × ticket

numeroPrincipal = vContato + vFalta + vFechou    ← o numerão, mensal
```

**A versão anterior era inconsistente e foi corrigida.** Ela contava 100% de quem não fechou e **zero** de quem não agendou, como se sentar na cadeira fosse a única chance que existe. Resultado: o topo do funil, onde a clínica perde 4x mais gente, sumia da tela. E o topo é justamente onde a Genos mais atua.

Com a régua igual, o topo volta e a distribuição fica coerente. No perfil médio: 69 pessoas não marcam (41% do valor), 18 faltam (18%), 17 não fecham (41%). Perde-se 4x mais gente no começo, mas cada uma vale menos porque ainda tinha caminho pela frente.

**Testado forçando cada etapa ruim isoladamente:** agendamento a 0,20 concentra 87% da perda no topo. No-show a 0,35 concentra 68% no meio. Conversão a 0,20 concentra 87% no fim. O gargalo apontado acompanha.

### 2. Nada é projetado, nada é multiplicado por doze

Antes disso testamos três versões que estouravam, sempre pelo mesmo motivo: as três etapas se multiplicam, então qualquer conta do tipo "quanto você ganharia melhorando" triplica o faturamento da clínica. O cenário médio dava R$3,5 milhões por ano, e uma clínica de duas ou três cadeiras não fatura isso nem caberia nas cadeiras.

Uma delas também acumulava dois meses de orçamento e aplicava 15% de recuperação, dois parâmetros inventados que ninguém via.

Agora não existe premissa escondida, e a tela mostra a conta em pessoas antes de mostrar o valor. **A base parada é a única linha sem valor em reais**, porque não passou pelo funil daquele mês.

### 3. Três ou mais "não sei" mudam o diagnóstico

O gargalo deixa de ser conversão ou agendamento e passa a ser **a clínica não se mede**. Quando isso acontece, aparece o bloco de limite no topo e o índice de aproveitamento **não é exibido**, porque seria calculado com referência de mercado nos buracos e sairia alto justamente para quem não sabe nada.

Admitir o limite do próprio cálculo é o que faz o resto do relatório ser levado a sério.

### 4. Aproveitamento é só a multiplicação das três taxas

De cada 100 pessoas que procuram a clínica, quantas viram paciente:

```js
taxaTotal = tAgend × tComp × tConv      // 0,40 × 0,60 × 0,40 = 10 em 100
refTotal  = 0,60  × 0,88  × 0,60        // 32 em 100
```

**A versão anterior era um índice de 0 a 100** com pesos de 20/20/35/25 escolhidos por mim, normalizado por "tetos" que eram só a maior opção do quiz, e ainda misturava a pergunta de follow-up, que não é taxa. Ela produzia os números **52 e 78** na tela, que não vinham de dado nenhum: eram invenção.

Pior, uma clínica exatamente na média de mercado tirava 77 nesse índice, praticamente o mesmo 78 que estava rotulado como "as que organizaram o comercial". A escala vendia a média como excelência.

Agora a comparação na tela é entre dois números calculados: o dele e a referência de mercado que já está documentada em `REF`. **Nenhum número inventado sobrou na página.**

Uma clínica "boa" (7 em 10 marcam, 8,5 comparecem, 7 fecham) aproveita 42 em 100. A média do mercado é 32. O perfil típico que nos procura fica em 10.

### 5. O gargalo compara só as três etapas do funil

Em pessoas por mês, não em reais: em reais o ticket domina tudo e o gargalo sai sempre igual.

**A base não entra nessa disputa.** Ela é estoque acumulado de anos e sempre ganharia de qualquer etapa mensal. Nos testes era o gargalo em 5 de 5 cenários, o que não diz nada. Ela só é apontada quando as três etapas já estão acima da referência, ou seja, quando não sobrou nada melhor para consertar.

### 6. O segundo eixo evita o diagnóstico errado

Contatos por cadeira. Abaixo de 12 é volume baixo, de 12 a 25 é adequado, acima de 25 é alto. Cruzado com o índice, produz quatro leituras: falta demanda, chega e escapa, saudável, ou os dois problemas.

Quando a leitura é **falta demanda**, o gargalo vira `demanda`. Sem isso, uma clínica que agenda 9 em 10 e converte 9 em 10 recebia "seu gargalo é agendamento" só porque essa etapa era a maior em números absolutos.

Se o dono não soube dizer o volume de contatos, **o eixo inteiro não aparece**.

### 7. Classificação de saída

**Perfil de TRATAMENTO, definido em 27/08. Os três critérios precisam bater:**

| Critério | Mínimo |
| --- | --- |
| Cadeiras em funcionamento | 2 ou mais |
| Ticket médio | R$3 mil ou mais |
| Contatos novos por mês | 81 ou mais |

Faltando qualquer um, o lead vai para **INTERVENÇÃO**. A coluna `Falta para Tratamento` na planilha diz qual critério faltou, para o comercial entender a classificação sem reler as respostas.

**Quem não soube dizer o volume cai em Intervenção**, porque o critério não pode ser verificado. É proposital: quem não sabe quantas pessoas procuram a clínica dificilmente tem a estrutura que o Tratamento pressupõe. Mas a coluna mostra `volume` como o que faltou, então dá para revisar caso a caso.

---

## A planilha

**Ela guarda o que o lead respondeu, mais a leitura que sai dessas respostas.** Os valores em reais ficam só na tela do lead: eles existem para convencer quem preencheu, não para o comercial filtrar.

**BLOCO 1 · Quem é** (para quem ligar, e por qual porta)
Data · Nome · WhatsApp · Instagram · **SAÍDA**

**BLOCO 2 · A leitura** (como abrir a conversa)
Maior gargalo · Diagnóstico

**BLOCO 3 · As respostas** (o que ele disse, palavra por palavra)
Uma coluna por pergunta, na ordem do formulário, mais o sistema de gestão.

**BLOCO 4 · De onde veio** (para o relatório de canal)
Canal · Formato · Campanha · Variação · URL

As quatro primeiras vêm direto do link: `utm_source`, `utm_medium`, `utm_campaign` e `utm_content`, nessa ordem. São exatamente as que o `gerador-de-links.html` monta, então o que você define lá é o que chega aqui.

> **A UTM se perde se o lead voltar depois.** Se ele clica no link com parâmetros, sai, e volta digitando o endereço direto, chega sem origem nenhuma. Dá para guardar a UTM da primeira visita, mas vale medir antes se isso acontece muito.

> **Não existem colunas de CRM.** Quando o fluxo para o Kommo for montado, acrescente as que ele precisar **no fim** do `CABECALHO` e na mesma posição dentro do `appendRow`.

### As três colunas que não são resposta direta

| Coluna | O que é |
| --- | --- |
| **SAÍDA** | TRATAMENTO ou INTERVENÇÃO, pelos três critérios de perfil. Aparece em laranja quando é Tratamento |
| **Maior gargalo** | Em qual etapa ele perde mais, em texto: "Fala e não marca", "Marca e não vem", "Orçamento sem resposta", "Base dormindo" |
| **Diagnóstico** | O cruzamento de volume com aproveitamento: "Falta gente chegando", "Chega gente e escapa", "Volume e processo em pé", "Chega pouco e ainda escapa" |

> ⚠️ **Não apague nem reordene colunas na mão.** O script grava por posição, não por nome: tirar uma coluna desloca todas as seguintes, e os leads passam a entrar deslocados sem nenhum aviso. Se quiser esconder alguma, use **Ocultar coluna**, que é reversível e não afeta a gravação.

## Checagem antes de publicar

- [ ] `CONFIG.WEBHOOK` preenchido com a URL do `/exec`
- [ ] Aba `Leads` da v1 renomeada antes de rodar o script novo
- [ ] Teste completo preenchido, e a linha apareceu na planilha com as 24 colunas
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

2. **A pergunta da base mistura dois públicos com comportamento muito diferente.** Ela pede "pacientes antigos e interessados que nunca fecharam, tudo somado", e essas duas coisas reativam em ritmos incomparáveis: paciente que já pagou volta a 10% ou 20% ao ano, e lead frio que nunca fechou volta a uma fração disso. Enquanto estiverem somados, a taxa usada é sempre um meio-termo insatisfatório para os dois. **Separar em duas perguntas é a melhoria mais valiosa para a próxima versão**, e daria dois blocos distintos no relatório em vez de um número morno.
3. **A régua de pós-conversão não existe.** Hoje o lead cai na planilha e depende de alguém olhar. O previsto é mensagem automática em 2 minutos e contato humano em até 1 hora.
4. **A Saída 2 ainda não tem destino próprio.** Por decisão de 26/08, todos vão para o mesmo WhatsApp por enquanto, e a separação vive na coluna `SAÍDA` da planilha. Quando a página da Intervenção existir, trocar o botão.
5. **`ID Kommo` e `Status sincronização`** já existem como colunas vazias, prontas para quando o fluxo para o CRM for montado.
