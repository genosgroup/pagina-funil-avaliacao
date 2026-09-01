# Página do Funil Avaliação · Orçamento Parado (v3)

Diagnóstico de 11 perguntas que faz a clínica descobrir sozinha onde está o dinheiro.
É a porta de entrada do funil AVALIAÇÃO e classifica o lead entre as duas saídas:
Tratamento e Intervenção.

**URL no ar:** `https://clinicas.genosgroup.com.br/avaliacao`
**Hospedagem:** Cloudflare Workers (assets estáticos), com deploy automático a partir deste repositório.

> O material original pede `/orcamento-parado` como caminho. A rota que ficou de pé
> é `/avaliacao`, decidida depois. Quem for montar link de anúncio ou bio usa esta,
> não a do documento.

---

## O que tem aqui

| Caminho | O que é |
| --- | --- |
| `public/index.html` | A página. HTML único, sem build, sem CDN, sem framework. Abre com duplo clique e funciona offline. É a única pasta que vai ao ar. |
| `wrangler.jsonc` | Configuração do Worker que serve a página. |
| `apps-script/leads.gs` | Código do Google Apps Script que grava os leads na planilha (24 colunas). |
| `ferramentas/gerador-de-links.html` | Ferramenta interna para montar links com UTM sem errar a grafia. **Não publicar junto com a página.** |
| `docs/README-original.md` | README que veio no `funil-avaliacao-v3.zip`, preservado. Traz o racional completo do cálculo. |
| `j.png` | Marca da Genos. É a origem do favicon, que está embutido no HTML em base64 para a página seguir sendo um arquivo único. |

---

## Estado atual: no ar e gravando

Nada aqui está pendente. A página responde, o Apps Script está publicado, e o lead
cai na planilha. Esta seção existe para quem precisar refazer o caminho.

- `CONFIG.WEBHOOK` **está preenchido** no `public/index.html` com a URL do `/exec`.
- A aba `Leads` já está com as 24 colunas da v3.
- O Worker `funil-avaliacao` está implantado, com a rota `clinicas.genosgroup.com.br/avaliacao*`.

> Toda vez que substituir o `public/index.html` por uma versão nova vinda do Drive,
> confira estas quatro coisas, que moram dentro do próprio HTML e se perdem na troca:
> **1.** `CONFIG.WEBHOOK` com a URL do `/exec`;
> **2.** `<title>Avaliação</title>` e o `<link rel="icon">` em base64;
> **3.** a trava `avancando` em `escolher()`;
> **4.** a rede de segurança `faltando` em `revelar()`.
> As duas últimas estão explicadas em *Correções aplicadas sobre o material original*.

---

## Como publicar

O deploy é automático: **todo push nesta branch republica o Worker**. Não há build —
o Cloudflare só copia o conteúdo de `public/`.

Só o que está em `public/` vai ao ar. As pastas `apps-script/`, `ferramentas/` e
`docs/` são de uso interno e ficam fora, porque o Worker serve exclusivamente
o diretório declarado em `wrangler.jsonc`.

### Como o deploy acontece

`.github/workflows/deploy.yml` roda `wrangler deploy` no runner do GitHub a cada push
que toque `public/` ou `wrangler.jsonc`. Mudança só de documentação não republica.

Depende de um segredo no repositório: **`CLOUDFLARE_API_TOKEN`**, em
*Settings › Secrets and variables › Actions*. O token precisa da permissão
**Account › Workers Scripts › Edit**. O Account ID está no próprio workflow — não é
segredo, é o mesmo que aparece na URL do painel.

A versão do Wrangler está **fixada** no workflow. Não solte essa versão: o Wrangler 3
não sabe publicar um Worker que só serve assets e falha com `Missing entry-point`.

### Onde a implantação responde

O Worker se chama `funil-avaliacao` e responde sempre em:

```
https://funil-avaliacao.group-656.workers.dev
```

Esse endereço serve para conferir uma implantação antes de mexer na rota, e continua
respondendo depois — é o mesmo conteúdo, sem passar pelo domínio.

### A rota

A rota fica no painel (**Worker › Settings › Domains & Routes**), não no
`wrangler.jsonc`, para que uma mudança de zona ou de permissão não quebre o deploy.

Rota em uso:

```
clinicas.genosgroup.com.br/avaliacao*
```

**O asterisco não é enfeite.** A rota casa contra a URL inteira, query string
incluída, então `/avaliacao` sem asterisco deixaria de fora exatamente os links de
anúncio, que sempre chegam com `?utm_source=...`.

