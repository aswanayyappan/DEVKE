import * as cheerio from 'cheerio';
import { MarkdownSection } from './markdown-parser.js';

export class HtmlParser {
  public parse(htmlText: string): MarkdownSection[] {
    const $ = cheerio.load(htmlText);

    // Strip scripts, styles, nav, footer, ads, svg
    $('script, style, nav, footer, header, aside, .ad, .ads, .sidebar, svg').remove();

    const sections: MarkdownSection[] = [];
    const mainContent = $('main, article, .content, #content, body').first();

    mainContent.find('h1, h2, h3, h4').each((_, elem) => {
      const heading = $(elem);
      const title = heading.text().trim();
      const level = parseInt(elem.tagName.replace('h', ''), 10) || 2;

      // Collect sibling elements until next heading
      const contentParts: string[] = [];
      const codeBlocks: { language: string; code: string }[] = [];

      let next = heading.next();
      while (next.length && !next.is('h1, h2, h3, h4')) {
        if (next.is('pre')) {
          const code = next.find('code').text() || next.text();
          const lang = next.find('code').attr('class')?.replace(/language-/, '') || 'text';
          codeBlocks.push({ language: lang, code });
          contentParts.push(`\`\`\`${lang}\n${code}\n\`\`\``);
        } else {
          const text = next.text().trim();
          if (text) contentParts.push(text);
        }
        next = next.next();
      }

      if (title && (contentParts.length > 0 || codeBlocks.length > 0)) {
        sections.push({
          title,
          level,
          content: contentParts.join('\n\n'),
          codeBlocks,
        });
      }
    });

    if (sections.length === 0) {
      sections.push({
        title: $('title').text().trim() || 'Overview',
        level: 1,
        content: mainContent.text().trim().slice(0, 2000),
        codeBlocks: [],
      });
    }

    return sections;
  }
}
