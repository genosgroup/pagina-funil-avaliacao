# Onde paramos e o que falta

Fechamento da sessão de 01/10/2026. Serve para retomar o trabalho em outra
conversa sem precisar reler nada.

---

## Como abrir a conversa nova

Ao abrir, **selecione estes repositórios**:

| Repositório | Para quê |
| --- | --- |
| `genosgroup/padroes` | destino do manual (o motivo da conversa nova) |
| `genosgroup/pagina-funil-avaliacao` | origem do manual, e a calculadora |
| `genosgroup/lp-genos-exclusivo-clinicas` | só se for fazer a tarefa 3 |

> **Por que uma conversa nova:** a sessão de hoje começou antes do `padroes`
> existir, e uma conversa só enxerga os repositórios liberados quando ela
> começou. Não é erro de permissão — é só a conversa ser mais velha que o
> repositório.

---

## O que já está pronto

### A calculadora `genosgroup.com.br/avaliacao`

Dois caminhos a partir de uma bifurcação ("Que tipo de negócio você tem?"):

- **Saúde ou estética** → 11 perguntas, resultado completo, lead na aba `Leads`
- **Serviço ou comércio** → 5 perguntas, número próprio, guia como segundo
  contato, lead na aba `Outros negócios`

Fechado e testado ponta a ponta nos dois caminhos. Apps Script v3.2 no ar,
confirmado com lead real em cada aba.

A página antiga `clinicas.genosgroup.com.br/avaliacao` saiu do ar.

### A medição do domínio

Era o maior problema e foi o que mais mudou. Antes: o site principal
reportava para duas propriedades do GA4 **de terceiro**, herdadas do Site Kit
na migração do WordPress, e a propriedade da Genos só via a calculadora. Duas
LPs não tinham medição nenhuma.

Hoje, cinco páginas, cinco deploys, todas medindo para o mesmo lugar:

| Página | GA4 | Pixel | Grupo de conteúdo |
| --- | :---: | :---: | --- |
| `genosgroup.com.br/` | ok | ok | Site · Genos Group |
| `/avaliacao` | ok | ok | Avaliação · Orçamento Parado |
| `/ebook` | ok | ok | LP · Ebook |
| `/receitaoculta` | ok | ok | LP · Receita Oculta |
| `clinicas.genosgroup.com.br` | ok | ok | LP · Exclusivo Clínicas |

- GA4: `G-X2G6KW4TNY` (conta Genos Group, 445075916, dados desde junho/24)
- Pixel: `624880005754303`
- GTM: `GTM-M8L8DL58`, da Genos, instalado só no site principal e **vazio**

As tags de terceiro (`GT-552FQVS`, `GTM-WBJTM4T2`, `G-YH35XPX9G3`,
`G-VH9KE2YJM6`) foram removidas de todos os lugares.

**Atenção permanente:** as conversões de três páginas moravam dentro do GTM de
terceiro. Foram trazidas para o código (`generate_lead` no GA4, `Lead` na
Meta). Não recrie GA4 nem Pixel dentro do `GTM-M8L8DL58` — duplicaria a
contagem na mesma propriedade, erro que não dá sinal nenhum e só infla o
relatório.

---

## O que falta, em ordem

### 1. Mudar o manual de endereço  ·  conversa nova, 10 min

O manual de medição (507 linhas) está em `pagina-funil-avaliacao/docs/PADRAO-MEDICAO.md`.
Ele não é da calculadora, é da Genos — por isso ninguém lembra onde está.

**Cole na conversa nova:**

> Mova o manual de `genosgroup/pagina-funil-avaliacao`, arquivo
> `docs/PADRAO-MEDICAO.md`, para o repositório `genosgroup/padroes`, como
> `README.md` dele. No lugar antigo, deixe um arquivo de uma linha apontando
> para o novo endereço. Depois atualize o `AGENTS.md` do
> `pagina-funil-avaliacao` para linkar o novo local.

Como `README.md`, ele abre sozinho na home do repositório.

### 2. A skill `medicao-genos`  ·  resolve o problema de raiz

