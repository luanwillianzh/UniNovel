/**
 * UniNovel Library - Novel Mania Source
 * Methods to scrape novelmania.com.br
 */
const ManiaSource = {
  async maniaSearch(text) {
    try {
      const doc = await this._fetch(
        `https://novelmania.com.br/novels?titulo=${encodeURIComponent(text)}`
      );
      return [...doc.querySelectorAll(".top-novels")].map((a) => {
        const link = a.querySelector("a");
        const h5 = a.querySelector("h5");
        const img = a.querySelector("img");
        const slug = this._safeAttr(link, "href").split("/").filter(Boolean).pop();
        return {
          nome: this._safeText(h5),
          url: `mania-${slug}`,
          cover: this._safeAttr(img, "src"),
          source: "mania",
        };
      });
    } catch {
      return [];
    }
  },

  async maniaLancamentos() {
    try {
      const doc = await this._fetch("https://novelmania.com.br");
      return [...doc.querySelectorAll(".novels .col-6")].map((item) => {
        const a = item.querySelector("a");
        const img = item.querySelector("img");
        const h2 = item.querySelector("h2");
        const slug = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
        return {
          url: `mania-${slug}`,
          nome: this._safeText(h2),
          cover: this._safeAttr(img, "src"),
          source: "mania",
        };
      });
    } catch {
      return [];
    }
  },

  async maniaGetNovelInfo(slug) {
    const doc = await this._fetch(`https://novelmania.com.br/novels/${slug}/`);
    const name = this._safeText(doc.querySelector("h1"));
    const desc = [...doc.querySelectorAll("div.text p")]
      .map((p) => this._safeText(p))
      .join("\n");
    const cover = this._safeAttr(doc.querySelector(".img-responsive"), "src");
    const chapters = [...doc.querySelectorAll("ol.list-inline li a")].map((a) => {
      const href = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
      return [this._safeText(a.querySelector("strong")), href];
    });
    const genres = [...doc.querySelectorAll(".list-tags a")].map((a) => {
      const href = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
      return [href, this._safeAttr(a, "title")];
    });
    return { nome: name, desc, cover, chapters, genres };
  },

  async maniaGetChapter(novel, chapter) {
    const doc = await this._fetch(
      `https://novelmania.com.br/novels/${novel}/capitulos/${chapter}`
    );
    return {
      title: this._safeText(doc.querySelector("h3.mb-0")),
      subtitle: this._safeText(doc.querySelector("h2.mt-0")),
      content: this._safeHTML(doc.querySelector("#chapter-content")),
    };
  },
};
