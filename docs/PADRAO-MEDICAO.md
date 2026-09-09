# Padrão de medição para LPs · Genos

O que precisa estar de pé para uma landing page medir direito.
Nasceu do funil AVALIAÇÃO, em 09/09/2026, e vale para as próximas, da Genos e de cliente.

**A Parte 1 é o roteiro: siga na ordem.** A ordem não é estética — cada passo destrava o
seguinte, e fazer fora de ordem trava. A Parte 2 explica o porquê de cada coisa, para
quando alguém precisar decidir diferente.

---
---

# PARTE 1 · O ROTEIRO

## Fase 0 · Decidir, antes de escrever qualquer código

- [ ] **A URL final.** Ela vai para anúncio, bio e prospecção, e os links rastreados são
      montados em cima dela. Trocar depois invalida tudo que já circulou.
- [ ] **Qual propriedade do GA4.** LP em subdomínio do site do cliente entra na
      propriedade do cliente, não numa nova. (§2.5)
- [ ] **Qual pixel da Meta.** Sempre o pixel da marca. Nunca um por LP. (§4.2)
- [ ] **Correspondência avançada, sim ou não.** É dado pessoal indo para um terceiro.
      Decisão de negócio, e precisa estar na política de privacidade. (§4.4)

## Fase 1 · Na página

- [ ] `<title>` e `<meta name="description">`
- [ ] `og:title`, `og:description`, `og:url`, `og:type`, `og:locale`, `twitter:card`
- [ ] **`og:image` de 1200×630**, com `og:image:width`, `height` e `alt` (§1.1)
- [ ] `<link rel="canonical">` apontando para a URL final (§1.2)
- [ ] IDs numa constante única no topo: `GA_ID`, `META_PIXEL`. Vazio = desligado
- [ ] `page_location` normalizado, **preservando `location.search`** (§1.2)
- [ ] `content_group` com o nome da LP (§2.5)
- [ ] Eventos nomeados por etapa do funil, com `generate_lead` entre eles (§2)
- [ ] **Número do passo** no evento de cada pergunta (§2)
- [ ] Pixel com `PageView`, `Lead` e `Contact` (§4.3)
- [ ] Correspondência avançada: telefone **com DDI**, e o `init` **antes** do `track` (§4.4)
- [ ] Todo disparo dentro de `try/catch` (§1.3)

## Fase 2 · No GA4, ANTES de subir

> **Dimensão personalizada não é retroativa.** O que rodar antes de registrá-las é dado
> perdido. Este é o único passo que não dá para "fazer depois".

- [ ] Criar propriedade e fluxo de web; copiar o `G-XXXXXXXXXX` para a página
- [ ] **Registrar as dimensões personalizadas**, escopo Evento, uma por parâmetro (§3.1)
- [ ] Retenção: 2 → **14 meses** (§3.2)
- [ ] Tráfego interno definido **e o filtro em Ativo, não em Teste** (§3.3)
- [ ] Moeda em Real e fuso em São Paulo

## Fase 3 · Subir e fazer UM preenchimento de teste

Este preenchimento não é conferência: é **pré-requisito de quatro coisas**. Faça inteiro,
até clicar no botão final.

- [ ] Publicar a página
- [ ] Preencher o formulário todo, **no celular**, incluindo o clique final
- [ ] **GA4 → Tempo real:** todos os eventos aparecem (§3.4)
- [ ] **Meta → Eventos de teste:** `PageView`, `Lead`, `Contact`, e o `Lead` mostrando
      "correspondência avançada"
- [ ] **A planilha:** a linha caiu, completa, com a hora certa
- [ ] **O botão final** abre o WhatsApp com a mensagem escrita

## Fase 4 · Depois do teste

- [ ] Marcar os principais eventos: `generate_lead` e o de contato (§3.5)
- [ ] Apagar as linhas de teste da planilha
- [ ] Conferir a prévia do link: colar a URL no WhatsApp e ver se a imagem aparece

## Fase 5 · Antes da PRIMEIRA campanha

