/**
 * UniNovel Library - Central Novel Source (Kindle Version)
 * Methods to scrape centralnovel.com using callbacks
 */
var CentralSource = {
  centralSearch: function(text, callback, errCallback) {
    var self = this;
    var body = "action=ts_ac_do_search&ts_ac_query=" + encodeURIComponent(text);
    
    this._fetchJson(
      "https://centralnovel.com/wp-admin/admin-ajax.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
      },
      function(err, json) {
        if (err || !json || !json.series || !json.series[0]) {
          errCallback();
          return;
        }
        
        var results = [];
        var items = json.series[0].all;
        
        for (var i = 0; i < items.length; i++) {
          var a = items[i];
          var link = a.post_link || "";
          var parts = link.split("/").filter(function(p) { return p; });
          var slug = parts[parts.length - 1];
          
          if (slug) {
            results.push({
              nome: a.post_title || "Sem Título",
              url: "central-" + slug,
              cover: a.post_image || "",
              source: "central"
            });
          }
        }
        
        callback(results);
      }
    );
  },

  centralGetNovelInfo: function(slug, callback, errCallback) {
    this._fetch("https://centralnovel.com/series/" + slug + "/", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      var name = NovelBase._safeText(doc.querySelector("h1[itemprop=name]"));
      var desc = NovelBase._safeText(doc.querySelector(".entry-content"));
      var cover = NovelBase._safeAttr(doc.querySelector("div.thumb img"), "src");
      
      var lista = doc.querySelectorAll(".eplister a");
      var chapters = [];
      
      // Filtrar apenas itens pares (como no código original)
      for (var i = 0; i < lista.length; i++) {
        if (i % 2 === 0) {
          var a = lista[i];
          var divs = a.querySelectorAll("div");
          var text = "";
          
          for (var j = 0; j < Math.min(2, divs.length); j++) {
            if (j > 0) text += " - ";
            text += NovelBase._safeText(divs[j]);
          }
          
          var href = NovelBase._safeAttr(a, "href").split("/").filter(function(p) { return p; }).pop();
          chapters.push([text, href]);
        }
      }
      
      // Inverter ordem
      chapters.reverse();
      
      var genres = [];
      var genreLinks = doc.querySelectorAll(".genxed a");
      for (var i = 0; i < genreLinks.length; i++) {
        var a = genreLinks[i];
        var href = NovelBase._safeAttr(a, "href").split("/").filter(function(p) { return p; }).pop();
        genres.push([href, NovelBase._safeText(a)]);
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

  centralGetChapter: function(chapter, callback, errCallback) {
    this._fetch("https://centralnovel.com/" + chapter + "/", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      callback({
        title: NovelBase._safeText(doc.querySelector("h1.entry-title")),
        subtitle: NovelBase._safeText(doc.querySelector("div.cat-series")),
        content: NovelBase._safeHTML(doc.querySelector("div.epcontent.entry-content"))
      });
    });
  }
};
