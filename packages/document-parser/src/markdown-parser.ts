export interface ExtractedCodeBlock {
  language: string;
  code: string;
  title?: string;
}

export interface MarkdownSection {
  title: string;
  level: number;
  content: string;
  codeBlocks: ExtractedCodeBlock[];
}

export class MarkdownParser {
  public parse(markdownText: string): MarkdownSection[] {
    const lines = markdownText.split(/\r?\n/);
    const sections: MarkdownSection[] = [];

    let currentTitle = 'Overview';
    let currentLevel = 1;
    let currentLines: string[] = [];
    let currentCodeBlocks: ExtractedCodeBlock[] = [];
    let inCodeBlock = false;
    let currentCodeLang = '';
    let currentCodeLines: string[] = [];

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          currentCodeLang = line.trim().slice(3).trim() || 'text';
          currentCodeLines = [];
        } else {
          inCodeBlock = false;
          currentCodeBlocks.push({
            language: currentCodeLang,
            code: currentCodeLines.join('\n'),
          });
          currentLines.push(`\`\`\`${currentCodeLang}\n${currentCodeLines.join('\n')}\n\`\`\``);
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeLines.push(line);
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        if (currentLines.length > 0 || currentCodeBlocks.length > 0) {
          sections.push({
            title: currentTitle,
            level: currentLevel,
            content: currentLines.join('\n').trim(),
            codeBlocks: currentCodeBlocks,
          });
        }

        currentLevel = headingMatch[1].length;
        currentTitle = headingMatch[2].trim();
        currentLines = [];
        currentCodeBlocks = [];
      } else {
        currentLines.push(line);
      }
    }

    if (currentLines.length > 0 || currentCodeBlocks.length > 0) {
      sections.push({
        title: currentTitle,
        level: currentLevel,
        content: currentLines.join('\n').trim(),
        codeBlocks: currentCodeBlocks,
      });
    }

    return sections;
  }
}
