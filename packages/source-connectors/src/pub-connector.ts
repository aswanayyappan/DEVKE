import { BaseConnector, SourceItem, RawDocumentPayload } from './base-connector.js';

interface PubPackageResponse {
  name: string;
  latest: {
    version: string;
    pubspec: {
      name: string;
      description?: string;
      homepage?: string;
      repository?: string;
      environment?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
  };
}

export class PubDevConnector extends BaseConnector {
  public readonly id = 'connector.pubdev';
  public readonly name = 'Pub.dev Flutter & Dart Registry Connector';
  public readonly ecosystem = 'Dart/Flutter';

  public async discover(query: string = 'flutter'): Promise<SourceItem[]> {
    const url = `https://pub.dev/api/search?q=${encodeURIComponent(query)}`;
    const data = await this.safeFetchJson<{
      packages: Array<{ package: string }>;
    }>(url);

    if (!data?.packages) return [];

    return data.packages.slice(0, 10).map(p => ({
      id: `pub.${p.package}`,
      name: p.package,
      ecosystem: this.ecosystem,
      url: `https://pub.dev/packages/${p.package}`,
    }));
  }

  public async fetch(item: SourceItem): Promise<RawDocumentPayload> {
    const url = `https://pub.dev/api/packages/${encodeURIComponent(item.name)}`;
    const data = await this.safeFetchJson<PubPackageResponse>(url);

    if (!data) {
      throw new Error(`Failed to retrieve pub.dev package metadata for '${item.name}'`);
    }

    const version = data.latest.version;
    const pubspec = data.latest.pubspec;

    // Fetch README
    const readmeUrl = `https://pub.dev/api/packages/${encodeURIComponent(item.name)}/versions/${version}/readme`;
    const readmeData = await this.safeFetchJson<{ content?: string }>(readmeUrl);
    const content = readmeData?.content || `# ${item.name}\n\n${pubspec.description || 'No description provided.'}`;

    return {
      item: {
        ...item,
        version,
        license: 'BSD-3-Clause',
        url: `https://pub.dev/packages/${item.name}`,
      },
      content,
      contentType: 'markdown',
      retrievalDate: new Date(),
      license: 'BSD-3-Clause',
      rawMetadata: {
        description: pubspec.description,
        repository_url: pubspec.repository || pubspec.homepage,
        environment: pubspec.environment,
      },
    };
  }
}
