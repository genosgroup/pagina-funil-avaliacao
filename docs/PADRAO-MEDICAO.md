# Padrão de medição para LPs · Genos

O que precisa estar de pé para uma landing page medir direito, e por quê. Nasceu do
funil AVALIAÇÃO e serve de base para as próximas, da Genos e de cliente.

A ordem importa: cada bloco depende do anterior.

---

## 1. Na página

| Item | Por quê |
| --- | --- |
| `<title>` e `<meta name="description">` | Título é o que aparece no relatório do GA e na aba. Sem ele, "Documento sem título". |
| `og:title`, `og:description`, `og:url`, `og:type`, `og:locale` | É o card que aparece quando o link é colado no WhatsApp, no direct e no anúncio. |
| `og:image` (1200×630) | **Sem ela o link é compartilhado sem imagem.** Numa LP que vai para anúncio e bio, isso derruba clique. Ver a nota abaixo. |
| `twitter:card` | Alguns apps leem esta em vez das `og:`. |
| `<link rel="canonical">` | Ver o bloco do SPA, abaixo. |
| ID de medição do GA4 numa constante só | Uma linha para ligar, uma linha para desligar, um lugar para procurar. |

### A `og:image` é a única exceção ao arquivo único

`og:image` **não aceita caminho relativo nem data URI**: precisa de URL absoluta, num
arquivo à parte servido pelo mesmo domínio. É por isso que o favicon pode viver embutido
em base64 e ela não.

Gerar a imagem a partir do HTML da própria LP, com os mesmos tokens de cor e a mesma
tipografia, sai mais rápido do que pedir arte e garante que o card não pareça de outro
produto. Nesta página é `public/og.png`, montada com a chamada, o subtítulo, a marca e
a URL.

Declare também `og:image:width`, `og:image:height` e `og:image:alt`: sem as dimensões,
alguns clientes de mensagem baixam a imagem antes de decidir o layout do card, e o
card pisca ou aparece cortado.

### A armadilha do `single-page-application`

O Worker serve esta LP com `not_found_handling: "single-page-application"`, de
propósito: um caractere a mais no fim de um link de anúncio não pode virar 404.

O efeito colateral é que **qualquer caminho devolve a página**. Sem tratamento,
`/avaliacao`, `/avaliacao/`, `/AVALIACAO` e `/avaliaca` viram **quatro páginas
distintas** no relatório, e o volume real se fragmenta em quatro linhas.

São dois consertos, um para cada lado:

```html
<!-- buscador -->
<link rel="canonical" href="https://clinicas.genosgroup.com.br/avaliacao">
```

```js
// medição
gtag('config', GA_ID, {
  page_location: location.origin + '/avaliacao' + location.search
});
```

**O `location.search` não é opcional.** Sem ele a query string some e as UTMs vão
junto, o que apaga a atribuição de campanha inteira. Foi verificado: seis caminhos
diferentes colapsam num só, e o link com UTM preserva a query.

### Métrica não pode quebrar tela

Todo disparo passa por uma função única que engole erro:

```js
function evento(nome, dados){
  try { if (GA_ID) gtag('event', nome, dados || {}); } catch(e){}
}
```

Com o Analytics desligado, ou com o `gtag.js` barrado por bloqueador de anúncio, isso
vira no-op. **Não é zelo teórico:** esta página já perdeu lead em produção por um erro
de JavaScript que ninguém viu, porque o envio tinha um `.catch(()=>{})` mudo.

Vale testar a LP com o `gtag.js` bloqueado antes de subir. O funil tem que completar.

---

## 2. Os eventos

Nomear por **etapa do funil**, não por elemento de tela. `gate_visto` sobrevive a uma
troca de layout; `clique_botao_azul` não.

O conjunto mínimo de uma LP de captura:

