# Página do Funil Avaliação · Orçamento Parado

Diagnóstico de 8 perguntas que calcula quanto a clínica está deixando na mesa.
É a porta de entrada do funil novo: alimenta a Avaliação completa e qualifica para a Intervenção.

**URL de destino:** `https://clinicas.genosgroup.com.br/orcamento-parado`

---

## O que tem aqui

| Caminho | O que é |
| --- | --- |
| `orcamento-parado/index.html` | A página. HTML único, sem build, sem CDN, sem framework. Abre com duplo clique e funciona offline. |
| `apps-script/leads.gs` | Código do Google Apps Script que grava os leads na planilha. |
| `ferramentas/gerador-de-links.html` | Ferramenta interna para montar links com UTM sem errar a grafia. **Não publicar junto com a página.** |
| `docs/README-original.md` | README que veio no `funil-avaliacao.zip`, preservado como referência. |

---

## Como publicar

A pasta `orcamento-parado/` é servida como está. Copiando a pasta para a raiz do site,
a URL fica `clinicas.genosgroup.com.br/orcamento-parado` — limpa, sem `.html` no fim.

Publique **somente** a pasta `orcamento-parado/`. As pastas `apps-script/`,
`ferramentas/` e `docs/` são de uso interno e não vão para o ar.

---

## ⚠️ Pendência que trava a gravação dos leads

No topo do `<script>` do `orcamento-parado/index.html` existe este bloco:

```js
const CONFIG = {
  WEBHOOK: '',
  WHATSAPP: '5521975613690',
  ORIGEM: 'orcamento-parado'
};
```

`WEBHOOK` está **vazio**. Enquanto estiver assim, a página funciona inteira na tela
— faz a conta, mostra o resultado, abre o WhatsApp — mas **nenhum lead é gravado na planilha**.

Para preencher, é preciso a URL do Apps Script publicado (termina em `/exec`).

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

Para conferir se está no ar, abra a URL do `/exec` no navegador. Deve responder:

```json
{"ok":true,"msg":"Endpoint do Orçamento Parado no ar."}
```

---

## Detalhe técnico que não deve ser mexido

O envio usa `Content-Type: text/plain` **de propósito**. Com `application/json`,
o navegador dispara um preflight CORS que o Google Apps Script não responde,
e o lead se perde em silêncio. Se parecer errado, é intencional.

---

## UTMs

São capturados automaticamente da query string e vão para a planilha.
Basta usar links com `?utm_source=...&utm_medium=...&utm_campaign=...`.

Para montar esses links sem errar a grafia, use `ferramentas/gerador-de-links.html`,
que já normaliza acento, maiúscula e espaço.

---

## Manutenção da página

- **Perguntas e faixas:** array `PERGUNTAS`, no início do script.
  Cada opção tem `t` (texto exibido) e `v` (valor usado na conta).
- **Taxas do cálculo:** função `calcular()`. Os percentuais estão explícitos e comentados.
  Se mudar taxa, mude também o texto do acordeão "Como essa conta é feita",
  senão a página passa a mentir sobre a própria conta.
- **Números da comparação:** função `renderResultado()`, variáveis `media` e `top`.
  Hoje estão em 52 e 78, que são **estimativas provisórias** e precisam ser
  substituídas pelos números reais da base de clientes.

---

## Pendências conhecidas (herdadas do material original)

1. **Os números 52 e 78 do Índice de Aproveitamento são chute.** Precisam sair da base
   real de clínicas. É a única parte da tela que não se sustenta em dado próprio.
2. **A régua de pós-conversão não existe ainda.** Hoje o lead cai na planilha e depende
   de alguém olhar. O previsto é mensagem automática em 2 minutos, seguida de contato
   humano em até 1 hora.
3. **Sem coluna de status nem de ID do CRM.** Quando o fluxo para o Kommo for montado,
   vale acrescentar `ID Kommo` e `Status sincronização` para evitar duplicata em
   reprocessamento.
