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

### ~~1. Mudar o manual de endereço~~ · FEITO em 01/10/2026

O manual está em **https://github.com/genosgroup/padroes**, no arquivo
`medicao-lp.md`. O README de lá é o índice. No lugar antigo ficou um aviso
apontando para cá — não edite a cópia velha, senão as duas divergem.

### Tudo feito em 01/10/2026

| | |
| --- | --- |
| Manual movido para `genosgroup/padroes` | feito |
| Manual virou checklist de 4 frentes (medição, SEO, performance, conteúdo) | feito |
| `template-lp/` para repositório novo | feito |
| Texto da skill `medicao-genos` | escrito, **falta você criar no painel** |
| `clinicas.`: `lang="en"` → `pt-BR`, `Lead` → `Contact`, robots, sitemap | **falta mergear** |
| `robots.txt` e `sitemap.xml` do apex | **falta mergear** |

Links:

- Checklist: https://github.com/genosgroup/padroes/blob/main/checklist-lp.md
- Template: https://github.com/genosgroup/padroes/tree/main/template-lp
- Skill: https://github.com/genosgroup/padroes/blob/main/skill-medicao-genos.md

## O que ainda falta

1. **Mergear os dois PRs** (links na conversa, ou em Branches de cada repositório).
2. **Criar a skill** `medicao-genos` no painel de Skills do claude.ai, colando o
   texto do arquivo acima.
3. **Rodar a Parte 4 do checklist** numa LP, para calibrar: é a primeira vez que a
   lista é usada de verdade.