| Evento | Quando |
| --- | --- |
| `diagnostico_iniciado` (ou `form_iniciado`) | primeiro clique real |
| `pergunta_respondida` | a cada passo, **com o número do passo** |
| `gate_visto` | chegou no formulário de contato |
| `generate_lead` | passou no formulário, dados válidos |
| `lead_capturado` | idem, com o recorte do negócio |
| `resultado_visto` | entregou o que prometeu |
| `whatsapp_clicado` | fim do funil |

**`generate_lead` é nome padrão do GA4.** Usar o nome padrão faz o evento entrar nos
relatórios de conversão e ser importável pelo Google Ads sem configuração extra.
Inventar um nome próprio para a mesma coisa custa esse encaixe.

**O número do passo é o item mais valioso da lista.** É ele que responde em qual
pergunta as pessoas desistem. Sem ele, encurtar ou alongar o formulário é chute.

---

## 3. No painel do GA4

Estes quatro não têm como ser feitos por código. Sem eles, metade do que a página manda
não aparece em lugar nenhum.

### 3.1 Registrar as dimensões personalizadas ← o mais esquecido

*Administrador › Definições personalizadas › Criar dimensão personalizada*, escopo
**Evento**. O nome do parâmetro tem que bater **exatamente** com o que a página manda.

Para esta LP: `ordem`, `pergunta`, `resposta`, `saida`, `gargalo`, `diagnostico`,
`sistema`.

> **Parâmetro não registrado não aparece no relatório.** O dado chega, é armazenado, e
> fica invisível. Pior: **não é retroativo** — só passa a aparecer a partir do registro.
> Registrar no dia um custa dois minutos; descobrir isso em três meses custa três meses.

**O parâmetro é a única parte que não pode errar.** O nome e a descrição da dimensão
são rótulo de relatório e aceitam acento; o parâmetro tem que bater letra por letra com
o que a página manda. O erro clássico em português é digitar o certo: cadastrar `saída`
e `diagnóstico` quando a página envia `saida` e `diagnostico`. O GA aceita sem
reclamar — para ele é só texto — e a dimensão fica existindo e sempre vazia, que é pior
do que não existir, porque parece que o dado não está chegando.

Se acontecer, **abra a dimensão e corrija o parâmetro**: o campo é editável depois de
criada. Não precisa arquivar e recriar.

Teto de 50 dimensões de escopo evento. Não registre o que não vai olhar.

### 3.2 Marcar os principais eventos (conversões)

*Administrador › Eventos* → chave **Marcar como principal evento** em `generate_lead`
e `whatsapp_clicado`.

O evento precisa ter chegado **pelo menos uma vez** para aparecer nessa lista. Ou seja:
faça um preenchimento de teste antes de tentar marcar.

### 3.3 Retenção de dados

*Administrador › Retenção de dados* → **14 meses**. O padrão do GA4 gratuito é
**2 meses**, e é irreversível: passado o prazo, o dado detalhado some. Não dá para
comparar com o mesmo mês do ano anterior com 2 meses de retenção.

### 3.4 Excluir o tráfego interno

*Administrador › Coleta de dados › Definir tráfego interno* (registre o IP do
escritório), depois *Filtros de dados* → mude o filtro de **Testes** para **Ativo**.

Enquanto o filtro estiver em "Testes" ele não filtra nada. É a pegadinha clássica.

Sem isso, cada teste de vocês entra como lead e a taxa de conversão mente.

### 3.5 Isolar a LP quando ela divide propriedade com o site

Quando a LP vive num subdomínio do site principal, os dados caem no mesmo fluxo.
Marque a página na origem:

```js
gtag('config', GA_ID, { content_group: 'Nome da LP' });
```

`content_group` é dimensão **nativa** — não precisa registrar (ao contrário do 3.1) e
já serve de comparação em qualquer relatório.

Fluxo separado só resolve separação de acesso ou cobrança, e custa a jornada de quem vê
a LP e depois navega para o site principal: viram duas visitas de duas origens.

---

## 4. Tráfego pago no Meta

**GTM não mede nada.** É um gerenciador de tags: um contêiner onde se instalam outras
tags. Para Meta, o que mede é o **Pixel**, e ele pode ser instalado com ou sem GTM.

