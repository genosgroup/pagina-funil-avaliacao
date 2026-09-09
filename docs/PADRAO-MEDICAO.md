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
| `og:image` (1200×630) | **Sem ela o link é compartilhado sem imagem.** Numa LP que vai para anúncio e bio, isso derruba clique. |
| `twitter:card` | Alguns apps leem esta em vez das `og:`. |
| `<link rel="canonical">` | Ver o bloco do SPA, abaixo. |
| ID de medição do GA4 numa constante só | Uma linha para ligar, uma linha para desligar, um lugar para procurar. |

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

### Os eventos do Pixel

Espelhar os do GA4, usando os **nomes padrão do Meta**, senão não dá para otimizar
campanha por eles:

| Momento | Evento do Meta |
| --- | --- |
| carregou | `PageView` |
| passou no formulário | `Lead` |
| clicou no WhatsApp | `Contact` |

### O que de fato recupera sinal: a API de Conversões

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
- [ ] Pixel com `PageView`, `Lead` e `Contact`
- [ ] Decisão registrada sobre correspondência avançada e LGPD

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
