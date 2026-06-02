import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class OrlandriPlugin implements Plugin.PluginBase {
  id = 'orlandritl';
  name = 'Orlandri Translation Company';
  icon = 'plugins/english/orlandritl/icon.png';
  site = 'https://orlandritl.wordpress.com/';
  version = '1.0.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    return [
      {
        name: 'SukaMoka (Sequel)',
        path: 'translated-chapters/',
        cover: defaultCover,
      },
    ];
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = this.site + novelPath;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = loadCheerio(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: 'SukaMoka (Sequel)',
      cover: defaultCover,
      status: NovelStatus.Ongoing,
      summary:
        'Fan translations for SukaMoka and other works by Orlandri Translation Company.',
      chapters: [],
    };

    $('.entry-content a').each((i, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr('href') || '';

      if (href.includes('sukamoka-vol') || href.includes('chapter')) {
        const path = href.replace(this.site, '');
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

    const chapterText = $('.entry-content').html() || '';
    return chapterText;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    const novels = await this.popularNovels(1);
    return novels.filter(n =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  resolveUrl = (path: string) => this.site + path;
}

export default new OrlandriPlugin();
