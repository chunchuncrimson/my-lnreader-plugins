import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class WattpadPlugin implements Plugin.PluginBase {
  id = 'wattpad';
  name = 'Wattpad';
  icon = 'plugins/english/wattpad/icon.png';
  site = 'https://www.wattpad.com/';
  version = '1.0.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}search/stories?page=${pageNo}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const novels: Plugin.NovelItem[] = [];
    $('.story-card-container').each((i, el) => {
      const name = $(el).find('.story-title').text().trim();
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

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.story-info__title').text().trim() || 'Untitled',
      cover: $('.story-cover img').attr('src') || defaultCover,
      author: $('.author-info__name').text().trim(),
      status: NovelStatus.Ongoing,
      summary: $('.description').text().trim(),
      chapters: [],
    };

    $('.table-of-contents a').each((i, el) => {
      const name = $(el).text().trim();
      const path = $(el).attr('href')?.substring(1) || '';
      if (name && path) {
        novel.chapters?.push({
          name,
          path,
          releaseTime: '',
          chapterNumber: i + 1,
        });
      }
    });

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + chapterPath;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const chapterText =
      $('.story-panel pre').html() || $('.story-content').html() || '';
    return chapterText;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}search/${searchTerm}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const novels: Plugin.NovelItem[] = [];
    $('.story-card-container').each((i, el) => {
      const name = $(el).find('.story-title').text().trim();
      const path = $(el).find('a').attr('href')?.substring(1) || '';
      const cover = $(el).find('img').attr('src') || defaultCover;

      if (name && path) {
        novels.push({ name, path, cover });
      }
    });

    return novels;
  }

  resolveUrl = (path: string) => this.site + path;
}

export default new WattpadPlugin();