O `AGENTS.md` faz a Claude seguir o padrão **dentro de um repositório que já
existe**. Ele não viaja: LP nova nasce em repositório novo, sem `AGENTS.md`
nenhum.

Uma skill fica na conta da Claude, não no repositório — então vale para
qualquer LP, nova ou velha, sem ninguém lembrar de pedir. É o mesmo lugar das
skills que vocês já usam (`deck-genos`, `kommo-genos`).

**Cole na conversa nova:**

> Escreva o conteúdo de uma skill `medicao-genos`, no padrão das outras skills
> da Genos, a partir do manual que está no repositório `genosgroup/padroes`.
> Ela precisa disparar sempre que eu pedir uma landing page nova, e garantir
> GA4, Pixel, grupo de conteúdo e evento de conversão em código.

A Claude escreve o texto; você cria a skill no painel.

### 3. `Lead` vira `Contact` no clique de WhatsApp do `clinicas.`  ·  15 min

Hoje o clique no WhatsApp dispara eventos diferentes dependendo da página:

| Página | Dispara |
| --- | --- |
| `clinicas.` | `Lead` |
| `/avaliacao` | `Contact` |

É o **mesmo Pixel** recebendo as duas coisas. Na prática `Lead` passa a
significar duas coisas no mesmo histórico: num lugar é formulário preenchido
com telefone, no outro é só um clique. A Meta aprende a buscar quem clica, não
quem converte.

A correção derruba o histórico do evento `Lead` daquela LP. **Como não há
campanha ativa hoje, o custo é zero** — daqui a um mês não é.

**Cole na conversa nova:**

> No repositório `genosgroup/lp-genos-exclusivo-clinicas`, arquivo
> `src/routes/index.tsx`, troque o `fbq("track", "Lead")` do clique de WhatsApp
> por `fbq("track", "Contact")`, para ficar igual à `/avaliacao`. `Lead` deve
> ficar reservado para quem entregou contato.

### 4. O lugar único de rastreio  ·  quando quiser

Fica uma planilha de três abas, porque as três mudam em ritmos diferentes:

1. **Páginas** — o inventário acima. Responde "esta página está medida?".
   Página nova entra aqui antes do primeiro anúncio.
2. **Convenção** — vocabulário **fechado** de `utm_source` e `utm_medium`.
   `instagram`, nunca `ig` nem `insta`. É o que impede o GA4 de criar três
   canais que não somam.
3. **Links gerados** — histórico: data, campanha, página, URL completa.

E o gerador de UTM com **lista suspensa** alimentada pela aba 2, publicado numa
URL que abre do celular. O de hoje
(`pagina-funil-avaliacao/ferramentas/gerador-de-links.html`) tem campo de texto
livre e **não está no ar** — fica fora da pasta `public/`, então o Worker não
o serve.

> **Correção de formato, importante:** UTM não é propriedade da página, é
> propriedade do anúncio. A mesma `/avaliacao` vai ter dezenas de UTMs. Por
> isso a convenção e o histórico são abas separadas do inventário, e não
> colunas dele.

---

## Três coisas que vale não reaprender

**A unidade de cobertura é o deploy, não o domínio.** O GA4 não varre site: ele
só recebe o que cada página manda. O `genosgroup.com.br` é servido por quatro
Workers de quatro repositórios. Pôr a tag no layout de um não cobre os outros
três. A pergunta certa não é "o domínio está medido?", é "quantos deploys
servem este domínio, e cada um tem a tag?".

**Anúncio de Meta sem UTM é anúncio invisível.** A Meta carimba `fbclid`, mas o
GA4 não usa `fbclid` para atribuição — só o `gclid` do Google. Sem UTM, o
tráfego pago da Meta cai misturado com o orgânico ou em "Direct", e não dá para
calcular retorno. Como as campanhas são majoritariamente Meta, UTM não é
refinamento: é o que faz a medição existir.

**O Tag Assistant nunca mostra o Pixel da Meta.** É ferramenta do Google.
Ausência ali não é evidência de ausência na página — esse engano custou uma
investigação inteira. Para Pixel, use o Meta Pixel Helper ou o Gerenciador de
Eventos.
