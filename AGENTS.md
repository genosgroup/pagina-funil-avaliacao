# Genos · regras desta base

## Medição: leia antes de criar ou mexer em LP

O padrão completo está em **[genosgroup/padroes → checklist-lp.md](https://github.com/genosgroup/padroes/blob/main/checklist-lp.md)**.
O que nunca pode ser decidido de novo caso a caso:

- **GA4 `G-X2G6KW4TNY` e Pixel `624880005754303`**, os mesmos em toda LP da Genos.
  Propriedade por LP parte o funil em pedaços que não somam; Pixel por LP fragmenta o
  aprendizado e deixa cada público pequeno demais para a Meta otimizar.
- **`content_group` com o nome da LP** no `gtag('config')`. É o que separa as LPs nos
  relatórios sem depender de filtro por URL.
- **Tags no template compartilhado** (layout raiz), nunca página a página. E lembre que
  cobertura é por **deploy**, não por domínio: LP nova em repositório novo precisa das
  tags no código dela, mesmo que o domínio já esteja coberto. (§1.5)
- **Conversão em código**, nunca só dentro de um GTM: `generate_lead` no GA4 e `Lead` na
  Meta, disparados **depois** da resposta de sucesso da API e **antes** de qualquer
  redirect. Nome inventado não conta como conversão otimizável. (§1.7)
- **Todo disparo em `try/catch`.** Bloqueador de anúncio é comum no público de tráfego
  pago; medição bloqueada não pode derrubar o envio do lead. (§1.4)
- **Nenhuma tag de terceiro.** Se aparecer `GT-`, `GTM-` ou `G-` que não seja a da Genos,
  provavelmente veio de migração de WordPress — e antes de remover, procure a conversão
  dentro dela. (§1.6)

Além da medição, o checklist cobre **SEO técnico** (§7), **performance** (§8) e
**conteúdo** (§9). Dois itens que o padrão antigo não pegava e que valem para toda LP
nova: `<html lang="pt-BR">` — boilerplate nasce com `en` e ninguém repara — e
`robots.txt` com `sitemap.xml`.

O kit para copiar numa LP nova está no §1.7. O inventário das páginas no ar está na
Parte 3, e **a lista que se roda antes do primeiro anúncio está na Parte 4.**

## Arquivos servidos

A rota do Worker casa por **prefixo**. Todo arquivo público desta página começa com
`avaliacao` por isso: um arquivo em `/og.png` nunca chega a este Worker. (§1.3)