### Pixel direto ou via GTM

| | Pixel direto no HTML | Via GTM |
| --- | --- | --- |
| Ligar um pixel novo | commit + deploy | painel, sem tocar em código |
| Quem pode mudar | quem tem acesso ao repositório | quem tem acesso ao GTM |
| Rastro | fica no histórico do git | fica no histórico do GTM |
| Peso | ~2 KB | ~100 KB de contêiner |
| Depurar | ler o arquivo | seguir camadas até a tag |

**Quando o deploy é automático (como aqui), pixel direto ganha:** subir uma tag nova
custa um commit e trinta segundos, e fica versionado junto com os testes.

**GTM ganha quando a LP não é sua:** site de cliente em WordPress, agência sem acesso
ao código, ou várias tags entrando e saindo por campanha. Aí o custo de pedir deploy a
cada tag supera o peso do contêiner.

### Um pixel por marca, nunca por landing page

Todas as LPs da Genos entram no **mesmo pixel**. Pixel por página fragmenta o
aprendizado do algoritmo e, pior, parte os públicos: retargeting de quem abandonou no
meio e lookalike de quem converteu passam a existir em pedaços pequenos demais para
funcionar.

### Os eventos do Pixel

Espelhar os do GA4, usando os **nomes padrão do Meta**, senão não dá para otimizar
campanha por eles:

| Momento | Evento do Meta | Evento equivalente no GA4 |
| --- | --- | --- |
| carregou | `PageView` | `page_view` |
| passou no formulário | `Lead` | `generate_lead` |
| clicou no WhatsApp | `Contact` | `whatsapp_clicado` |

### Correspondência avançada

Manda o telefone do lead junto com o evento, o que melhora bastante atribuição e
qualidade de público. O `fbevents.js` normaliza e aplica SHA-256 **no navegador**: o
número em claro não sai da página.

Dois detalhes que fazem a diferença entre funcionar e não funcionar:

```js
// 1. O telefone precisa do código do país. Sem o 55, a Meta não casa o contato.
fbq('init', PIXEL_ID, {ph: '55' + telefoneSoDigitos});
// 2. E precisa vir ANTES do evento, senão o Lead sai sem o contato.
fbq('track', 'Lead');
```

Reinicializar o pixel com o dado do usuário no meio do fluxo é o padrão da Meta para
quando o contato só existe depois de um formulário.

> **É decisão de negócio, não técnica.** É dado pessoal saindo da página para um
> terceiro, ainda que hasheado. Só ligue com a política de privacidade cobrindo isso.
> Nesta página está ligado, por decisão do Genos em 09/09/2026.

### Verificar o domínio no Meta Business

*Configurações do negócio › Segurança da marca › Domínios*, *por DNS*. Sem isso a
atribuição em tráfego iOS fica capada, e iPhone é boa parte do público de clínica.

Verifique por **DNS e não por meta-tag**: DNS vale para o domínio inteiro e todos os
subdomínios, então cobre qualquer LP futura sem mexer em código de novo.

### Priorizar os eventos (AEM) — pode não existir mais, e tudo bem

A ideia: a Meta só considera **8 eventos por domínio** em tráfego iOS, em ordem de
prioridade, e `Lead` tem que ser o primeiro porque é o que a campanha otimiza.

**Na conta da Genos, em 09/09/2026, essa tela não existe.** Procuramos na aba
Configurações do conjunto de dados e no menu do Gerenciador de Eventos: não há seção de
mensuração de eventos agregados. A Meta vem migrando essa priorização para automática.

Então a regra é: **procure uma vez, e se não achar, siga em frente.** `Lead` e `Contact`
são eventos padrão e a Meta os prioriza sozinha. Isto não bloqueia campanha nem
atribuição. Não vale gastar meia hora caçando a tela em cada cliente.

Se existir na conta, a ordem é `Lead`, `Contact`, `PageView`, e só dá para priorizar
evento que já disparou pelo menos uma vez.

