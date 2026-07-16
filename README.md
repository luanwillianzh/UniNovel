# UniNovel

Leitor de novels universal com suporte a multiplas fontes. Busque, leia e baixa novels no formato EPUB.

## Fontes Integradas

| Fonte | URL |
|-------|-----|
| Central Novel | centralnovel.com |
| Illusia | illusia.com.br |
| Novel Mania | novelmania.com.br |

## Funcionalidades

- **Busca unificada** — pesquisa em todas as fontes simultaneamente
- **Leitor de capitulos** — leitura limpa com tipografia serifada
- **Download EPUB** — exporte novels completos com cover e capitulos
- **Favoritos** — salve ate 50 novels nos favoritos (localStorage)
- **Historico** — continua de onde parou, ate 20 entradas
- **Ordem de capitulos** — inverta a ordem (mais antigo/mais recente)
- **Dark/Light mode** — respeita a preferencia do sistema, salva em localStorage
- **PWA** — funciona offline, instalavel na tela inicial
- **Easter egg** — busque "Praise the fool" ;)

## Arquitetura

```
UniNovel/
├── index.html              # Pagina principal
├── manifest.json           # PWA manifest
├── service-worker.js       # Cache offline
├── favicon.ico
├── css/
│   └── app.css             # Estilos customizados
├── js/
│   └── app.js              # Controller principal (App)
├── lib/
│   ├── base.js             # NovelBase — proxy, fetch, helpers
│   ├── central.js          # CentralSource — scraping centralnovel.com
│   ├── illusia.js          # IllusiaSource — scraping illusia.com.br
│   ├── mania.js            # ManiaSource — scraping novelmania.com.br
│   ├── api.js              # NovelApi — API unificada (Object.assign)
│   └── epub.js             # EpubDownloader — geracao de EPUB via JSZip
└── icons/
    └── icon-*.png          # Icones PWA (72 a 512px)
```

### Padrao de Heranca

Nao utiliza `extends`. Sources sao plain objects combinados via `Object.assign`:

```js
const NovelApi = Object.assign({}, NovelBase, CentralSource, IllusiaSource, ManiaSource, { ... });
```

### Proxy

Requisicoes passam por um proxy CORS:

```
https://relaxed-churros-9a35ea.netlify.app/?destination=
```

## Stack

- **Frontend:** HTML + Tailwind CSS (CDN) + JavaScript vanilla
- **EPUB:** JSZip (CDN)
- **Fontes:** Inter (sans) + Merriweather (serif) via Google Fonts
- **PWA:** Service Worker + Web App Manifest

## Como Usar

Abra `index.html` no navegador ou hospede em qualquer servidor estatico (GitHub Pages, Netlify, Vercel, etc).

```bash
# Localmente com Python
python3 -m http.server 8000

# Ou com Node
npx serve .
```

## Licenso

Todos os direitos dos conteudos pertencem aos respectivos sites de origem.