> Tráfego que entra sem UTM entra sem atribuição, e **isso não se corrige depois**.

- [ ] Domínio verificado no Meta Business, **por DNS** (§4.5)
- [ ] Parâmetros de URL colados no anúncio, e convenção de nomes combinada (§4.6)

## Uma vez por domínio, não por LP

- [ ] Search Console como propriedade de **Domínio** (§5)
- [ ] Search Console vinculado ao GA4 **e a coleção publicada na Biblioteca** (§5)

---

## As cinco armadilhas que já custaram caro

| Armadilha | Como ela aparece |
| --- | --- |
| **Parâmetro com acento** | Você cadastra `saída`, a página manda `saida`. O GA aceita calado e a dimensão fica existindo e sempre vazia. Pior que não existir. |
| **Filtro em "Teste"** | Fica lá parecendo configurado e não filtra nada. Todo teste interno vira lead e a conversão mente. |
| **Coleção não publicada** | Search Console vinculado, relatórios invisíveis. |
| **Retenção de 2 meses** | Padrão do GA4, irreversível. Sem comparação ano a ano, para sempre. |
| **UTM inconsistente** | `instagram`, `ig` e `meta` viram três canais. Nenhuma soma bate. |

---
---

# PARTE 2 · POR QUÊ

## §1. Na página

### §1.1 A `og:image` é a única exceção ao arquivo único

`og:image` **não aceita caminho relativo nem data URI**: precisa de URL absoluta, num
arquivo à parte. É por isso que o favicon pode viver embutido em base64 e ela não.

Gerar a imagem a partir do HTML da própria LP, com os mesmos tokens de cor e a mesma
tipografia, sai mais rápido que pedir arte e garante que o card não pareça de outro
produto.

Sem ela, o link colado no WhatsApp ou no direct vai sem imagem. Numa página que existe
para ser compartilhada, isso é clique perdido antes de a página abrir.

### §1.2 A armadilha do `single-page-application`

Servir a LP com `not_found_handling: "single-page-application"` é proposital: um
caractere a mais no fim de um link de anúncio não pode virar 404.

O efeito colateral é que **qualquer caminho devolve a página**. Sem tratamento,
`/avaliacao`, `/avaliacao/`, `/AVALIACAO` e um link truncado viram **quatro páginas
distintas** no relatório, e o volume real se fragmenta.

Dois consertos, um para cada lado:

```html
<link rel="canonical" href="https://.../avaliacao">
```

```js
gtag('config', GA_ID, {
  page_location: location.origin + '/avaliacao' + location.search
});
```

**O `location.search` não é opcional.** Sem ele a query string some, as UTMs vão junto,
e a atribuição de campanha inteira se apaga.

### §1.3 Métrica não pode quebrar tela

Todo disparo passa por uma função única que engole erro:

```js
function evento(nome, dados){
  try { if (GA_ID) gtag('event', nome, dados || {}); } catch(e){}
}
```

Com a tag desligada, ou barrada por bloqueador de anúncio, vira no-op.

**Não é zelo teórico.** Esta página já perdeu lead em produção por um erro de JavaScript
que ninguém viu, porque o envio tinha um `.catch(()=>{})` mudo. Teste a LP com as tags
bloqueadas antes de subir: o funil tem que completar.

## §2. Os eventos

Nomear por **etapa do funil**, não por elemento de tela. `gate_visto` sobrevive a uma
troca de layout; `clique_botao_azul` não.

| Evento | Quando |
| --- | --- |
| `form_iniciado` | primeiro clique real |
| `pergunta_respondida` | a cada passo, **com o número do passo** |
| `gate_visto` | chegou no formulário de contato |
| `generate_lead` | passou no formulário, dados válidos |
| `lead_capturado` | idem, com o recorte do negócio |
| `resultado_visto` | entregou o que prometeu |
| `whatsapp_clicado` | fim do funil |

**`generate_lead` é nome padrão do GA4.** Usar o nome padrão faz o evento entrar nos
relatórios de conversão e ser importável pelo Google Ads sem configuração extra.

