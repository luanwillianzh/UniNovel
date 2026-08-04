/**
 * UniNovel Library - Base
 * Contains proxy configuration, fetch utilities, and helper methods.
 */
const NovelBase = {
  proxy: "https://relaxed-churros-9a35ea.netlify.app/?destination=",

  async _fetch(url, options = {}) {
    const request = {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body || null,
    };

    let res;

    // First attempt: proxy
    try {
      res = await fetch(this.proxy + url, request);

      if (!res.ok) {
        throw new Error(`Proxy returned ${res.status}`);
      }
    } catch (err) {
      console.warn("Proxy request failed, retrying without proxy...", err);

      // Second attempt: direct request
      res = await fetch(url, request);

      if (!res.ok) {
        throw new Error(`Direct request failed with ${res.status}`);
      }
    }

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
