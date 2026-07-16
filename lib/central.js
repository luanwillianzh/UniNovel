/**
 * UniNovel Library - Central Novel Source
 * Methods to scrape centralnovel.com
 */
const CentralSource = {
  async centralSearch(text) {
    try {
      const body = new URLSearchParams({ action: "ts_ac_do_search", ts_ac_query: text });
      const res = await fetch(this.proxy + "https://centralnovel.com/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const json = await res.json().catch(() => null);
      if (!json || !json.series || !json.series[0]) return [];
      return json.series[0].all
        .map((a) => {
          const link = a.post_link || "";
          const slug = link.split("/").filter(Boolean).pop();
          if (!slug) return null;
          return {
            nome: a.post_title || "Sem Titulo",
            url: `central-${slug}`,
            cover: a.post_image || "",
            source: "central",
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  },

  async centralGetNovelInfo(slug) {
    const doc = await this._fetch(`https://centralnovel.com/series/${slug}/`);
    const name = this._safeText(doc.querySelector("h1[itemprop=name]"));
    const desc = this._safeText(doc.querySelector(".entry-content"));
    const cover = this._safeAttr(doc.querySelector("div.thumb img"), "src");
    const lista = [...doc.querySelectorAll(".eplister a")];
    const filtered = lista.filter((_, idx) => idx % 2 === 0);
    const reversed = filtered.reverse();
    const chapters = reversed.map((a) => {
      const divs = [...a.querySelectorAll("div")];
      const text = divs
        .slice(0, 2)
        .map((d) => this._safeText(d))
        .join(" - ");
      const href = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
      return [text, href];
    });
    const genres = [...doc.querySelectorAll(".genxed a")].map((a) => {
      const href = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
      return [href, this._safeText(a)];
    });
    return { nome: name, desc, cover, chapters, genres };
  },

  async centralGetChapter(chapter) {
    const doc = await this._fetch(`https://centralnovel.com/${chapter}/`);
    return {
      title: this._safeText(doc.querySelector("h1.entry-title")),
      subtitle: this._safeText(doc.querySelector("div.cat-series")),
      content: this._safeHTML(doc.querySelector("div.epcontent.entry-content")),
    };
  },
};
