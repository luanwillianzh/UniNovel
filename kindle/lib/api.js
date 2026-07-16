/**
 * UniNovel Library - Unified API (Kindle Version)
 * Combines all sources using callbacks instead of Promises
 */
var NovelApi = (function() {
  var api = {};
  
  // Copiar métodos do NovelBase
  for (var key in NovelBase) {
    if (NovelBase.hasOwnProperty(key)) {
      api[key] = NovelBase[key];
    }
  }
  
  // Copiar métodos das sources
  var sources = [CentralSource, IllusiaSource, ManiaSource];
  for (var i = 0; i < sources.length; i++) {
    for (var key in sources[i]) {
      if (sources[i].hasOwnProperty(key)) {
        api[key] = sources[i][key];
      }
    }
  }
  
  // Método searchAll
  api.searchAll = function(text, callback, errCallback) {
    var results = [];
    var completed = 0;
    var hasError = false;
    
    function checkComplete() {
      completed++;
      if (completed === 3) {
        if (hasError) {
          errCallback();
        } else {
          callback(results);
        }
      }
    }
    
    // Central
    this.centralSearch(text, function(items) {
      results = results.concat(items);
      checkComplete();
    }, function() {
      checkComplete();
    });
    
    // Illusia
    this.illusiaSearch(text, function(items) {
      results = results.concat(items);
      checkComplete();
    }, function() {
      checkComplete();
    });
    
    // Mania
    this.maniaSearch(text, function(items) {
      results = results.concat(items);
      checkComplete();
    }, function() {
      checkComplete();
    });
  };
  
  // Método lancamentosAll
  api.lancamentosAll = function(callback, errCallback) {
    var results = [];
    var completed = 0;
    var hasError = false;
    
    function checkComplete() {
      completed++;
      if (completed === 3) {
        if (hasError) {
          errCallback();
        } else {
          callback(results);
        }
      }
    }
    
    // Central (busca vazia)
    this.centralSearch("", function(items) {
      results = results.concat(items);
      checkComplete();
    }, function() {
      checkComplete();
    });
    
    // Illusia
    this.illusiaLancamentos(function(items) {
      results = results.concat(items);
      checkComplete();
    }, function() {
      checkComplete();
    });
    
    // Mania
    this.maniaLancamentos(function(items) {
      results = results.concat(items);
      checkComplete();
    }, function() {
      checkComplete();
    });
  };
  
  // Método getNovelInfoAll
  api.getNovelInfoAll = function(novelId, callback, errCallback) {
    var parts = novelId.split("-");
    var source = parts[0];
    var id = parts.slice(1).join("-");
    
    switch (source) {
      case "central":
        this.centralGetNovelInfo(id, callback, errCallback);
        break;
      case "illusia":
        this.illusiaGetNovelInfo(id, callback, errCallback);
        break;
      case "mania":
        this.maniaGetNovelInfo(id, callback, errCallback);
        break;
      default:
        errCallback();
    }
  };
  
  // Método getChapterAll
  api.getChapterAll = function(novelId, chapterId, callback, errCallback) {
    var self = this;
    var parts = novelId.split("-");
    var source = parts[0];
    var id = parts.slice(1).join("-");
    
    // Primeiro buscar info da novel para ter a lista de capítulos
    this.getNovelInfoAll(novelId, function(info) {
      // Buscar capítulo
      var fetchChapter = function() {
        switch (source) {
          case "central":
            return self.centralGetChapter(chapterId);
          case "illusia":
            return self.illusiaGetChapter(id, chapterId);
          case "mania":
            return self.maniaGetChapter(id, chapterId);
        }
      };
      
      // Buscar capítulo com callbacks
      var chapterFetcher = function(chapterCallback, chapterErrCallback) {
        switch (source) {
          case "central":
            self.centralGetChapter(chapterId, chapterCallback, chapterErrCallback);
            break;
          case "illusia":
            self.illusiaGetChapter(id, chapterId, chapterCallback, chapterErrCallback);
            break;
          case "mania":
            self.maniaGetChapter(id, chapterId, chapterCallback, chapterErrCallback);
            break;
        }
      };
      
      chapterFetcher(function(chapter) {
        var list = info.chapters;
        var index = -1;
        
        for (var i = 0; i < list.length; i++) {
          if (list[i][1] === chapterId) {
            index = i;
            break;
          }
        }
        
        var nextChap = null;
        var prevChap = null;
        
        if (index !== -1) {
          if (index > 0) nextChap = list[index - 1][1];
          if (index < list.length - 1) prevChap = list[index + 1][1];
        }
        
        callback({
          title: chapter.title,
          subtitle: chapter.subtitle,
          content: chapter.content,
          novelTitle: info.nome,
          prevChapterId: prevChap,
          nextChapterId: nextChap
        });
      }, errCallback);
    }, errCallback);
  };
  
  return api;
})();
