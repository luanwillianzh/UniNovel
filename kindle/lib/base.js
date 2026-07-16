/**
 * UniNovel Library - Base (Kindle Version)
 * Uses XMLHttpRequest instead of fetch for Kindle browser compatibility
 */
var NovelBase = {
  proxy: "https://relaxed-churros-9a35ea.netlify.app/?destination=",

  _fetch: function(url, options, callback) {
    options = options || {};
    var targetUrl = this.proxy + url;
    var xhr = new XMLHttpRequest();
    
    xhr.open(options.method || "GET", targetUrl, true);
    
    if (options.headers) {
      for (var key in options.headers) {
        if (options.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
    }
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xhr.responseText, "text/html");
        callback(null, doc);
      } else {
        callback(new Error("HTTP " + xhr.status));
      }
    };
    
    xhr.onerror = function() {
      callback(new Error("Network error"));
    };
    
    xhr.send(options.body || null);
  },

  _fetchJson: function(url, options, callback) {
    options = options || {};
    var targetUrl = this.proxy + url;
    var xhr = new XMLHttpRequest();
    
    xhr.open(options.method || "GET", targetUrl, true);
    
    if (options.headers) {
      for (var key in options.headers) {
        if (options.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
    }
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var json = JSON.parse(xhr.responseText);
          callback(null, json);
        } catch(e) {
          callback(e);
        }
      } else {
        callback(new Error("HTTP " + xhr.status));
      }
    };
    
    xhr.onerror = function() {
      callback(new Error("Network error"));
    };
    
    xhr.send(options.body || null);
  },

  _safeText: function(el, fallback) {
    fallback = fallback || "";
    return el ? el.textContent.trim() : fallback;
  },

  _safeAttr: function(el, attr, fallback) {
    fallback = fallback || "";
    return el && el.getAttribute(attr) ? el.getAttribute(attr) : fallback;
  },

  _safeHTML: function(el, fallback) {
    fallback = fallback || "";
    return el && el.innerHTML ? el.innerHTML.trim() : fallback;
  }
};
