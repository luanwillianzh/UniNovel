/**
 * UniNovel Library - Unified API
 * Combines all sources via Object.assign mixin pattern.
 */
const NovelApi = Object.assign({}, NovelBase, CentralSource, IllusiaSource, ManiaSource, {
  async searchAll(text) {
    const [central, illusia, mania] = await Promise.all([
      this.centralSearch(text).catch(() => []),
      this.illusiaSearch(text).catch(() => []),
      this.maniaSearch(text).catch(() => []),
    ]);
    return [...central, ...illusia, ...mania];
  },

  async lancamentosAll() {
    const [central, illusia, mania] = await Promise.all([
      this.centralSearch(""),
      this.illusiaLancamentos(),
      this.maniaLancamentos(),
    ]);
    return [...central, ...illusia, ...mania];
  },

  async getNovelInfoAll(novelId) {
    const [source, ...idParts] = novelId.split("-");
    const id = idParts.join("-");
    switch (source) {
      case "central":
        return this.centralGetNovelInfo(id);
      case "illusia":
        return this.illusiaGetNovelInfo(id);
      case "mania":
        return this.maniaGetNovelInfo(id);
      default:
        throw new Error("Unknown novel source");
    }
  },

  async getChapterAll(novelId, chapterId) {
    const info = await this.getNovelInfoAll(novelId);
    const [source, ...idParts] = novelId.split("-");
    const id = idParts.join("-");

    const chapter = await (() => {
      switch (source) {
        case "central":
          return this.centralGetChapter(chapterId);
        case "illusia":
          return this.illusiaGetChapter(id, chapterId);
        case "mania":
          return this.maniaGetChapter(id, chapterId);
      }
    })();

    const list = info.chapters;
    const index = list.findIndex((c) => c[1] === chapterId);

    let nextChap = null;
    let prevChap = null;

    if (index !== -1) {
      if (index > 0) nextChap = list[index - 1][1];
      if (index < list.length - 1) prevChap = list[index + 1][1];
    }

    return {
      title: chapter.title,
      subtitle: chapter.subtitle,
      content: chapter.content,
      novelTitle: info.nome,
      prevChapterId: prevChap,
      nextChapterId: nextChap,
    };
  },
});