Esse hostname também é servido pelo Worker `lp-genos-exclusivo-clinicas`. Os dois
convivem: a Cloudflare escolhe a rota mais específica, então `/avaliacao*` vem para cá
e todo o resto continua na landing page. **Não use uma rota `/*` neste Worker** — ela
empataria em especificidade com a da landing e o resultado passaria a depender de
ordem, não de regra.

Como `not_found_handling` está em `single-page-application`, qualquer caminho servido
por este Worker devolve a página. Isso é proposital: a URL vai para anúncio, bio e
prospecção, e um caractere a mais no fim do link não pode virar 404.

---

## O Apps Script

Planilha de destino: [**[Funil AVALIAÇÃO] Leads**](https://docs.google.com/spreadsheets/d/1THyTEurgi6jYSL110C9FSwK6pse1psTCxnlz_yOyKYQ/edit)

Já está instalado e publicado. **Não crie uma implantação nova sem necessidade:**
isso gera uma URL diferente, e a URL antiga é a que está dentro do HTML. A gravação
de leads para sem dar aviso nenhum.

Alterou o código? Salvar não basta para o endpoint. Vá em
**Implantar › Gerenciar implantações**, edite a existente e troque a Versão para
"Nova versão". Assim a URL continua a mesma.

Para conferir se está no ar, abra a URL do `/exec` no navegador:

```json
{"ok":true,"msg":"Endpoint do Orçamento Parado v3 no ar."}
```

Instalar do zero, em outra planilha, está descrito no cabeçalho do próprio
`apps-script/leads.gs`.

### Fuso horário

A coluna `Data` é gravada no fuso da **planilha**, não no do script. Planilha nova do
Google nasce em horário do Pacífico, e o lead chega 4 horas atrasado sem ninguém
perceber até comparar com o relógio.

O script corrige isso sozinho (`garantirFuso`, fixado em `America/Sao_Paulo`). Se a
conta não tiver permissão para alterar o fuso pelo código, ele segue gravando e deixa
um aviso no log em vez de falhar — nesse caso o ajuste manual em
**Arquivo › Configurações › Fuso horário** é obrigatório.

Linhas gravadas antes do ajuste não são corrigidas retroativamente: o valor já foi
armazenado traduzido.

---

## Três detalhes técnicos que não devem ser mexidos

**1. `Content-Type: text/plain` é de propósito.** Com `application/json`, o navegador
dispara um preflight CORS que o Google Apps Script não responde, e o lead se perde
em silêncio. Se parecer errado, é intencional.

**2. São até três envios por lead.** O primeiro acontece no gate, com tudo. Os outros
acontecem se o lead responder as duas perguntas da tela de resultado (sistema de
gestão e Instagram), e vêm com `atualizacao: true`. O script procura a linha do mesmo
WhatsApp nas últimas 50 e completa as colunas, em vez de duplicar.

**3. A gravação na planilha é por posição.** `CABECALHO` e o `appendRow` do
`doPost` são duas listas paralelas. Mexeu em uma, mexa na outra, no mesmo índice.

---

## UTMs

São capturados automaticamente da query string e vão para a planilha, nas colunas
`Canal`, `Formato`, `Campanha` e `Variação`. Basta usar links com
`?utm_source=...&utm_medium=...&utm_campaign=...&utm_content=...`.

Para montar esses links sem errar a grafia, use `ferramentas/gerador-de-links.html`,
que já normaliza acento, maiúscula e espaço.

---

## O que mudou da v2 para a v3

| | v2 | v3 |
| --- | --- | --- |
| Perguntas | 12, mais 1 depois do gate | 11, mais 2 depois do gate |
| Orçamentos parados | era uma pergunta | saiu, e não volta |
| Ordem | funil inteiro em sequência | porte, depois quem atende, depois o funil |
| Número em destaque | anual | **mensal** |
| Aproveitamento | índice 0 a 100 com pesos inventados | quantos de cada 100 viram paciente |
| Referências 52 e 78 | chutadas, apareciam na tela | **saíram** |
| Blocos de apoio | tudo em reais | os frágeis só em pessoas |
| Classificação de saída | caixa, via ticket e potencial | 3 critérios juntos: cadeiras ≥ 2, ticket ≥ R$ 3 mil, contatos ≥ 81 |
| Colunas na planilha | 41 | **24**, só respostas e leitura |
| WhatsApp de destino | 5521975613690 | **5521985237650** |

**Por que a pergunta de orçamentos parados saiu.** Era a que mais exigia consultar o
sistema, e convidava o dono a se defender: ele acha que faz follow-up, então
responderia "limpamos sempre" mesmo tendo pilha parada.

**Por que o número principal virou mensal.** O anual multiplicava tudo por doze e
transformava a conta num número que ninguém acredita. O valor de 12 meses continua
na página, mas mais abaixo e explicado como repetição do mesmo mês.

**A ordem das perguntas não é negociável.** O funil (agendamento, comparecimento,
conversão) vem depois de três perguntas sobre quem atende. O dono primeiro conta que
o processo é frágil e só então responde as taxas: o resultado ruim deixa de ser
surpresa e vira consequência do que ele mesmo acabou de descrever.

O racional completo do cálculo — a mesma régua nas três etapas, a regra dos três
"não sei", o aproveitamento, o segundo eixo e a classificação de saída — está em
`docs/README-original.md`.

---

## Correções aplicadas sobre o material original

Duas, ambas no `public/index.html`, e **precisam ser reaplicadas** a cada versão nova
que vier do Drive, porque o arquivo original não as tem.

**1. A trava `avancando`, em `escolher()`.** Sem ela, dois toques dentro da animação
de 240 ms agendavam dois avanços e a pergunta seguinte era pulada sem resposta. Doze
perguntas depois, `calcular()` estourava em `Cannot read properties of undefined`, o
botão do gate não fazia nada, e o `.catch(()=>{})` do envio garantia que ninguém
ficasse sabendo. Isso aconteceu em produção.

**2. A rede de segurança `faltando`, em `revelar()`.** Se por qualquer motivo faltar
uma resposta, leva o lead de volta àquela pergunta em vez de estourar no cálculo.

> Ao testar isso automaticamente, **clique rápido e mais de uma vez**. Um teste que
> espera 400 ms entre cliques passa por cima do bug sem vê-lo.

---

## Checagem antes de publicar

- [ ] `CONFIG.WEBHOOK` preenchido com a URL do `/exec`
- [ ] Título da aba e favicon no lugar
- [ ] Trava `avancando` e rede `faltando` presentes
- [ ] Fluxo inteiro preenchido, e a linha apareceu na planilha com as 24 colunas
- [ ] Fluxo preenchido **com cliques repetidos**, conferindo que nenhuma pergunta é pulada
- [ ] Teste com três "não sei", conferindo que o gargalo vira "Não se mede" e o aproveitamento some
- [ ] As duas perguntas pós-gate respondidas, conferindo que **completaram a linha em vez de criar outra**
- [ ] Botão final abre o WhatsApp com a mensagem já escrita
- [ ] Testado no celular, que é onde o dentista vai responder

---

## Manutenção da página

- **Perguntas e faixas:** array `PERGUNTAS`. Cada opção tem `t` (texto exibido) e `v` (valor usado na conta).
- **Taxas do cálculo:** função `calcular()`. Se mudar taxa, mude também o texto do
  acordeão "Como essa conta é feita", senão a página passa a mentir sobre a própria conta.
- **Referências de mercado:** constante `REF`.
- **Sistemas de gestão oferecidos:** constante `SISTEMAS`.

> O `docs/README-original.md` cita uma constante `TETO`. Ela era da v2 e não existe
> mais: a v3 trocou o índice normalizado pela multiplicação direta das três taxas.

---

## Pendências conhecidas (herdadas do material original)

1. **A pergunta da base mistura dois públicos.** Ela pede "pacientes antigos e
   interessados que nunca fecharam, tudo somado", e os dois reativam em ritmos
   incomparáveis. Separar em duas perguntas é a melhoria mais valiosa para a próxima versão.
2. **A régua de pós-conversão não existe.** Hoje o lead cai na planilha e depende de
   alguém olhar. O previsto é mensagem automática em 2 minutos e contato humano em até 1 hora.
3. **A Saída 2 ainda não tem destino próprio.** Todos vão para o mesmo WhatsApp por
   enquanto, e a separação vive na coluna `SAÍDA` da planilha. Quando a página da
   Intervenção existir, trocar o botão.
4. **Não há colunas de CRM na planilha.** A v2 tinha `ID Kommo` e `Status sincronização`
   vazias; a v3 as removeu. O `docs/README-original.md` ainda as menciona — está
   desatualizado nesse ponto. Quando o fluxo para o Kommo for montado, acrescente as
   colunas no fim do `CABECALHO` **e** na mesma posição dentro do `appendRow`.
