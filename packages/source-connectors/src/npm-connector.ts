import { BaseConnector, SourceItem, RawDocumentPayload } from './base-connector.js';

interface NpmRegistryResponse {
  name: string;
  description?: string;
  'dist-tags'?: { latest?: string };
  readme?: string;
  homepage?: string;
  repository?: { url?: string } | string;
  license?: string;
  versions?: Record<string, {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
  }>;
}

export class NpmConnector extends BaseConnector {
  public readonly id = 'connector.npm';
  public readonly name = 'npm Package Registry Connector';
  public readonly ecosystem = 'JavaScript/TypeScript';

  public async discover(query: string = 'express'): Promise<SourceItem[]> {
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`;
    const data = await this.safeFetchJson<{
      objects: Array<{
        package: {
          name: string;
          version: string;
          description?: string;
          links?: { npm?: string; repository?: string };
        };
      }>;
    }>(url);

    if (!data?.objects) return [];

    return data.objects.map(obj => ({
      id: `npm.${obj.package.name}`,
      name: obj.package.name,
      ecosystem: this.ecosystem,
      url: obj.package.links?.npm || `https://www.npmjs.com/package/${obj.package.name}`,
      version: obj.package.version,
    }));
  }

  public async fetch(item: SourceItem): Promise<RawDocumentPayload> {
    const url = `https://registry.npmjs.org/${encodeURIComponent(item.name)}`;
    const data = await this.safeFetchJson<NpmRegistryResponse>(url);

    if (!data) {
      throw new Error(`Failed to retrieve npm package metadata for '${item.name}'`);
    }

    const latestVersion = data['dist-tags']?.latest || item.version || 'latest';
    const rawRepo = typeof data.repository === 'string' ? data.repository : data.repository?.url;
    const cleanRepo = rawRepo ? rawRepo.replace(/^git\+/, '').replace(/\.git$/, '') : undefined;

    return {
      item: {
        ...item,
        version: latestVersion,
        license: data.license || 'MIT',
        url: item.url,
      },
      content: data.readme || data.description || `# ${data.name}\n\nNo README documentation provided.`,
      contentType: 'markdown',
      retrievalDate: new Date(),
      license: data.license || 'MIT',
      rawMetadata: {
        description: data.description,
        repository_url: cleanRepo,
        homepage: data.homepage,
        latest_version: latestVersion,
      },
    };
  }
}
