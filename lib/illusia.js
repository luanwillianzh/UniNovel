/**
 * UniNovel Library - Illusia Source
 * Methods to scrape illusia.com.br
 */
const IllusiaSource = {
  async illusiaSearch(text) {
    try {
      const doc = await this._fetch(
        `https://illusia.com.br/?s=${encodeURIComponent(text)}&post_type=fcn_story`,
        { method: "POST" }
      );
      return [...doc.querySelectorAll("li.card")].map((card) => {
        const link = card.querySelector("a");
        const img = card.querySelector("img");
        const slug = this._safeAttr(link, "href").split("/").filter(Boolean).pop();
        return {
          nome: this._safeText(link),
          url: `illusia-${slug}`,
          cover: this._safeAttr(img, "src"),
          source: "illusia",
        };
      });
    } catch {
      return [];
    }
  },

  async illusiaLancamentos() {
    try {
      const doc = await this._fetch("https://illusia.com.br/lancamentos/");
      return [...doc.querySelectorAll("li._latest-updates")].map((novel) => {
        const a = novel.querySelector("a");
        const img = novel.querySelector("img");
        const slug = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
        return {
          url: `illusia-${slug}`,
          nome: this._safeAttr(a, "title"),
          cover: this._safeAttr(img, "src"),
          source: "illusia",
        };
      });
    } catch {
      return [];
    }
  },

  async illusiaGetNovelInfo(slug) {
    const doc = await this._fetch(`https://illusia.com.br/story/${slug}/`);
    const name = this._safeText(doc.querySelector(".story__identity-title")).replace(/\n/g, " ");
    const desc = [...doc.querySelectorAll("section.story__summary p")]
      .map((p) => this._safeText(p))
      .join("\n");
    const cover = this._safeAttr(doc.querySelector(".webfeedsFeaturedVisual"), "src");
    const chapters = [...doc.querySelectorAll(".chapter-group__list a")].map((a) => {
      const href = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
      return [this._safeText(a), href];
    });
    const genres = [...doc.querySelectorAll("._taxonomy-genre")].map((a) => {
      const href = this._safeAttr(a, "href").split("/").filter(Boolean).pop();
      return [href, this._safeText(a)];
    });
    return { nome: name, desc, cover, chapters, genres };
  },

  async illusiaGetChapter(novel, chapter) {
    const doc = await this._fetch(`https://illusia.com.br/story/${novel}/${chapter}/`);
    return {
      title: this._safeText(doc.querySelector(".chapter__story-link")).replace(/\n/g, " "),
      subtitle: this._safeText(doc.querySelector(".chapter__title")).replace(/\n/g, " "),
      content: this._safeHTML(doc.querySelector("#chapter-content")),
    };
  },
};
