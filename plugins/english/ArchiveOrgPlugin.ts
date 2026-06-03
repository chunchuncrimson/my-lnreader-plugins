import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class ArchiveOrgPlugin implements Plugin.PluginBase {
  id = 'archiveorg';
  name = 'Archive.org (Books)';
  icon = 'plugins/english/archiveorg/icon.png';
  site = 'https://archive.org/';
  version = '1.0.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}details/texts?sort=-downloads&page=${pageNo}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const novels: Plugin.NovelItem[] = [];
    $('.item-ia').each((i, el) => {
      const name = $(el).find('.title').text().trim();
      const path = $(el).find('a').attr('href')?.substring(1) || '';
      const cover = $(el).find('img').attr('src') || defaultCover;

      if (name && path) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.site + novelPath;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const identifier = novelPath.split('/').pop();
    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.item-title').text().trim() || 'Untitled',
      cover: `https://archive.org/services/img/${identifier}`,
      author: $('.metadata-definition:contains("Author")').next().text().trim(),
      status: NovelStatus.Completed,
      summary: $('.item-description').text().trim(),
      chapters: [
        {
          name: 'Full Text',
          path: `stream/${identifier}/${identifier}_djvu.txt`,
          releaseTime: '',
          chapterNumber: 1,
        },
      ],
    };

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + chapterPath;
    const result = await fetchApi(url);
    const body = await result.text();
    // Return as pre-formatted text since it's a .txt file
    return `<pre>${body}</pre>`;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}advancedsearch.php?q=${searchTerm}+AND+mediatype:texts&output=json`;
    const result = await fetchApi(url);
    const data = await result.json();

    const novels: Plugin.NovelItem[] = [];
    data.response.docs.forEach((doc: any) => {
      novels.push({
        name: doc.title,
        path: `details/${doc.identifier}`,
        cover: `https://archive.org/services/img/${doc.identifier}`,
      });
    });

    return novels;
  }

  resolveUrl = (path: string) => this.site + path;
}

export default new ArchiveOrgPlugin();
