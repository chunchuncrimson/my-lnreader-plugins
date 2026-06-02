import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class WorldEndPlugin implements Plugin.PluginBase {
  id = 'worldend';
  name = 'WorldEnd Formatting Project';
  icon = 'plugins/english/worldend/icon.png';
  site = 'https://worldend.github.io/';
  version = '1.0.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    if (pageNo > 1) return [];

    return [
      {
        name: 'WorldEnd (SukaSuka)',
        path: 'releases.html',
        cover:
          'https://worldend.github.io/assets/images/volume_01/cover/front.png',
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
      name: 'WorldEnd (SukaSuka)',
      cover:
        'https://worldend.github.io/assets/images/volume_01/cover/front.png',
      status: NovelStatus.Completed,
      summary:
        'Releases for WorldEnd (SukaSuka) that mimic the official Yen Press style.',
      chapters: [],
    };

    // Select all links that look like chapter links
    $('a[href^="/releases/"]').each((i, el) => {
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
      $('article').html() || $('.content').html() || $('body').html() || '';
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

export default new WorldEndPlugin();