**O número do passo é o item mais valioso da lista.** É ele que responde em qual pergunta
as pessoas desistem. Sem ele, encurtar ou alongar o formulário é chute.

## §3. No painel do GA4

### §3.1 As dimensões personalizadas

*Administrador › Definições personalizadas › Criar*, escopo **Evento**, um registro por
parâmetro. O nome da dimensão é rótulo e aceita acento; **o parâmetro tem que bater letra
por letra** com o que a página manda.

O campo do parâmetro **é editável** depois de criada — se errar, corrija, não arquive.

O campo só lista parâmetros que o GA já recebeu. Antes do primeiro disparo, digite o nome
e selecione a opção que aparecer. Se não aceitar, faça a Fase 3 e volte.

### §3.2 Retenção

*Administrador › Retenção de dados* → **14 meses**. O padrão do GA4 gratuito é 2 meses e
é **irreversível**: passado o prazo, o dado detalhado some.

### §3.3 Tráfego interno

*Coleta de dados › Definir tráfego interno* (registre o IP), depois *Filtros de dados* →
mude de **Teste** para **Ativo**. Sem escritório com IP fixo, pule e teste em aba anônima.

### §3.4 Por que o Tempo real "esconde" eventos

O relatório de Tempo real mostra **os últimos 30 minutos**. Se a página ficou aberta
enquanto você configurava, os eventos do começo do funil já saíram da janela e parece que
não dispararam. Não é erro. Confirme no relatório processado no dia seguinte.

### §3.5 Marcar os principais eventos

Aba *Eventos recentes* → **estrela** ao lado do nome.

O evento só entra nessa lista depois de **processado**, o que leva **até 24 horas** — e
não há atalho. Não trave a subida por isso: o GA continua gravando, e a marcação vale a
partir do momento em que você marcar.

### §3.6 Isolar a LP quando ela divide propriedade com o site

```js
gtag('config', GA_ID, { content_group: 'Nome da LP' });
```

`content_group` é dimensão **nativa**: não precisa registrar (ao contrário da §3.1) e já
serve de comparação em qualquer relatório.

Fluxo separado só resolve separação de acesso ou cobrança, e custa a jornada de quem vê a
LP e depois navega para o site principal: viram duas visitas de duas origens.

## §4. Meta

### §4.1 Pixel direto ou via GTM

**GTM não mede nada** — é um contêiner onde se instalam outras tags. Para Meta, o que
mede é o Pixel, com ou sem GTM.

| | Pixel direto | Via GTM |
| --- | --- | --- |
| Tag nova | commit + deploy | painel |
| Quem pode mudar | quem tem o repositório | quem tem o GTM |
| Peso | ~2 KB | ~100 KB |

**Deploy automático (como aqui) → pixel direto**, versionado junto com os testes.
**LP que não é sua** (WordPress de cliente, agência sem acesso ao código) → GTM.

### §4.2 Um pixel por marca, nunca por LP

Pixel por página fragmenta o aprendizado do algoritmo e parte os públicos: retargeting de
quem abandonou e lookalike de quem converteu passam a existir em pedaços pequenos demais
para funcionar.

### §4.3 Os eventos do Pixel

Nomes **padrão da Meta**, senão não dá para otimizar campanha por eles:

| Momento | Meta | GA4 |
| --- | --- | --- |
| carregou | `PageView` | `page_view` |
| passou no formulário | `Lead` | `generate_lead` |
| clicou no WhatsApp | `Contact` | `whatsapp_clicado` |

### §4.4 Correspondência avançada

O `fbevents.js` normaliza e aplica SHA-256 **no navegador**: o número em claro não sai da
página. Dois detalhes separam funcionar de não funcionar:

```js
// 1. Com o código do país. Sem o 55, a Meta não casa o contato.
fbq('init', PIXEL_ID, {ph: '55' + telefoneSoDigitos});
// 2. E antes do evento, senão o Lead sai sem o contato.
fbq('track', 'Lead');
```

> **É decisão de negócio.** Dado pessoal indo para um terceiro, ainda que hasheado. Só
> ligue com a política de privacidade cobrindo isso.

