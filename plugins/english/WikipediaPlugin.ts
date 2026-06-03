import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class WikipediaPlugin implements Plugin.PluginBase {
  id = 'wikipedia';
  name = 'Wikipedia';
  icon = 'plugins/english/wikipedia/icon.png';
  site = 'https://en.wikipedia.org/';
  version = '1.0.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    return []; // Wikipedia doesn't have "popular novels" in the traditional sense
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.site + novelPath;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('#firstHeading').text().trim() || 'Untitled',
      cover: $('.infobox img').first().attr('src') || defaultCover,
      status: NovelStatus.Completed,
      summary: $('.mw-parser-output > p').first().text().trim(),
      chapters: [],
    };

    // Treat sections as chapters
    $('.mw-headline').each((i, el) => {
      const name = $(el).text().trim();
      const id = $(el).attr('id') || '';
      if (name && id) {
        novel.chapters?.push({
          name,
          path: `${novelPath}#${id}`,
          releaseTime: '',
          chapterNumber: i + 1,
        });
      }
    });

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const [path, hash] = chapterPath.split('#');
    const url = this.site + path;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    if (hash) {
      const section = $(`#${hash}`).parent();
      let content = '';
      let next = section.next();
      while (next.length && !next.is('h1, h2, h3, h4, h5, h6')) {
        content += next.html();
        next = next.next();
      }
      return content;
    }

    return $('.mw-parser-output').html() || '';
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}w/api.php?action=opensearch&search=${searchTerm}&limit=10&namespace=0&format=json`;
    const result = await fetchApi(url);
    const data = await result.json();

    const novels: Plugin.NovelItem[] = [];
    for (let i = 0; i < data[1].length; i++) {
      novels.push({
        name: data[1][i],
        path: `wiki/${data[1][i].replace(/ /g, '_')}`,
        cover: defaultCover,
      });
    }

    return novels;
  }

  resolveUrl = (path: string) => this.site + path;
}

export default new WikipediaPlugin();