### Conferir no lugar do AEM

O que **de fato** vale checar nas Configurações do conjunto de dados:

- **Eventos automáticos** e **Rastrear eventos sem código**: deixe **desativados**.
  Ligados, a IA da Meta cria eventos a partir de texto de botão, e eles poluem a lista
  de conversões com coisa que ninguém definiu nem documentou.
- **Correspondência automática de site**: deixe **ativada**. Ela convive com a
  correspondência manual do código, que é a mais confiável por usar o dado digitado.

### O que de fato recupera sinal: a API de Conversões

**Quando fazer:** não na subida da LP. O gatilho é começar a ver *muito lead ruim* nas
campanhas — é exatamente esse o problema que a CAPI de CRM resolve, mandando de volta o
que aconteceu depois do formulário (qualificou, agendou, fechou) para a campanha
otimizar por paciente e não por preenchimento. Antes de existir volume, a Meta não tem
como aprender com esses eventos, e a integração vira complexidade sem retorno.


O Pixel roda no navegador e é bloqueado por iOS, por bloqueador de anúncio e por
navegador com proteção de rastreamento. **A CAPI manda o evento do servidor**, e é o
que recupera o sinal perdido.

Nesta arquitetura existe um lugar quase pronto para isso: **o Apps Script que grava o
lead já roda no servidor e já recebe todo lead**. Um `UrlFetchApp` para a CAPI, com o
telefone hasheado, fecha o ciclo sem infraestrutura nova. É o próximo passo natural
quando o volume justificar.

> **Antes de mandar telefone ou e-mail para o Meta**, mesmo hasheado, decida se a
> política de privacidade cobre isso. É LGPD, não detalhe técnico.

---

### A convenção de UTM ← isto vale mais que a ferramenta

Nenhum relatório de canal sobrevive a UTM inconsistente. Se um anúncio chega como
`utm_source=instagram`, outro como `ig` e outro como `meta`, o mesmo canal vira três
linhas e nenhuma soma bate.

A convenção da Genos:

| Parâmetro | Valor | Por quê |
| --- | --- | --- |
| `utm_source` | `{{site_source_name}}` | parâmetro dinâmico da Meta; devolve `fb`, `ig`, `msg`, `an` sozinho, sem ninguém digitar |
| `utm_medium` | `paid_social` | constante, sempre |
| `utm_campaign` | nome da campanha | |
| `utm_content` | a variação do criativo | é o que permite comparar criativo |

#### Como aplicar, sem depender de ninguém lembrar

No Gerenciador de Anúncios, **no nível do anúncio** (não da campanha), seção
*Rastreamento* → campo **"Parâmetros de URL do site"**. Cole sempre isto:

```
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

Os `{{...}}` são parâmetros dinâmicos da Meta: preenchem sozinhos, com o valor real.
**Ninguém digita nada, então ninguém erra.** É por isso que esta convenção funciona e
uma planilha de "combinados de UTM" não.

O link de destino fica limpo, só `https://.../avaliacao`. UTM no campo do link **e** no
de parâmetros duplica os dois.

#### A metade que quase todo mundo esquece: o nome da campanha

Como `{{campaign.name}}` traz o nome real, **o nome da campanha vira o dado do
relatório**. "Campanha Avaliação – Set/26" chega ao GA4 como
`Campanha%20Avalia%C3%A7%C3%A3o%20%E2%80%93%20Set%2F26`.

Então a convenção de nomes é parte da convenção de UTM, não um detalhe estético:

- sem acento, sem espaço (use hífen), sem barra, e-comercial ou travessão
- exemplo: `avaliacao-orcamento-parado-set26`, criativo `criativo-dor-a`

#### Links que não são de anúncio

Bio, prospecção, WhatsApp: não há parâmetro dinâmico e alguém digita. Use
`ferramentas/gerador-de-links.html`, que normaliza acento, maiúscula e espaço.

### Importar o custo da Meta para dentro do GA4

