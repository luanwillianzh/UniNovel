/**
 * UniNovel Library - Base
 * Contains proxy configuration, fetch utilities, and helper methods.
 */
const NovelBase = {
  //proxy: "https://relaxed-churros-9a35ea.netlify.app/?destination=",
  proxy: "",

  async _fetch(url, options = {}) {
    const targetUrl = this.proxy + url;
    const res = await fetch(targetUrl, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body || null,
    });
    const text = await res.text();
    return new DOMParser().parseFromString(text, "text/html");
  },

  _safeText(el, fallback = "") {
    return el ? el.textContent.trim() : fallback;
  },

  _safeAttr(el, attr, fallback = "") {
    return el?.getAttribute(attr) ?? fallback;
  },

  _safeHTML(el, fallback = "") {
    return el?.innerHTML.trim() ?? fallback;
  },
};
