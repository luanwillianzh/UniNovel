/**
 * UniNovel Library - Illusia Source (Kindle Version)
 * Methods to scrape illusia.com.br using callbacks
 */
var IllusiaSource = {
  illusiaSearch: function(text, callback, errCallback) {
    this._fetch(
      "https://illusia.com.br/?s=" + encodeURIComponent(text) + "&post_type=fcn_story",
      { method: "POST" },
      function(err, doc) {
        if (err) {
          errCallback();
          return;
        }
        
        var results = [];
        var cards = doc.querySelectorAll("li.card");
        
        for (var i = 0; i < cards.length; i++) {
          var card = cards[i];
          var link = card.querySelector("a");
          var img = card.querySelector("img");
          
          if (link) {
            var href = NovelBase._safeAttr(link, "href");
            var slug = href.split("/").filter(function(p) { return p; }).pop();
            
            results.push({
              nome: NovelBase._safeText(link),
              url: "illusia-" + slug,
              cover: img ? NovelBase._safeAttr(img, "src") : "",
              source: "illusia"
            });
          }
        }
        
        callback(results);
      }
    );
  },

  illusiaLancamentos: function(callback, errCallback) {
    this._fetch("https://illusia.com.br/lancamentos/", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      var results = [];
      var novels = doc.querySelectorAll("li._latest-updates");
      
      for (var i = 0; i < novels.length; i++) {
        var novel = novels[i];
        var a = novel.querySelector("a");
        var img = novel.querySelector("img");
        
        if (a) {
          var href = NovelBase._safeAttr(a, "href");
          var slug = href.split("/").filter(function(p) { return p; }).pop();
          
          results.push({
            url: "illusia-" + slug,
            nome: NovelBase._safeAttr(a, "title"),
            cover: img ? NovelBase._safeAttr(img, "src") : "",
            source: "illusia"
          });
        }
      }
      
      callback(results);
    });
  },

  illusiaGetNovelInfo: function(slug, callback, errCallback) {
    this._fetch("https://illusia.com.br/story/" + slug + "/", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      var nameEl = doc.querySelector(".story__identity-title");
      var name = nameEl ? nameEl.textContent.trim().replace(/\n/g, " ") : "";
      
      var descParts = doc.querySelectorAll("section.story__summary p");
      var desc = "";
      for (var i = 0; i < descParts.length; i++) {
        if (i > 0) desc += "\n";
        desc += NovelBase._safeText(descParts[i]);
      }
      
      var coverEl = doc.querySelector(".webfeedsFeaturedVisual");
      var cover = coverEl ? NovelBase._safeAttr(coverEl, "src") : "";
      
      var chapters = [];
      var chapterLinks = doc.querySelectorAll(".chapter-group__list a");
      for (var i = 0; i < chapterLinks.length; i++) {
        var a = chapterLinks[i];
        var href = NovelBase._safeAttr(a, "href").split("/").filter(function(p) { return p; }).pop();
        chapters.push([NovelBase._safeText(a), href]);
      }
      
      var genres = [];
      var genreLinks = doc.querySelectorAll("._taxonomy-genre");
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

  illusiaGetChapter: function(novel, chapter, callback, errCallback) {
    this._fetch("https://illusia.com.br/story/" + novel + "/" + chapter + "/", {}, function(err, doc) {
      if (err) {
        errCallback();
        return;
      }
      
      var titleEl = doc.querySelector(".chapter__story-link");
      var subtitleEl = doc.querySelector(".chapter__title");
      
      callback({
        title: titleEl ? titleEl.textContent.trim().replace(/\n/g, " ") : "",
        subtitle: subtitleEl ? subtitleEl.textContent.trim().replace(/\n/g, " ") : "",
        content: NovelBase._safeHTML(doc.querySelector("#chapter-content"))
      });
    });
  }
};
