import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class WattpadPlugin implements Plugin.PluginBase {
  id = 'wattpad';
  name = 'Wattpad';
  icon = 'plugins/english/wattpad/icon.png';
  site = 'https://www.wattpad.com';
  version = '1.1.1';

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const offset = (pageNo - 1) * 20;
    const url = `${this.site}/api/v3/stories?offset=${offset}&limit=20`;

    const res = await fetchApi(url);
    const data = await res.json();

    const novels: Plugin.NovelItem[] = [];
    if (data.stories) {
      for (const story of data.stories) {
        novels.push({
          name: story.title,
          path: String(story.id),
          cover: story.cover || defaultCover,
        });
      }
    }

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = `${this.site}/api/v3/stories/${novelPath}`;
    const res = await fetchApi(url);
    const data = await res.json();

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: data.title,
      author: data.user?.name,
      cover: data.cover || defaultCover,
      summary: data.description,
      genres: data.tags?.join(', '),
      status: data.completed ? NovelStatus.Completed : NovelStatus.Ongoing,
      chapters: [],
    };

    const chapters: Plugin.ChapterItem[] = [];
    let chapterNumber = 1;

    if (data.parts) {
      for (const part of data.parts) {
        chapters.push({
          name: part.title,
          path: String(part.id),
          releaseTime: part.createDate,
          chapterNumber: chapterNumber++,
        });
      }
    }

    novel.chapters = chapters;
    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = `${this.site}/apiv2/storytext?id=${chapterPath}`;
    const res = await fetchApi(url);

    const text = await res.text();

    console.log(text);

    return text;
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const offset = (pageNo - 1) * 20;
    const url = `${this.site}/api/v3/search/stories?q=${encodeURIComponent(searchTerm)}&offset=${offset}&limit=20`;

    const res = await fetchApi(url);
    const data = await res.json();

    const novels: Plugin.NovelItem[] = [];
    if (data.stories) {
      for (const story of data.stories) {
        novels.push({
          name: story.title,
          path: String(story.id),
          cover: story.cover || defaultCover,
        });
      }
    }

    return novels;
  }

  resolveUrl = (path: string) => `${this.site}/story/${path}`;
}

export default new WattpadPlugin();
