/**
 * UniNovel Library - Novel Mania Source (Kindle Version)
 * Methods to scrape novelmania.com.br using callbacks
 */
var ManiaSource = {
  maniaSearch: function(text, callback, errCallback) {
    this._fetch(
      "https://novelmania.com.br/novels?titulo=" + encodeURIComponent(text),
      {},
      function(err, doc) {
        if (err) {
          errCallback();
          return;
        }
        
        var results = [];
        var items = doc.querySelectorAll(".top-novels");
        
        for (var i = 0; i < items.length; i++) {
          var a = items[i].querySelector("a");
          var h5 = items[i].querySelector("h5");
          var img = items[i].querySelector("img");
          
          if (a) {
            var href = NovelBase._safeAttr(a, "href");
            var slug = href.split("/").filter(function(p) { return p; }).pop();
            
            results.push({
              nome: h5 ? NovelBase._safeText(h5) : "",
              url: "mania-" + slug,
              cover: img ? NovelBase._safeAttr(img, "src") : "",
              source: "mania"
            });
          }
        }
        
        callback(results);
      }
    );
  },

  maniaLancamentos: function(callback, errCallback) {
    this._fetch("https://novelmania.com.br", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      var results = [];
      var items = doc.querySelectorAll(".novels .col-6");
      
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var a = item.querySelector("a");
        var img = item.querySelector("img");
        var h2 = item.querySelector("h2");
        
        if (a) {
          var href = NovelBase._safeAttr(a, "href");
          var slug = href.split("/").filter(function(p) { return p; }).pop();
          
          results.push({
            url: "mania-" + slug,
            nome: h2 ? NovelBase._safeText(h2) : "",
            cover: img ? NovelBase._safeAttr(img, "src") : "",
            source: "mania"
          });
        }
      }
      
      callback(results);
    });
  },

  maniaGetNovelInfo: function(slug, callback, errCallback) {
    this._fetch("https://novelmania.com.br/novels/" + slug + "/", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      var name = NovelBase._safeText(doc.querySelector("h1"));
      
      var descParts = doc.querySelectorAll("div.text p");
      var desc = "";
      for (var i = 0; i < descParts.length; i++) {
        if (i > 0) desc += "\n";
        desc += NovelBase._safeText(descParts[i]);
      }
      
      var cover = NovelBase._safeAttr(doc.querySelector(".img-responsive"), "src");
      
      var chapters = [];
      var chapterLinks = doc.querySelectorAll("ol.list-inline li a");
      for (var i = 0; i < chapterLinks.length; i++) {
        var a = chapterLinks[i];
        var href = NovelBase._safeAttr(a, "href").split("/").filter(function(p) { return p; }).pop();
        var strong = a.querySelector("strong");
        chapters.push([strong ? NovelBase._safeText(strong) : NovelBase._safeText(a), href]);
      }
      
      var genres = [];
      var genreLinks = doc.querySelectorAll(".list-tags a");
      for (var i = 0; i < genreLinks.length; i++) {
        var a = genreLinks[i];
        var href = NovelBase._safeAttr(a, "href").split("/").filter(function(p) { return p; }).pop();
        genres.push([href, NovelBase._safeAttr(a, "title")]);
      }
      
      callback({
        nome: name,
        desc: desc,
        cover: cover,
        chapters: chapters,
        genres: genres
      });
    });
  },

  maniaGetChapter: function(novel, chapter, callback, errCallback) {
    this._fetch(
      "https://novelmania.com.br/novels/" + novel + "/capitulos/" + chapter,
      {},
      function(err, doc) {
        if (err) {
          errCallback();
          return;
        }
        
        callback({
          title: NovelBase._safeText(doc.querySelector("h3.mb-0")),
          subtitle: NovelBase._safeText(doc.querySelector("h2.mt-0")),
          content: NovelBase._safeHTML(doc.querySelector("#chapter-content"))
        });
      }
    );
  }
};
