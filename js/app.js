(() => {
  const $ = (id) => document.getElementById(id);

  class App {
    constructor() {
      this.api = NovelApi;
      this.epubDownloader = new EpubDownloader(this.api);
      this.currentNovelId = null;
      this.currentNovelInfo = null;
      this.chaptersReversed = false;
      this.history = JSON.parse(localStorage.getItem('uninovel_history') || '[]');
      this.favorites = JSON.parse(localStorage.getItem('uninovel_favorites') || '[]');

      this.views = { home: $('view-home'), details: $('view-details'), reader: $('view-reader') };

      $('search-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.search(); });

      this.loadReleases();
    }

    /* ---- theme ---- */
    toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('uninovel_theme', isDark ? 'dark' : 'light');
    }

    /* ---- navigation ---- */
    showView(name) {
      Object.values(this.views).forEach(v => v.classList.add('hidden'));
      this.views[name].classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleLoader(on) { $('loader').classList.toggle('hidden', !on); }
    goBack() { this.showView('home'); this.renderHistory(); this.renderFavorites(); }
    goBackToDetails() { this.currentNovelId ? this.showView('details') : this.goHome(); }
    goHome() { $('search-input').value = ''; $('home-title').textContent = 'Lancamentos'; this.loadReleases(); this.renderFavorites(); }

    /* ---- data fetching ---- */
    async loadReleases() {
      this.showView('home');
      this.renderHistory();
      this.renderFavorites();
      $('novel-list').innerHTML = '';
      this.toggleLoader(true);
      try {
        this.renderGrid(await this.api.lancamentosAll(), 'novel-list');
      } catch (e) {
        console.error(e);
        $('novel-list').innerHTML = `<div class="col-span-full text-center py-16 text-ink-400 dark:text-ink-500">Erro de rede.</div>`;
      } finally { this.toggleLoader(false); }
    }

    async search() {
      const q = $('search-input').value.trim();
      if (!q) return;
      if (q.toLowerCase() === 'praise the fool') { this.showEasterEgg(); return; }
      this.showView('home');
      $('home-title').textContent = `Resultados: "${q}"`;
      $('novel-list').innerHTML = '';
      $('history-section').classList.add('hidden');
      this.toggleLoader(true);
      try { this.renderGrid(await this.api.searchAll(q), 'novel-list'); }
      catch (e) { console.error(e); }
      finally { this.toggleLoader(false); }
    }

    /* ---- rendering ---- */
    renderGrid(novels, containerId) {
      const c = $(containerId);
      const seen = new Set();
      const unique = novels.filter(n => { if (seen.has(n.url)) return false; seen.add(n.url); return true; });

      if (!unique.length) {
        c.innerHTML = `<div class="col-span-full text-center py-16 text-ink-400 dark:text-ink-500">Nenhum resultado encontrado.</div>`;
        return;
      }

      const badge = (s) => s === 'central' ? 'bg-red-500/90' : s === 'illusia' ? 'bg-sky-500/90' : 'bg-emerald-500/90';

      c.innerHTML = unique.map(n => `
        <div class="card-hover rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800/50 cursor-pointer flex flex-col transition-colors"
             onclick="app.openNovel('${n.url}')">
          <div class="relative">
            <img src="${n.cover}" loading="lazy" class="w-full aspect-[3/4] object-cover bg-ink-100 dark:bg-ink-800"
              onerror="this.src='https://via.placeholder.com/300x400?text=Sem+Capa'" />
            <span class="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg ${badge(n.source)} text-white/95 backdrop-blur-sm">${n.source}</span>
          </div>
          <div class="p-3 flex-1 flex items-end">
            <h3 class="text-sm font-medium text-ink-800 dark:text-ink-200 line-clamp-2 leading-snug transition-colors">${n.nome}</h3>
          </div>
        </div>`).join('');
    }

    renderHistory() {
      const c = $('history-list');
      const s = $('history-section');
      if (!this.history.length) { s.classList.add('hidden'); return; }
      s.classList.remove('hidden');

      const badge = (src) => src === 'central' ? 'bg-red-500/90' : src === 'illusia' ? 'bg-sky-500/90' : 'bg-emerald-500/90';

      c.innerHTML = this.history.map(h => `
        <div class="card-hover rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800/50 cursor-pointer flex gap-0 transition-colors"
             onclick="app.readChapter('${h.id}','${h.chapterId}')">
          <img src="${h.cover}" loading="lazy" class="w-24 h-full object-cover bg-ink-100 dark:bg-ink-800 flex-shrink-0"
            onerror="this.src='https://via.placeholder.com/100'" />
          <div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
            <span class="inline-block self-start px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${badge(h.source)} text-white/90 mb-1.5">${h.source}</span>
            <h3 class="text-sm font-medium text-ink-800 dark:text-ink-200 truncate transition-colors">${h.title}</h3>
            <p class="text-xs text-brand-500 dark:text-brand-400 mt-1 truncate font-medium">&blacktriangleright; ${h.chapterTitle || 'Continuar'}</p>
          </div>
        </div>`).join('');
    }

    /* ---- favorites ---- */
    isFavorite(id) { return this.favorites.some(f => f.id === id); }

    toggleFavorite(id) {
      if (this.isFavorite(id)) {
        this.favorites = this.favorites.filter(f => f.id !== id);
      } else {
        const info = this.currentNovelInfo;
        const old = this.history.find(h => h.id === id);
        this.favorites.unshift({
          id,
          title: info?.nome || old?.title || 'Unknown',
          cover: info?.cover || old?.cover || '',
          source: id.split('-')[0],
        });
        if (this.favorites.length > 50) this.favorites.pop();
      }
      localStorage.setItem('uninovel_favorites', JSON.stringify(this.favorites));
      this.renderFavorites();
      ['fav-btn', 'fav-btn-cover'].forEach(btnId => {
        const btn = $(btnId);
        if (btn) this._updateFavBtn(btn, id);
      });
    }

    _updateFavBtn(btn, id) {
      const active = this.isFavorite(id);
      const isCover = btn.id === 'fav-btn-cover';
      btn.innerHTML = active
        ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
        : '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
      if (isCover) {
        btn.className = `absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/40 text-white backdrop-blur-sm border border-white/20 transition-colors ${active ? 'active' : ''}`;
      } else {
        btn.className = `p-3.5 rounded-2xl border transition-all flex-shrink-0 flex items-center justify-center ${active ? 'bg-rose-500/15 border-rose-400/50 text-rose-500' : 'bg-ink-100 dark:bg-ink-800 border-ink-300 dark:border-ink-700/50 text-ink-400 dark:text-ink-500 hover:text-rose-400 hover:border-rose-400/50'}`;
      }
    }

    renderFavorites() {
      const c = $('favorites-list');
      const s = $('favorites-section');
      if (!this.favorites.length) { s.classList.add('hidden'); return; }
      s.classList.remove('hidden');

      c.innerHTML = this.favorites.map(f => `
        <div class="card-hover rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800/50 cursor-pointer flex flex-col transition-colors relative group"
             onclick="app.openNovel('${f.id}')">
          <div class="relative">
            <img src="${f.cover}" loading="lazy" class="w-full aspect-[3/4] object-cover bg-ink-100 dark:bg-ink-800"
              onerror="this.src='https://via.placeholder.com/300x400?text=Sem+Capa'" />
            <button onclick="event.stopPropagation(); app.toggleFavorite('${f.id}')"
              class="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/40 text-white backdrop-blur-sm hover:bg-rose-500/80 transition-colors">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
          </div>
          <div class="p-3 flex-1 flex items-end">
            <h3 class="text-sm font-medium text-ink-800 dark:text-ink-200 line-clamp-2 leading-snug transition-colors">${f.title}</h3>
          </div>
        </div>`).join('');
    }

    /* ---- novel details ---- */
    async openNovel(id) {
      this.currentNovelId = id;
      this.chaptersReversed = false;
      this.showView('details');
      const box = $('details-container');
      box.innerHTML = '';
      this.toggleLoader(true);

      try {
        const info = await this.api.getNovelInfoAll(id);
        this.currentNovelInfo = info;
        this._renderDetails(info, id);
      } catch (e) {
        box.innerHTML = `<div class="text-center py-20 text-ink-400 dark:text-ink-500">Falha ao carregar informacoes da novel.</div>`;
        console.error(e);
      } finally { this.toggleLoader(false); }
    }

    _renderDetails(info, id) {
      const box = $('details-container');

      const genres = info.genres?.map(g =>
        `<span class="genre-chip inline-block px-2.5 py-0.5 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 text-xs border border-ink-200 dark:border-ink-700/50 transition-colors">${g[1]}</span>`
      ).join('') || '';

      const hist = this.history.find(h => h.id === id);
      const contBtn = hist?.chapterTitle
        ? `<button onclick="app.readChapter('${id}','${hist.chapterId}')"
            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold text-sm hover:shadow-lg hover:shadow-brand-500/20 transition-all flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Continuar: ${hist.chapterTitle}
          </button>`
        : '';

      const chapters = this.chaptersReversed ? [...info.chapters].reverse() : info.chapters;
      const chaps = chapters.map(c => `
        <button onclick="app.readChapter('${id}','${c[1]}')"
          class="chapter-card py-2 px-3 rounded-xl bg-ink-100 dark:bg-ink-800/70 border border-ink-200 dark:border-ink-700/40 text-xs text-ink-600 dark:text-ink-300 text-left truncate">
          ${c[0]}
        </button>`).join('');

      const sortIcon = this.chaptersReversed
        ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h6"/></svg>'
        : '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h6"/></svg>';

      box.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6 mb-8">
          <div class="relative w-44 md:w-48 flex-shrink-0 mx-auto md:mx-0">
            <img class="details-cover w-full rounded-2xl" src="${info.cover}"
              onerror="this.src='https://via.placeholder.com/200x280'" />
            <button id="fav-btn-cover" onclick="app.toggleFavorite('${id}')"
              class="md:hidden absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/40 text-white backdrop-blur-sm border border-white/20 transition-colors"></button>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-3 leading-tight transition-colors">${info.nome}</h2>
            <div class="flex flex-wrap gap-1.5 mb-3">${genres}</div>
            <div class="desc-box text-sm text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800/50 rounded-xl p-4 transition-colors">
              ${info.desc || 'Sem descricao disponivel.'}
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          ${contBtn}
          <button id="fav-btn" onclick="app.toggleFavorite('${id}')"
            class="hidden md:flex p-3.5 rounded-2xl border transition-all flex-shrink-0 items-center justify-center" style="display: none"></button>
          <button onclick="app.downloadEpub('${id}')"
            class="flex-1 py-3.5 rounded-2xl bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700/50 text-ink-700 dark:text-ink-200 font-semibold text-sm hover:bg-ink-200 dark:hover:bg-ink-700 hover:border-ink-300 dark:hover:border-ink-600 transition-all flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5 5 5 5-5m-5 5V3"/></svg>
            Baixar EPUB
          </button>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-1 h-5 rounded-full bg-brand-500"></div>
          <h3 class="text-sm font-semibold text-ink-500 dark:text-ink-300 uppercase tracking-wider transition-colors flex-1">Capitulos (${info.chapters.length})</h3>
          <button onclick="app.toggleChapterOrder()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700/50 text-xs text-ink-500 dark:text-ink-400 hover:text-brand-500 dark:hover:text-brand-400 hover:border-brand-400/50 transition-all font-medium">
            ${sortIcon}
            <span class="hidden sm:inline">${this.chaptersReversed ? 'Mais recente' : 'Mais antigo'}</span>
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">${chaps}</div>
      `;
      this._updateFavBtn($('fav-btn'), id);
      this._updateFavBtn($('fav-btn-cover'), id);
    }

    toggleChapterOrder() {
      this.chaptersReversed = !this.chaptersReversed;
      if (this.currentNovelInfo) this._renderDetails(this.currentNovelInfo, this.currentNovelId);
    }

    /* ---- reader ---- */
    async readChapter(novelId, chapterId) {
      this.showView('reader');
      const content = $('reader-content');
      content.innerHTML = '';
      $('reader-chapter-title').textContent = 'Carregando...';
      $('reader-novel-title').textContent = '';
      this.toggleLoader(true);
      window.scrollTo({ top: 0 });

      try {
        const d = await this.api.getChapterAll(novelId, chapterId);

        $('reader-novel-title').textContent = d.novelTitle;
        $('reader-chapter-title').textContent = d.title;

        content.innerHTML = `
          <h1 class="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-2 font-serif transition-colors">${d.title}</h1>
          ${d.subtitle ? `<p class="text-sm text-ink-400 dark:text-ink-500 mb-6 italic transition-colors">${d.subtitle}</p>` : '<div class="mb-6"></div>'}
          <hr class="border-ink-200 dark:border-ink-800 mb-8" />
          ${d.content}
        `;

        this.updateHistory(novelId, chapterId, d.title);

        const link = (id1, id2, target, label) => {
          [id1, id2].forEach(id => {
            const el = $(id);
            el.textContent = label;
            if (target) {
              el.disabled = false;
              el.onclick = () => this.readChapter(novelId, target);
            } else {
              el.disabled = true;
              el.onclick = null;
            }
          });
        };
        link('btn-prev', 'btn-prev-btm', d.nextChapterId, '\u2190 Ant');
        link('btn-next', 'btn-next-btm', d.prevChapterId, 'Prox \u2192');
      } catch (e) {
        content.innerHTML = `<div class="text-center py-20 text-ink-400 dark:text-ink-500">Falha ao carregar capitulo.</div>`;
        console.error(e);
      } finally { this.toggleLoader(false); }
    }

    /* ---- history ---- */
    updateHistory(novelId, chapterId, chapterTitle) {
      const old = this.history.find(h => h.id === novelId);
      let title = 'Unknown', cover = '';

      if (this.currentNovelInfo) { title = this.currentNovelInfo.nome; cover = this.currentNovelInfo.cover; }
      else if (old) { title = old.title; cover = old.cover; }

      const entry = { id: novelId, title, cover, chapterId, chapterTitle, source: novelId.split('-')[0], timestamp: Date.now() };
      this.history = this.history.filter(h => h.id !== novelId);
      this.history.unshift(entry);
      if (this.history.length > 20) this.history.pop();
      localStorage.setItem('uninovel_history', JSON.stringify(this.history));
    }

    /* ---- epub ---- */
    downloadEpub(novelId) {
      const m = $('epub-modal');
      m.classList.remove('hidden');
      $('epub-progress-section').classList.remove('hidden');
      $('epub-complete-section').classList.add('hidden');
      $('epub-cancel-btn').classList.remove('hidden');
      $('epub-close-btn').classList.add('hidden');
      $('epub-progress-bar').style.width = '0%';
      $('epub-status').textContent = 'Preparando...';
      $('epub-counter').textContent = '0/0';
      $('epub-chapter-name').textContent = '';

      this.epubDownloader.download(novelId, {
        onProgress: (p) => {
          if (p.phase === 'cover') {
            $('epub-status').textContent = p.status;
            $('epub-progress-bar').style.width = '5%';
          } else if (p.phase === 'chapters') {
            const pct = Math.round((p.current / p.total) * 90) + 5;
            $('epub-progress-bar').style.width = pct + '%';
            $('epub-status').textContent = p.status;
            $('epub-counter').textContent = `${p.current}/${p.total}`;
            $('epub-chapter-name').textContent = p.chapterTitle;
          } else if (p.phase === 'pack') {
            $('epub-progress-bar').style.width = '98%';
            $('epub-status').textContent = p.status;
          }
        }
      }).then(() => {
        if (!this.epubDownloader.cancelled) {
          $('epub-progress-bar').style.width = '100%';
          $('epub-progress-section').classList.add('hidden');
          $('epub-complete-section').classList.remove('hidden');
          $('epub-cancel-btn').classList.add('hidden');
          $('epub-close-btn').classList.remove('hidden');
        }
      }).catch(e => {
        console.error('EPUB error:', e);
        $('epub-status').textContent = 'Erro: ' + e.message;
      });
    }

    cancelEpub() { this.epubDownloader.cancel(); $('epub-modal').classList.add('hidden'); }
    closeEpubModal() { $('epub-modal').classList.add('hidden'); }

    showEasterEgg() { $('easter-egg-modal').classList.remove('hidden'); }
    closeEasterEgg() { $('easter-egg-modal').classList.add('hidden'); }

    showAbout() { $('about-modal').classList.remove('hidden'); }
    closeAbout() { $('about-modal').classList.add('hidden'); }
  }

  window.app = new App();
})();
