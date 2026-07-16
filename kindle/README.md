# UniNovel - Kindle Edition

Versão adaptada do UniNovel para o Navegador Experimental do Kindle.

## Limitações do Kindle

O navegador experimental do Kindle tem limitações significativas:

### JavaScript
- **ES5 apenas** (sem ES6+)
- **Sem `fetch()`** - usa `XMLHttpRequest`
- **Sem `async/await`** - usa callbacks
- **Sem arrow functions** - usa `function(){}`
- **Sem template literals** - usa concatenação de strings
- **Sem `const`/`let`** - usa `var`
- **Sem classes** - usa functions/prototypes

### CSS
- **Sem Flexbox** - usa floats
- **Sem Grid** - usa floats/table layout
- **Sem `position: sticky`** - usa `position: static`
- **Sem CSS variables**
- **Design em preto e branco** para e-ink

### Storage
- **`localStorage` funciona** mas pode ser limitado à sessão

## Funcionalidades

- **Busca unificada** - pesquisa em todas as fontes
- **Leitor de capítulos** - leitura otimizada para e-ink
- **Favoritos** - salve até 50 novels
- **Histórico** - continua de onde parou
- **Design para e-ink** - alto contraste, fontes legíveis

## Como Usar

1. Copie a pasta `kindle/` para o Kindle
2. Acesse `index.html` pelo navegador do Kindle
3. Use a busca para encontrar novels
4. Clique em uma novel para ver detalhes
5. Clique em um capítulo para ler

## Estrutura

```
kindle/
├── index.html          # Página principal (CSS inline)
├── app.js              # Controller principal (ES5)
└── lib/
    ├── base.js         # Proxy e helpers (XHR)
    ├── central.js      # Central Novel (callbacks)
    ├── illusia.js      # Illusia (callbacks)
    ├── mania.js        # Novel Mania (callbacks)
    └── api.js          # API unificada (callbacks)
```

## Fontes Integradas

| Fonte | URL |
|-------|-----|
| Central Novel | centralnovel.com |
| Illusia | illusia.com.br |
| Novel Mania | novelmania.com.br |

## Notas Técnicas

- Usa proxy CORS via Netlify
- CSS inline para evitar problemas de carregamento
- Sem dependências externas (CDN)
- Sem Service Worker/PWA
- Layout responsivo com floats (não flexbox)
- Design otimizado para tela e-ink (preto e branco)

## Licença

Todos os direitos dos conteúdos pertencem aos respectivos sites de origem.
