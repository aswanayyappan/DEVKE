import { BaseConnector, SourceItem, RawDocumentPayload } from './base-connector.js';

export class WebDocumentationConnector extends BaseConnector {
  public readonly id = 'connector.web';
  public readonly name = 'Official Web Documentation Portal Connector';
  public readonly ecosystem = 'Universal';

  public async discover(_query?: string): Promise<SourceItem[]> {
    return [
      {
        id: 'web.nodejs.docs',
        name: 'Node.js Official Documentation',
        ecosystem: 'Node.js',
        url: 'https://nodejs.org/docs/latest/api/',
      },
      {
        id: 'web.flutter.docs',
        name: 'Flutter Official Documentation',
        ecosystem: 'Flutter',
        url: 'https://docs.flutter.dev/',
      },
      {
        id: 'web.python.docs',
        name: 'Python Official Documentation',
        ecosystem: 'Python',
        url: 'https://docs.python.org/3/',
      },
    ];
  }

  public async fetch(item: SourceItem): Promise<RawDocumentPayload> {
    const rawHtml = await this.safeFetchText(item.url);

    if (!rawHtml) {
      throw new Error(`Failed to fetch web documentation from '${item.url}'`);
    }

    return {
      item,
      content: rawHtml,
      contentType: 'html',
      retrievalDate: new Date(),
      license: item.license || 'Permissive',
      rawMetadata: {
        source_url: item.url,
      },
    };
  }
}
