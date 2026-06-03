import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as loadCheerio } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class ArchiveOrgPlugin implements Plugin.PluginBase {
  id = 'archiveorg';
  name = 'Archive.org (Books Only)';
  icon = 'plugins/english/archiveorg/icon.png';
  site = 'https://archive.org/';
  version = '1.1.0';

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    // Added explicit filtering for text mediatype and common book formats in the query
    const url = `${this.site}details/texts?sort=-downloads&page=${pageNo}&and[]=mediatype%3A%22texts%22`;
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
    const identifier = novelPath.split('/').pop();
    const metadataUrl = `https://archive.org/metadata/${identifier}`;
    const result = await fetchApi(metadataUrl);
    const data = await result.json();

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: data.metadata.title || 'Untitled',
      cover: `https://archive.org/services/img/${identifier}`,
      author: data.metadata.creator || 'Unknown',
      status: NovelStatus.Completed,
      summary: data.metadata.description || '',
      chapters: [],
    };

    // Filter files for text-based formats (EPUB, TXT, PDF as fallback)
    // We prioritize EPUB and TXT for better reading experience in LNReader
    const textFiles = data.files.filter((file: any) => {
      const name = file.name.toLowerCase();
      return (
        name.endsWith('.epub') ||
        name.endsWith('.txt') ||
        name.endsWith('_djvu.txt')
      );
    });

    if (textFiles.length > 0) {
      textFiles.forEach((file: any, index: number) => {
        novel.chapters?.push({
          name: file.name,
          path: `download/${identifier}/${file.name}`,
          releaseTime: '',
          chapterNumber: index + 1,
        });
      });
    } else {
      // Fallback to the main landing page if no direct text files are found
      novel.chapters?.push({
        name: 'Full Text (Web View)',
        path: novelPath,
        releaseTime: '',
        chapterNumber: 1,
      });
    }

    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + chapterPath;
    const result = await fetchApi(url);
    const body = await result.text();

    if (chapterPath.endsWith('.txt')) {
      return `<pre style="white-space: pre-wrap;">${body}</pre>`;
    }

    // For EPUB or other formats, LNReader's internal engines usually handle the conversion
    // but if we are returning raw HTML for the app to render:
    const $ = loadCheerio(body);
    return $('.item-view').html() || body;
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    // Advanced search query to filter for texts and exclude common comic formats like CBR/CBZ
    const query = encodeURIComponent(
      `${searchTerm} AND mediatype:texts AND (format:epub OR format:txt)`,
    );
    const url = `${this.site}advancedsearch.php?q=${query}&output=json`;
    const result = await fetchApi(url);
    const data = await result.json();

    const novels: Plugin.NovelItem[] = [];
    if (data.response && data.response.docs) {
      data.response.docs.forEach((doc: any) => {
        novels.push({
          name: doc.title,
          path: `details/${doc.identifier}`,
          cover: `https://archive.org/services/img/${doc.identifier}`,
        });
      });
    }

    return novels;
  }

  resolveUrl = (path: string) => this.site + path;
}

export default new ArchiveOrgPlugin();