### §4.5 Verificar o domínio

*Configurações do negócio › Segurança da marca › Domínios*, **por DNS**. DNS vale para o
domínio inteiro e todos os subdomínios, então cobre qualquer LP futura sem mexer em código.

Sem isso, a atribuição em tráfego iOS fica capada — e iPhone é boa parte do público de
clínica.

### §4.6 A convenção de UTM

Nenhum relatório de canal sobrevive a UTM inconsistente. E convenção escrita numa planilha
não funciona, porque depende de alguém consultar e digitar certo.

**O mecanismo que funciona:** parâmetros dinâmicos da Meta, colados uma vez no
Gerenciador de Anúncios, **no nível do anúncio**, campo *Parâmetros de URL do site*:

```
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

Os `{{...}}` preenchem sozinhos. **Ninguém digita, ninguém erra.** O link de destino fica
limpo: UTM no campo do link **e** no de parâmetros duplica.

**A metade esquecida:** como `{{campaign.name}}` traz o nome real, **o nome da campanha
vira o dado do relatório**. "Campanha Avaliação – Set/26" chega ao GA4 como
`Campanha%20Avalia%C3%A7%C3%A3o%20%E2%80%93%20Set%2F26`. Então nomear sem acento, sem
espaço (hífen) e sem barra é parte da convenção, não estética:
`avaliacao-orcamento-parado-set26`.

Links que não são de anúncio (bio, prospecção) alguém digita: use
`ferramentas/gerador-de-links.html`, que normaliza acento, maiúscula e espaço.

### §4.7 O que não fazer no começo

**Priorização de eventos agregados (AEM).** Na conta da Genos, em 09/09/2026, essa tela
não existe — a Meta vem migrando para automática. Procure uma vez; se não achar, siga em
frente. `Lead` e `Contact` são padrão e a Meta prioriza sozinha.

**API de Conversões.** O gatilho é começar a ver *muito lead ruim*, não a subida da LP.
Sem volume a Meta não aprende com esses eventos e vira complexidade sem retorno. Quando
chegar a hora, o script que grava o lead na planilha já roda no servidor e já recebe todo
lead: é o lugar natural.

**Importar o custo da Meta para o GA4** (*Administrador › Conexões com a Meta*). Traz
custo por lead para dentro do GA4, mas depende inteiramente da §4.6 — sem UTM
disciplinada o custo cola na campanha errada, o que é pior que não ter custo.

**Nas Configurações do conjunto de dados, o que vale conferir:** *Eventos automáticos* e
*Rastrear eventos sem código* **desativados** (ligados, a IA cria eventos a partir de
texto de botão e polui a lista de conversões), e *Correspondência automática de site*
**ativada** (convive com a manual).

## §5. Search Console

Não substitui o Analytics e não mede anúncio. Mostra a busca orgânica: termo, impressão,
posição, e problema de indexação — que o GA4 nunca mostra. Para LP de tráfego pago o valor
é baixo, mas o custo é zero.

**Propriedade de Domínio, não de URL:** cobre todos os subdomínios e todas as LPs futuras
de uma vez. Por URL teria que ser refeita a cada página.

Depois de vincular ao GA4, **publique a coleção**: *Relatórios › Biblioteca › card
"Search Console" › ⋮ › Publicar*. Sem isso o vínculo existe e nenhum relatório aparece.

Os dados levam 2 a 3 dias e **não são retroativos** — verificar cedo é o único jeito de
ter histórico.

**Indexar a LP?** Sem `noindex` ela vai para o índice, e para LP de funil isso costuma ser
bom. Só bloqueie se a oferta não puder vazar ou se competir com uma página principal.

## §6. O que dá para automatizar

Repetir a Fase 2 à mão em cada cliente é onde o padrão se perde: funciona nos três
primeiros e falha no décimo. A **Analytics Admin API** cria propriedade e fluxo, registra
as dimensões, marca os principais eventos e ajusta retenção, moeda e fuso — por comando.

O ganho maior não é tempo: é que ninguém mais digita nome de parâmetro na mão.
