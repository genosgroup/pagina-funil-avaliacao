# Página do Funil Avaliação · Orçamento Parado (v2.0)

Diagnóstico de 12 perguntas que faz a clínica descobrir sozinha onde está o dinheiro.
É a porta de entrada do funil AVALIAÇÃO e classifica o lead entre as duas saídas:
Tratamento e Intervenção.

**URL de destino:** `https://clinicas.genosgroup.com.br/orcamento-parado`

---

## O que tem aqui

| Caminho | O que é |
| --- | --- |
| `orcamento-parado/index.html` | A página. HTML único, sem build, sem CDN, sem framework. Abre com duplo clique e funciona offline. |
| `apps-script/leads.gs` | Código do Google Apps Script que grava os leads na planilha (41 colunas). |
| `ferramentas/gerador-de-links.html` | Ferramenta interna para montar links com UTM sem errar a grafia. **Não publicar junto com a página.** |
| `docs/README-original.md` | README que veio no `funil-avaliacao-v2.zip`, preservado. Traz o racional completo do cálculo. |

---

## ⚠️ A ordem dos passos importa

Se subir a página antes de ter a URL do Apps Script, ela vai ao ar sem gravar lead
nenhum — e não dá para perceber: a tela funciona, o número aparece, e o lead evapora.

**1. Prepare a planilha.** Renomeie a aba `Leads` para `Leads v1`.
O cabeçalho mudou de 24 para 41 colunas; sem isso as colunas novas entram
desalinhadas em cima dos dados antigos. O script cria a aba nova sozinho.

**2. Publique o Apps Script.** Cole `apps-script/leads.gs` e implante como app da web
(instruções abaixo). Copie a URL que termina em `/exec`.

**3. Teste o endpoint sozinho.** Abra a URL do `/exec` no navegador. Tem que responder:

```json
{"ok":true,"msg":"Endpoint do Orçamento Parado v2.0 no ar."}
```

Se não responder isso, pare aqui — o resto não vai funcionar.

**4. Cole a URL no HTML,** em `CONFIG.WEBHOOK` (veja abaixo).

**5. Só agora suba a página.**

**6. Preencha o formulário inteiro no ar** e confira se a linha apareceu na planilha
com as 41 colunas. Se não apareceu, veja a aba `Erros`: o script grava lá o que deu
errado, com o conteúdo do envio, para o lead não sumir em silêncio.

**7. Avise qual ficou sendo a URL final.** Ela vai para bio, anúncio e prospecção,
e os links rastreados são montados em cima dela.

---

## Como publicar

A pasta `orcamento-parado/` é servida como está. Copiando a pasta para a raiz do site,
a URL fica `clinicas.genosgroup.com.br/orcamento-parado` — limpa, sem `.html` no fim.

Publique **somente** a pasta `orcamento-parado/`. As pastas `apps-script/`,
`ferramentas/` e `docs/` são de uso interno e não vão para o ar.

---

## ⚠️ Pendência que trava a gravação dos leads

No topo do `<script>` do `orcamento-parado/index.html`:

```js
const CONFIG = {
  WEBHOOK: '',
  WHATSAPP: '5521975613690',
  ORIGEM: 'orcamento-parado'
};
```

`WEBHOOK` está **vazio**. Enquanto estiver assim, a página funciona inteira na tela
— faz a conta, mostra o resultado, abre o WhatsApp — mas **nenhum lead é gravado**.

> Toda vez que substituir o arquivo no servidor, confira se a URL continua lá:
> o `CONFIG.WEBHOOK` mora dentro do próprio HTML.

### Publicando o Apps Script

Planilha de destino: [**[Funil AVALIAÇÃO] Leads**](https://docs.google.com/spreadsheets/d/1THyTEurgi6jYSL110C9FSwK6pse1psTCxnlz_yOyKYQ/edit)

1. Abra a planilha
2. Menu **Extensões › Apps Script**
3. Apague o conteúdo de `Code.gs` e cole o conteúdo de `apps-script/leads.gs`
4. Salve
5. **Implantar › Nova implantação**
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL gerada (termina em `/exec`)
7. Cole no `CONFIG.WEBHOOK` e republique a página

> Alterou o Apps Script depois de publicar? Salvar não basta. É preciso criar uma
> **nova implantação** (ou editar a existente e trocar a versão), senão a URL continua
> servindo o código antigo.

---

## Dois detalhes técnicos que não devem ser mexidos

**1. `Content-Type: text/plain` é de propósito.** Com `application/json`, o navegador
dispara um preflight CORS que o Google Apps Script não responde, e o lead se perde
em silêncio. Se parecer errado, é intencional.

**2. São dois envios por lead.** O primeiro acontece no gate, com tudo. O segundo
acontece se o lead responder a pergunta do sistema de gestão na tela de resultado, e
vem com `atualizacao: true`. O script procura a linha do mesmo WhatsApp nas últimas 50
e completa a coluna, em vez de duplicar.

---

## UTMs

São capturados automaticamente da query string e vão para a planilha.
Basta usar links com `?utm_source=...&utm_medium=...&utm_campaign=...`.

Para montar esses links sem errar a grafia, use `ferramentas/gerador-de-links.html`,
que já normaliza acento, maiúscula e espaço.

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

**A ordem das perguntas não é negociável.** Volume, agendamento, comparecimento e
conversão estão em sequência de propósito: o dono vê o próprio funil encolher enquanto
responde, antes de qualquer número calculado aparecer. Reagrupar por tema transforma o
diagnóstico em cadastro.

O racional completo do cálculo — estoque vs. fluxo, a regra dos três "não sei",
a normalização do índice, o segundo eixo e a classificação de saída — está em
`docs/README-original.md`.

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

## Manutenção da página

- **Perguntas e faixas:** array `PERGUNTAS`. Cada opção tem `t` (texto exibido) e `v` (valor usado na conta).
- **Taxas do cálculo:** função `calcular()`. Se mudar taxa, mude também o texto do
  acordeão "Como essa conta é feita", senão a página passa a mentir sobre a própria conta.
- **Referências de mercado:** constante `REF`. **Tetos do índice:** constante `TETO`, dentro de `calcular()`.

---

## Pendências conhecidas (herdadas do material original)

1. **Os números 52 e 78 do Índice são chute.** Precisam sair da base real de clínicas.
   É a única parte da tela que não se sustenta em dado próprio.
2. **A pergunta 11 mistura dois públicos com comportamento muito diferente** (paciente
   antigo e lead que nunca fechou). Separar em duas perguntas é a melhoria mais valiosa
   para uma v2.1.
3. **A régua de pós-conversão não existe.** Hoje o lead cai na planilha e depende de
   alguém olhar. O previsto é mensagem automática em 2 minutos e contato humano em até 1 hora.
4. **A Saída 2 ainda não tem destino próprio.** Todos vão para o mesmo WhatsApp por
   enquanto, e a separação vive na coluna `SAÍDA` da planilha. Quando a página da
   Intervenção existir, trocar o botão.
5. **`ID Kommo` e `Status sincronização`** já existem como colunas vazias, prontas para
   quando o fluxo para o CRM for montado.
