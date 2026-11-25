export interface SourceItem {
  id: string;
  name: string;
  ecosystem: string;
  url: string;
  version?: string;
  license?: string;
}

export interface RawDocumentPayload {
  item: SourceItem;
  content: string;
  contentType: 'html' | 'markdown' | 'api_json';
  retrievalDate: Date;
  license: string;
  rawMetadata?: Record<string, unknown>;
}

export interface IDocumentationSource {
  id: string;
  name: string;
  ecosystem: string;
  discover(query?: string): Promise<SourceItem[]>;
  fetch(item: SourceItem): Promise<RawDocumentPayload>;
}

export abstract class BaseConnector implements IDocumentationSource {
  abstract id: string;
  abstract name: string;
  abstract ecosystem: string;

  abstract discover(query?: string): Promise<SourceItem[]>;
  abstract fetch(item: SourceItem): Promise<RawDocumentPayload>;

  protected async safeFetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'UDKE-Documentation-Engine/1.0 (+https://github.com/udke)',
          'Accept': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  protected async safeFetchText(url: string, headers: Record<string, string> = {}): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'UDKE-Documentation-Engine/1.0 (+https://github.com/udke)',
          'Accept': 'text/html, text/markdown, text/plain',
          ...headers,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch {
      return null;
    }
  }
}
