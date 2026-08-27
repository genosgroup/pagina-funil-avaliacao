# Orçamento Parado · Genos

Diagnóstico digital de 8 perguntas que calcula quanto a clínica está deixando na mesa. É a porta de entrada do funil: alimenta a Avaliação completa e qualifica para a Intervenção.

---

## O que é o arquivo

`orcamento-parado.html` é um **arquivo único e autocontido**. Todo o CSS e o JavaScript estão dentro dele. Não usa CDN, não usa framework, não tem build, não tem dependência. Abre com duplo clique e funciona offline.

Isso é proposital: qualquer pessoa consegue subir, e nada quebra por causa de biblioteca externa.

---

## Onde subir

A URL de destino é **`clinicas.genosgroup.com.br/orcamento-parado`**.

Se o servidor serve arquivos estáticos por pasta, o caminho é:

```
/orcamento-parado/index.html
```

Nesse caso **renomeie o arquivo para `index.html`** e coloque dentro da pasta `orcamento-parado`. Assim a URL fica limpa, sem `.html` no fim.

Se preferir servir direto como `/orcamento-parado.html`, também funciona. Só avise qual foi, porque a URL vai em anúncio, bio e mensagem de prospecção.

---

## As duas configurações obrigatórias

No topo do `<script>`, dentro do arquivo, existe um bloco `CONFIG`:

```js
const CONFIG = {
  WEBHOOK: '',
  WHATSAPP: '5521975613690',
  ORIGEM: 'orcamento-parado'
};
```

**`WEBHOOK`** precisa receber a URL do Google Apps Script (instruções abaixo). Enquanto estiver vazio, o formulário funciona normalmente na tela, mas **o lead não é gravado em lugar nenhum**.

**`WHATSAPP`** é o número que recebe o clique do botão final. Já está com o número da Genos.

---

## Ligar a planilha de leads

Os leads caem em:

**[Funil AVALIAÇÃO] Leads**
`Meu Drive / CLIENTES [ATIVO] / [GENOS GROUP] / MARKETING / Funil AVALIAÇÃO`
https://docs.google.com/spreadsheets/d/1THyTEurgi6jYSL110C9FSwK6pse1psTCxnlz_yOyKYQ/edit

Passo a passo:

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

Para testar se está no ar, abra a URL do `/exec` no navegador. Deve responder:

```json
{"ok":true,"msg":"Endpoint do Orçamento Parado no ar."}
```

> **Nota técnica:** o envio usa `Content-Type: text/plain` de propósito. Com `application/json` o navegador dispara um preflight CORS que o Apps Script não responde, e o lead se perde silenciosamente. Não troque.

---

## O que é enviado

```json
{
  "origem": "orcamento-parado",
  "data": "2026-08-25T18:00:00.000Z",
  "nome": "Fulano",
  "whatsapp": "21999999999",
  "respostas": { "avaliacoes": "De 21 a 50", "ticket": "De R$ 8 mil a R$ 15 mil", "...": "..." },
  "calculo": {
    "parado": 24000,
    "perdido_mes": 26880,
    "dormindo": 24000,
    "anual": 370560,
    "indice": 47,
    "gargalo": "orcamento",
    "orcamentos_estimados": false
  },
  "qualifica_intervencao": true,
  "url": "https://clinicas.genosgroup.com.br/orcamento-parado",
  "utm": { "utm_source": "instagram", "utm_medium": "bio" }
}
```

**`qualifica_intervencao`** é `true` quando a base do lead tem 5.000 contatos ou mais. É o critério de entrada da Intervenção, e vem calculado para o comercial não precisar reler as respostas.

**UTMs** são capturados automaticamente da query string da URL. Basta usar links com `?utm_source=...&utm_medium=...` que eles chegam na planilha.

Para montar esses links sem errar a grafia, use o **`gerador-de-links.html`** que está nesta mesma pasta. Ele já tem a convenção da casa embutida e normaliza acento, maiúscula e espaço, que é o que costuma sujar o relatório.

---

## Checagem antes de publicar

- [ ] `CONFIG.WEBHOOK` preenchido com a URL do `/exec`
- [ ] Teste completo preenchido, e a linha apareceu na planilha
- [ ] Botão final abre o WhatsApp com a mensagem já escrita
- [ ] Testado no celular, que é onde o dentista vai responder
- [ ] URL final confirmada e comunicada, porque ela vai para anúncio e bio

---

## Manutenção

**Trocar as perguntas ou as faixas:** array `PERGUNTAS`, no início do script. Cada opção tem `t` (o texto que aparece) e `v` (o valor usado na conta).

**Trocar as taxas do cálculo:** função `calcular()`. Os percentuais estão explícitos e comentados. Se mudar taxa, **mude também o texto do acordeão "Como essa conta é feita"**, senão a página passa a mentir sobre a própria conta.

**Trocar os números da comparação:** função `renderResultado()`, variáveis `media` e `top`. Hoje estão em 52 e 78, que são **estimativas provisórias** e precisam ser substituídas pelos números reais da base de clientes.

---

## Pendências conhecidas

1. **Os números 52 e 78 do Índice de Aproveitamento são chute.** Precisam sair da base real de clínicas. É a única parte da tela que não se sustenta em dado próprio.
2. **A régua de pós-conversão não existe ainda.** Hoje o lead cai na planilha e depende de alguém olhar. O previsto é uma mensagem automática em 2 minutos, seguida de contato humano em até 1 hora.
3. **Sem coluna de status nem de ID do CRM.** Quando o fluxo para o Kommo for montado, vale acrescentar `ID Kommo` e `Status sincronização` para evitar duplicata em reprocessamento.