*Administrador › Conexões com a Meta › Criar fonte de dados*. Traz custo, cliques e
impressões, que é o que permite ver **custo por lead por campanha dentro do GA4** — sem
isso o GA4 mostra o lead e não mostra quanto ele custou.

Depende inteiramente da convenção acima: a própria tela avisa que exige um valor
constante de `utm_source` e `utm_medium` por plataforma de publisher. Sem disciplina de
UTM, o custo cola na campanha errada, o que é pior do que não ter custo nenhum.

---

## 5. Search Console

**Não substitui o Analytics, e não mede anúncio.** Ele mostra o que acontece na busca
orgânica do Google: qual termo trouxe, quantas vezes apareceu, posição média, e quais
páginas o Google conseguiu ou não indexar.

Para uma LP que só recebe tráfego pago, o valor é baixo — mas o custo é zero e ele
avisa de problema de indexação que o Analytics nunca mostra.

**Configure no domínio, não na página.** Uma propriedade de domínio
(`genosgroup.com.br`, via registro DNS) cobre todos os subdomínios e todas as LPs de
uma vez, para sempre. Uma propriedade por URL teria que ser refeita a cada LP.

Depois, ligue Search Console ao GA4 em *Administrador › Vínculos de produtos › Search
Console*, para os dados de busca aparecerem dentro do GA.

### Indexar a LP ou não?

Sem `noindex`, ela vai para o índice. Para uma LP de funil isso normalmente é bom:
tráfego orgânico de graça. Só use `noindex` se a página tiver oferta que não pode
vazar, ou se competir com uma página principal pelo mesmo termo.

Se usar, a canônica da seção 1 continua obrigatória.

---

## 6. Checagem antes de subir uma LP nova

**Na página**
- [ ] `title`, `description`, as `og:` (com `og:image` de 1200×630) e `twitter:card`
- [ ] `canonical` apontando para a URL final
- [ ] `page_location` normalizado, **preservando `location.search`**
- [ ] `content_group` definido
- [ ] Eventos nomeados por etapa, com `generate_lead` entre eles
- [ ] Passo numerado no evento de cada pergunta
- [ ] Todo disparo dentro de um `try/catch`
- [ ] **Funil completo com o `gtag.js` bloqueado**

**No GA4**
- [ ] Dimensões personalizadas registradas, com o nome exato do parâmetro
- [ ] `generate_lead` e o evento de contato marcados como principais
- [ ] Retenção em 14 meses
- [ ] Tráfego interno definido **e o filtro em Ativo, não em Testes**
- [ ] Moeda e fuso corretos (Real, São Paulo)

**No Meta, se houver tráfego pago**
- [ ] Pixel da marca (não da LP) com `PageView`, `Lead` e `Contact`
- [ ] Decisão registrada sobre correspondência avançada e LGPD
- [ ] Telefone com DDI, e o `init` com o contato **antes** do evento `Lead`
- [ ] Domínio verificado por DNS
- [ ] Eventos priorizados, com `Lead` em primeiro
- [ ] Convenção de UTM combinada com quem sobe as campanhas
- [ ] **Funil completo com o `fbevents.js` bloqueado**

**Uma vez por domínio**
- [ ] Search Console como propriedade de **domínio**
- [ ] Search Console vinculado ao GA4

**Depois de subir**
- [ ] Um preenchimento real, conferindo tempo real no GA4 **e** a linha na planilha
- [ ] Marcar os principais eventos (só aparecem depois do primeiro disparo)
- [ ] Apagar as linhas de teste

---

## 7. O que dá para automatizar

Repetir a seção 3 à mão em cada cliente é onde o padrão se perde. A **Analytics Admin
API** faz tudo aquilo por código: criar propriedade e fluxo, registrar as dimensões,
marcar os principais eventos e ajustar retenção, moeda e fuso.

Um script de provisionamento transforma "lembrar de 12 cliques" em "rodar um comando",
e é a única forma de o padrão sobreviver ao décimo cliente. O `README.md` deste
repositório aponta onde ele deve morar quando existir.
