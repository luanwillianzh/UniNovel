/**
 * UniNovel Library - EPUB Downloader
 * Downloads chapters with cooldown and generates EPUB files.
 */
class EpubDownloader {
  constructor(api) {
    this.api = api;
    this.cancelled = false;
    this.downloaded = 0;
    this.total = 0;
  }

  async download(novelId, options = {}) {
    this.cancelled = false;
    this.downloaded = 0;

    const { onProgress, startChapter = 0, endChapter = Infinity } = options;

    const info = await this.api.getNovelInfoAll(novelId);
    const allChapters = info.chapters.slice(startChapter, endChapter + 1);
    this.total = allChapters.length;

    onProgress?.({ phase: "cover", status: "Downloading cover...", current: 0, total: this.total });

    const source = novelId.split("-")[0];
    const coverBase64 = await this._downloadCover(info.cover, source);

    if (this.cancelled) return null;

    const downloadedChapters = [];

    for (let i = 0; i < allChapters.length; i++) {
      if (this.cancelled) return null;

      const chapter = allChapters[i];
      onProgress?.({
        phase: "chapters",
        current: i + 1,
        total: allChapters.length,
        status: `Downloading chapter ${i + 1}/${allChapters.length}`,
        chapterTitle: chapter[0],
      });

      try {
        const chapterData = await this._fetchChapter(novelId, chapter[1]);
        downloadedChapters.push(chapterData);
      } catch (e) {
        console.error(`Failed to download chapter: ${chapter[0]}`, e);
        downloadedChapters.push({
          title: chapter[0],
          subtitle: "",
          content: `<p><em>Failed to download this chapter.</em></p>`,
        });
      }

      this.downloaded = i + 1;

      if (i < allChapters.length - 1 && !this.cancelled) {
        await this._sleep(4000);
      }
    }

    if (this.cancelled) return null;

    onProgress?.({ phase: "pack", status: "Creating EPUB file...", current: this.total, total: this.total });

    const blob = await this._createEpub(info, downloadedChapters, coverBase64);

    const filename = this._sanitizeFilename(info.nome) + ".epub";
    this._downloadFile(blob, filename);

    return blob;
  }

  async _fetchChapter(novelId, chapterId) {
    const [source, ...idParts] = novelId.split("-");
    const id = idParts.join("-");

    switch (source) {
      case "central":
        return this.api.centralGetChapter(chapterId);
      case "illusia":
        return this.api.illusiaGetChapter(id, chapterId);
      case "mania":
        return this.api.maniaGetChapter(id, chapterId);
      default:
        throw new Error("Unknown source");
    }
  }

  async _downloadCover(coverUrl, source) {
    if (!coverUrl) return null;

    try {
      const fullUrl = this._resolveUrl(coverUrl, source);
      const res = await fetch(this.api.proxy + fullUrl);
      const blob = await res.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  _resolveUrl(url, source) {
    if (url.startsWith("http")) return url;

    const domains = {
      central: "https://centralnovel.com",
      illusia: "https://illusia.com.br",
      mania: "https://novelmania.com.br",
    };

    const domain = domains[source];
    if (!domain) return url;

    return url.startsWith("/") ? domain + url : `${domain}/${url}`;
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancel() {
    this.cancelled = true;
  }

  async _createEpub(info, chapters, coverBase64) {
    const zip = new JSZip();

    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    zip.file(
      "META-INF/container.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    let manifestItems = "";
    let spineItems = "";
    let tocItems = "";

    chapters.forEach((ch, i) => {
      const filename = `chapter_${String(i + 1).padStart(3, "0")}.xhtml`;
      const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this._escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body>
  <h1>${this._escapeXml(ch.title)}</h1>
  ${ch.subtitle ? `<h2>${this._escapeXml(ch.subtitle)}</h2>` : ""}
  <hr/>
  ${ch.content}
</body>
</html>`;

      zip.file(`OEBPS/${filename}`, xhtml);

      manifestItems += `    <item id="chapter${i + 1}" href="${filename}" media-type="application/xhtml+xml"/>\n`;
      spineItems += `    <itemref idref="chapter${i + 1}"/>\n`;
      tocItems += `      <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
        <navLabel><text>${this._escapeXml(ch.title)}</text></navLabel>
        <content src="${filename}"/>
      </navPoint>\n`;
    });

    let coverManifest = "";
    let coverMeta = "";
    if (coverBase64) {
      const match = coverBase64.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const mediaType = mimeType.includes("png") ? "image/png" : "image/jpeg";

        zip.file(`OEBPS/cover.${ext}`, data, { base64: true });
        coverManifest = `    <item id="cover-image" href="cover.${ext}" media-type="${mediaType}"/>\n`;
        coverMeta = `    <meta name="cover" content="cover-image"/>\n`;
      }
    }

    zip.file(
      "OEBPS/styles/style.css",
      `body {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.8;
  color: #333;
  padding: 1em;
}
h1 { color: #222; margin-bottom: 0.5em; font-size: 1.5em; }
h2 { color: #666; font-size: 0.9em; margin-bottom: 1em; font-weight: normal; }
hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
p { margin-bottom: 1em; text-indent: 1.5em; text-align: justify; }
img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
`
    );

    zip.file(
      "OEBPS/content.opf",
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${this._escapeXml(info.nome)}</dc:title>
    <dc:language>pt-BR</dc:language>
    <dc:identifier id="BookId">uninovel-${Date.now()}</dc:identifier>
    <dc:description>${this._escapeXml(info.desc || "")}</dc:description>
    <dc:publisher>UniNovel</dc:publisher>
    <dc:date>${new Date().toISOString().split("T")[0]}</dc:date>
${coverMeta}  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="styles/style.css" media-type="text/css"/>
${coverManifest}${manifestItems}  </manifest>
  <spine toc="ncx">
${spineItems}  </spine>
</package>`
    );

    zip.file(
      "OEBPS/toc.ncx",
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="uninovel-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${this._escapeXml(info.nome)}</text></docTitle>
  <navMap>
${tocItems}  </navMap>
</ncx>`
    );

    return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
  }

  _escapeXml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  _sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 100);
  }

  _downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

if (typeof window !== "undefined") {
  window.EpubDownloader = EpubDownloader;
}
