(function() {
  function $(id) { return document.getElementById(id); }
  
  // App principal
  var App = function() {
    this.api = NovelApi;
    this.currentNovelId = null;
    this.currentNovelInfo = null;
    this.history = [];
    this.favorites = [];
    
    // Carregar dados do localStorage
    try {
      var savedHistory = localStorage.getItem('uninovel_history');
      if (savedHistory) this.history = JSON.parse(savedHistory);
    } catch(e) {}
    
    try {
      var savedFavorites = localStorage.getItem('uninovel_favorites');
      if (savedFavorites) this.favorites = JSON.parse(savedFavorites);
    } catch(e) {}
    
    this.views = {
      home: $('view-home'),
      details: $('view-details'),
      reader: $('view-reader')
    };
    
    this.bindEvents();
    this.loadReleases();
  };
  
  App.prototype.bindEvents = function() {
    var self = this;
    
    // Busca
    $('search-btn').onclick = function() { self.search(); };
    $('search-input').onkeydown = function(e) {
      if (e.keyCode === 13) self.search();
    };
    
    // Navegação
    $('nav-home').onclick = function() { self.goHome(); };
    $('nav-history').onclick = function() { self.showHistory(); };
    $('nav-favorites').onclick = function() { self.showFavorites(); };
    
    // Botões de voltar
    $('btn-back-details').onclick = function() { self.goBack(); };
    $('btn-back-reader').onclick = function() { self.goBackToDetails(); };
    
    // Navegação do leitor
    $('btn-prev').onclick = function() { self.prevChapter(); };
    $('btn-next').onclick = function() { self.nextChapter(); };
  };
  
  // Navegação
  App.prototype.showView = function(name) {
    for (var key in this.views) {
      if (this.views[key]) {
        this.views[key].className = 'hidden';
      }
    }
    if (this.views[name]) {
      this.views[name].className = '';
    }
    window.scrollTo(0, 0);
  };
  
  App.prototype.showLoader = function() { $('loader').style.display = 'block'; };
  App.prototype.hideLoader = function() { $('loader').style.display = 'none'; };
  
  App.prototype.goBack = function() {
    this.showView('home');
    this.renderHistory();
    this.renderFavorites();
  };
  
  App.prototype.goBackToDetails = function() {
    if (this.currentNovelId) {
      this.showView('details');
    } else {
      this.goBack();
    }
  };
  
  App.prototype.goHome = function() {
    $('search-input').value = '';
    $('home-title').textContent = 'Lançamentos';
    this.loadReleases();
    this.renderFavorites();
  };
  
  // Carregar lançamentos
  App.prototype.loadReleases = function() {
    var self = this;
    this.showView('home');
    this.renderHistory();
    this.renderFavorites();
    $('novel-list').innerHTML = '';
    this.showLoader();
    
    this.api.lancamentosAll(function(novels) {
      self.renderGrid(novels, 'novel-list');
      self.hideLoader();
    }, function() {
      $('novel-list').innerHTML = '<p style="text-align:center;padding:20px;">Erro de rede.</p>';
      self.hideLoader();
    });
  };
  
  // Buscar
  App.prototype.search = function() {
    var q = $('search-input').value.trim();
    if (!q) return;
    
    var self = this;
    this.showView('home');
    $('home-title').textContent = 'Resultados: "' + q + '"';
    $('novel-list').innerHTML = '';
    $('history-section').className = 'hidden';
    this.showLoader();
    
    this.api.searchAll(q, function(novels) {
      self.renderGrid(novels, 'novel-list');
      self.hideLoader();
    }, function() {
      self.hideLoader();
    });
  };
  
  // Renderizar grid de novels
  App.prototype.renderGrid = function(novels, containerId) {
    var self = this;
    var c = $(containerId);
    var seen = {};
    var unique = [];
    
    for (var i = 0; i < novels.length; i++) {
      var n = novels[i];
      if (!seen[n.url]) {
        seen[n.url] = true;
        unique.push(n);
      }
    }
    
    if (unique.length === 0) {
      c.innerHTML = '<p style="text-align:center;padding:20px;">Nenhum resultado encontrado.</p>';
      return;
    }
    
    var html = '';
    for (var i = 0; i < unique.length; i++) {
      var n = unique[i];
      html += '<div class="novel-item" data-url="' + n.url + '">' +
              '<h3>' + this.escapeHtml(n.nome) + '</h3>' +
              '<span class="source">' + n.source + '</span>' +
              '</div>';
    }
    
    c.innerHTML = html;
    
    // Bind click events
    var items = c.querySelectorAll('.novel-item');
    for (var i = 0; i < items.length; i++) {
      items[i].onclick = (function(url) {
        return function() { self.openNovel(url); };
      })(items[i].getAttribute('data-url'));
    }
  };
  
  // Renderizar histórico
  App.prototype.renderHistory = function() {
    var self = this;
    var c = $('history-list');
    var s = $('history-section');
    
    if (this.history.length === 0) {
      s.className = 'hidden';
      return;
    }
    
    s.className = '';
    var html = '';
    
    for (var i = 0; i < this.history.length; i++) {
      var h = this.history[i];
      html += '<div class="history-item" data-id="' + h.id + '" data-chapter="' + h.chapterId + '">' +
              '<h4>' + this.escapeHtml(h.title) + '</h4>' +
              '<p>' + this.escapeHtml(h.chapterTitle || 'Continuar') + '</p>' +
              '</div>';
    }
    
    c.innerHTML = html;
    
    // Bind click events
    var items = c.querySelectorAll('.history-item');
    for (var i = 0; i < items.length; i++) {
      items[i].onclick = (function(id, chapterId) {
        return function() { self.readChapter(id, chapterId); };
      })(items[i].getAttribute('data-id'), items[i].getAttribute('data-chapter'));
    }
  };
  
  // Renderizar favoritos
  App.prototype.renderFavorites = function() {
    var self = this;
    var c = $('favorites-list');
    var s = $('favorites-section');
    
    if (this.favorites.length === 0) {
      s.className = 'hidden';
      return;
    }
    
    s.className = '';
    var html = '';
    
    for (var i = 0; i < this.favorites.length; i++) {
      var f = this.favorites[i];
      html += '<div class="novel-item" data-id="' + f.id + '">' +
              '<h3>' + this.escapeHtml(f.title) + '</h3>' +
              '<span class="source">' + f.source + '</span>' +
              '</div>';
    }
    
    c.innerHTML = html;
    
    // Bind click events
    var items = c.querySelectorAll('.novel-item');
    for (var i = 0; i < items.length; i++) {
      items[i].onclick = (function(id) {
        return function() { self.openNovel(id); };
      })(items[i].getAttribute('data-id'));
    }
  };
  
  // Abrir novel
  App.prototype.openNovel = function(id) {
    var self = this;
    this.currentNovelId = id;
    this.showView('details');
    $('details-container').innerHTML = '';
    this.showLoader();
    
    this.api.getNovelInfoAll(id, function(info) {
      self.currentNovelInfo = info;
      self.renderDetails(info, id);
      self.hideLoader();
    }, function() {
      $('details-container').innerHTML = '<p style="text-align:center;padding:20px;">Falha ao carregar informações da novel.</p>';
      self.hideLoader();
    });
  };
  
  // Renderizar detalhes
  App.prototype.renderDetails = function(info, id) {
    var box = $('details-container');
    var html = '';
    
    // Título e descrição
    html += '<div class="novel-header">';
    html += '<div class="novel-title">' + this.escapeHtml(info.nome) + '</div>';
    
    // Gêneros
    if (info.genres && info.genres.length > 0) {
      html += '<p style="margin-bottom:10px;">';
      for (var i = 0; i < info.genres.length; i++) {
        html += '<span style="border:1px solid #000;padding:2px 6px;margin-right:5px;font-size:0.9em;">' + 
                this.escapeHtml(info.genres[i][1]) + '</span>';
      }
      html += '</p>';
    }
    
    // Descrição
    if (info.desc) {
      html += '<div class="novel-desc">' + this.escapeHtml(info.desc) + '</div>';
    }
    
    html += '</div>';
    
    // Botões de ação
    html += '<div style="margin-bottom:20px;">';
    
    // Botão continuar
    var hist = this.findHistory(id);
    if (hist && hist.chapterTitle) {
      html += '<button class="back-btn" id="btn-continue" style="width:100%;margin-bottom:10px;">Continuar: ' + 
              this.escapeHtml(hist.chapterTitle) + '</button>';
    }
    
    // Botão favoritar
    var isFav = this.isFavorite(id);
    html += '<button class="back-btn" id="btn-favorite" style="width:100%;margin-bottom:10px;">' +
            (isFav ? '★ Remover dos Favoritos' : '☆ Adicionar aos Favoritos') + '</button>';
    
    html += '</div>';
    
    // Lista de capítulos
    html += '<h3 class="section-title">Capítulos (' + info.chapters.length + ')</h3>';
    html += '<div class="chapter-list">';
    
    for (var i = 0; i < info.chapters.length; i++) {
      var c = info.chapters[i];
      html += '<div class="chapter-item" data-id="' + c[1] + '">' + this.escapeHtml(c[0]) + '</div>';
    }
    
    html += '</div>';
    
    box.innerHTML = html;
    
    // Bind events
    var self = this;
    
    // Botão continuar
    var btnContinue = $('btn-continue');
    if (btnContinue) {
      btnContinue.onclick = function() {
        self.readChapter(id, hist.chapterId);
      };
    }
    
    // Botão favoritar
    var btnFavorite = $('btn-favorite');
    if (btnFavorite) {
      btnFavorite.onclick = function() {
        self.toggleFavorite(id);
      };
    }
    
    // Capítulos
    var chapterItems = box.querySelectorAll('.chapter-item');
    for (var i = 0; i < chapterItems.length; i++) {
      chapterItems[i].onclick = (function(chapterId) {
        return function() { self.readChapter(id, chapterId); };
      })(chapterItems[i].getAttribute('data-id'));
    }
  };
  
  // Ler capítulo
  App.prototype.readChapter = function(novelId, chapterId) {
    var self = this;
    this.showView('reader');
    $('reader-content').innerHTML = '';
    $('reader-chapter-title').textContent = 'Carregando...';
    $('reader-novel-title').textContent = '';
    this.showLoader();
    
    this.api.getChapterAll(novelId, chapterId, function(d) {
      $('reader-novel-title').textContent = d.novelTitle;
      $('reader-chapter-title').textContent = d.title;
      
      var html = '<h1 style="font-size:1.4em;margin-bottom:10px;">' + self.escapeHtml(d.title) + '</h1>';
      if (d.subtitle) {
        html += '<p style="font-style:italic;margin-bottom:20px;">' + self.escapeHtml(d.subtitle) + '</p>';
      }
      html += '<hr style="margin-bottom:20px;">';
      html += d.content;
      
      $('reader-content').innerHTML = html;
      
      // Atualizar histórico
      self.updateHistory(novelId, chapterId, d.title);
      
      // Atualizar botões de navegação
      self.currentChapterIndex = -1;
      self.currentChapters = self.currentNovelInfo ? self.currentNovelInfo.chapters : [];
      
      for (var i = 0; i < self.currentChapters.length; i++) {
        if (self.currentChapters[i][1] === chapterId) {
          self.currentChapterIndex = i;
          break;
        }
      }
      
      // Botão anterior (próximo na lista, pois a lista vem invertida)
      var prevBtn = $('btn-prev');
      if (self.currentChapterIndex > 0) {
        prevBtn.disabled = false;
        prevBtn.textContent = '← ' + self.currentChapters[self.currentChapterIndex - 1][0];
        prevBtn.onclick = function() {
          self.readChapter(novelId, self.currentChapters[self.currentChapterIndex - 1][1]);
        };
      } else {
        prevBtn.disabled = true;
        prevBtn.textContent = '← Anterior';
        prevBtn.onclick = null;
      }
      
      // Botão próximo (anterior na lista)
      var nextBtn = $('btn-next');
      if (self.currentChapterIndex < self.currentChapters.length - 1) {
        nextBtn.disabled = false;
        nextBtn.textContent = self.currentChapters[self.currentChapterIndex + 1][0] + ' →';
        nextBtn.onclick = function() {
          self.readChapter(novelId, self.currentChapters[self.currentChapterIndex + 1][1]);
        };
      } else {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Próximo →';
        nextBtn.onclick = null;
      }
      
      self.hideLoader();
    }, function() {
      $('reader-content').innerHTML = '<p style="text-align:center;padding:20px;">Falha ao carregar capítulo.</p>';
      self.hideLoader();
    });
  };
  
  // Capítulos adjacentes
  App.prototype.prevChapter = function() {
    // Implementado inline no readChapter
  };
  
  App.prototype.nextChapter = function() {
    // Implementado inline no readChapter
  };
  
  // Histórico
  App.prototype.updateHistory = function(novelId, chapterId, chapterTitle) {
    var title = 'Unknown';
    var cover = '';
    
    if (this.currentNovelInfo) {
      title = this.currentNovelInfo.nome;
      cover = this.currentNovelInfo.cover;
    } else {
      var old = this.findHistory(novelId);
      if (old) {
        title = old.title;
        cover = old.cover;
      }
    }
    
    var entry = {
      id: novelId,
      title: title,
      cover: cover,
      chapterId: chapterId,
      chapterTitle: chapterTitle,
      source: novelId.split('-')[0],
      timestamp: Date.now()
    };
    
    // Remover entrada existente
    this.history = this.history.filter(function(h) { return h.id !== novelId; });
    
    // Adicionar no início
    this.history.unshift(entry);
    
    // Limitar a 20 entradas
    if (this.history.length > 20) {
      this.history.pop();
    }
    
    // Salvar no localStorage
    try {
      localStorage.setItem('uninovel_history', JSON.stringify(this.history));
    } catch(e) {}
  };
  
  App.prototype.findHistory = function(id) {
    for (var i = 0; i < this.history.length; i++) {
      if (this.history[i].id === id) {
        return this.history[i];
      }
    }
    return null;
  };
  
  // Favoritos
  App.prototype.isFavorite = function(id) {
    for (var i = 0; i < this.favorites.length; i++) {
      if (this.favorites[i].id === id) return true;
    }
    return false;
  };
  
  App.prototype.toggleFavorite = function(id) {
    if (this.isFavorite(id)) {
      this.favorites = this.favorites.filter(function(f) { return f.id !== id; });
    } else {
      var info = this.currentNovelInfo;
      var old = this.findHistory(id);
      
      this.favorites.unshift({
        id: id,
        title: (info && info.nome) || (old && old.title) || 'Unknown',
        cover: (info && info.cover) || (old && old.cover) || '',
        source: id.split('-')[0]
      });
      
      if (this.favorites.length > 50) {
        this.favorites.pop();
      }
    }
    
    try {
      localStorage.setItem('uninovel_favorites', JSON.stringify(this.favorites));
    } catch(e) {}
    
    this.renderFavorites();
    
    // Atualizar botão
    var btn = $('btn-favorite');
    if (btn) {
      var isFav = this.isFavorite(id);
      btn.textContent = isFav ? '★ Remover dos Favoritos' : '☆ Adicionar aos Favoritos';
    }
  };
  
  // Mostrar histórico
  App.prototype.showHistory = function() {
    this.showView('home');
    $('home-title').textContent = 'Histórico';
    $('novel-list').innerHTML = '';
    $('history-section').className = 'hidden';
    $('favorites-section').className = 'hidden';
    
    if (this.history.length === 0) {
      $('novel-list').innerHTML = '<p style="text-align:center;padding:20px;">Nenhum item no histórico.</p>';
      return;
    }
    
    var html = '';
    for (var i = 0; i < this.history.length; i++) {
      var h = this.history[i];
      html += '<div class="history-item" data-id="' + h.id + '" data-chapter="' + h.chapterId + '">' +
              '<h4>' + this.escapeHtml(h.title) + '</h4>' +
              '<p>' + this.escapeHtml(h.chapterTitle || 'Continuar') + '</p>' +
              '</div>';
    }
    
    $('novel-list').innerHTML = html;
    
    // Bind click events
    var self = this;
    var items = $('novel-list').querySelectorAll('.history-item');
    for (var i = 0; i < items.length; i++) {
      items[i].onclick = (function(id, chapterId) {
        return function() { self.readChapter(id, chapterId); };
      })(items[i].getAttribute('data-id'), items[i].getAttribute('data-chapter'));
    }
  };
  
  // Mostrar favoritos
  App.prototype.showFavorites = function() {
    this.showView('home');
    $('home-title').textContent = 'Favoritos';
    $('novel-list').innerHTML = '';
    $('history-section').className = 'hidden';
    $('favorites-section').className = 'hidden';
    
    if (this.favorites.length === 0) {
      $('novel-list').innerHTML = '<p style="text-align:center;padding:20px;">Nenhum favorito.</p>';
      return;
    }
    
    var html = '';
    for (var i = 0; i < this.favorites.length; i++) {
      var f = this.favorites[i];
      html += '<div class="novel-item" data-id="' + f.id + '">' +
              '<h3>' + this.escapeHtml(f.title) + '</h3>' +
              '<span class="source">' + f.source + '</span>' +
              '</div>';
    }
    
    $('novel-list').innerHTML = html;
    
    // Bind click events
    var self = this;
    var items = $('novel-list').querySelectorAll('.novel-item');
    for (var i = 0; i < items.length; i++) {
      items[i].onclick = (function(id) {
        return function() { self.openNovel(id); };
      })(items[i].getAttribute('data-id'));
    }
  };
  
  // Utilitários
  App.prototype.escapeHtml = function(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // Iniciar app
  window.app = new App();
})();
