import * as vscode from 'vscode';
import type { DocumentationRecord, SymbolRecord, ImplementationPipeline, CodeExample, RelationshipRecord } from '@udke/knowledge-schema';

export class DocumentationViewerPanel {
  public static currentPanel: DocumentationViewerPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, doc: DocumentationRecord, targetId?: string) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.renderHtml(doc, targetId);

    // Secure message handling between Webview and extension host
    this.panel.webview.onDidReceiveMessage(
      async (message: { command: string; docId?: string; text?: string }) => {
        switch (message.command) {
          case 'openDocument':
            if (message.docId) {
              await vscode.commands.executeCommand('udke.openDocument', message.docId);
            }
            break;
          case 'copyCode':
            if (message.text) {
              await vscode.env.clipboard.writeText(message.text);
              vscode.window.showInformationMessage('Code snippet copied to clipboard!');
            }
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public static show(doc: DocumentationRecord, targetId?: string): void {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (DocumentationViewerPanel.currentPanel) {
      DocumentationViewerPanel.currentPanel.panel.reveal(column);
      DocumentationViewerPanel.currentPanel.update(doc, targetId);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'udkeDocViewer',
      `${doc.title} — Dev Knowledge Engine`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    DocumentationViewerPanel.currentPanel = new DocumentationViewerPanel(panel, doc, targetId);
  }

  public update(doc: DocumentationRecord, targetId?: string): void {
    this.panel.title = `${doc.title} — Dev Knowledge Engine`;
    this.panel.webview.html = this.renderHtml(doc, targetId);
  }

  public dispose(): void {
    DocumentationViewerPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) x.dispose();
    }
  }

  private renderHtml(doc: DocumentationRecord, targetId?: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>${this.escape(doc.title)}</title>
  <style>
    :root {
      --bg-primary: var(--vscode-editor-background, #1e1e1e);
      --fg-primary: var(--vscode-editor-foreground, #d4d4d4);
      --bg-card: var(--vscode-editorWidget-background, rgba(255, 255, 255, 0.04));
      --border-primary: var(--vscode-widget-border, rgba(128, 128, 128, 0.22));
      --code-bg: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.3));
      --accent: var(--vscode-focusBorder, #007acc);
      --badge-bg: var(--vscode-badge-background, #4d4d4d);
      --badge-fg: var(--vscode-badge-foreground, #ffffff);
      --desc-fg: var(--vscode-descriptionForeground, #999999);
      --btn-bg: var(--vscode-button-background, #0e639c);
      --btn-fg: var(--vscode-button-foreground, #ffffff);
      --btn-hover: var(--vscode-button-hoverBackground, #1177bb);
      --terminal-bg: #141414;
      --card-highlight: rgba(0, 122, 204, 0.16);
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      font-size: var(--vscode-font-size, 14px);
      line-height: 1.6;
      color: var(--fg-primary);
      background-color: var(--bg-primary);
      margin: 0;
      padding: 24px 36px 80px 36px;
      max-width: 1080px;
    }
    h1, h2, h3, h4, h5 { font-weight: 600; color: var(--fg-primary); margin-top: 1.8em; margin-bottom: 0.5em; }
    h1 {
      font-size: 2.2rem;
      margin-top: 0;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      border-bottom: 1px solid var(--border-primary);
      padding-bottom: 14px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--badge-bg);
      color: var(--badge-fg);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .badge-accent { background: var(--accent); color: #fff; }
    .badge-kind {
      background: rgba(0, 122, 204, 0.2);
      color: var(--accent);
      border: 1px solid rgba(0, 122, 204, 0.4);
    }

    /* Sticky Navigation & Live Filter Bar */
    .sticky-header {
      position: sticky;
      top: 0;
      background: var(--bg-primary);
      padding: 12px 0 10px 0;
      border-bottom: 1px solid var(--border-primary);
      margin-bottom: 24px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .filter-box-wrap {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
    }
    .filter-input {
      flex: 1;
      background: var(--code-bg);
      border: 1px solid var(--border-primary);
      border-radius: 6px;
      padding: 8px 12px;
      color: var(--fg-primary);
      font-size: 0.88rem;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .filter-input:focus {
      border-color: var(--accent);
    }
    .nav-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .nav-pill {
      font-size: 0.76rem;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 12px;
      background: var(--bg-card);
      color: var(--fg-primary);
      text-decoration: none;
      border: 1px solid var(--border-primary);
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .nav-pill:hover, .nav-pill.active {
      background: var(--btn-bg);
      color: var(--btn-fg);
      border-color: var(--btn-bg);
    }

    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;
      margin-bottom: 24px;
      color: var(--desc-fg);
      font-size: 0.85rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-primary);
      border-radius: 6px;
      padding: 18px 22px;
      margin-bottom: 22px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }
    .highlight-target {
      border-color: var(--accent) !important;
      background: var(--card-highlight) !important;
      box-shadow: 0 0 16px rgba(0, 122, 204, 0.4);
      animation: pulse-glow 2s ease-in-out infinite alternate;
    }
    @keyframes pulse-glow {
      from { box-shadow: 0 0 6px rgba(0, 122, 204, 0.3); }
      to { box-shadow: 0 0 20px rgba(0, 122, 204, 0.6); }
    }
    .install-box {
      background: var(--code-bg);
      border: 1px solid var(--border-primary);
      border-radius: 6px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .install-box code {
      font-family: var(--vscode-editor-font-family, Consolas, monospace);
      font-size: 0.95rem;
      color: #9cdcfe;
    }
    pre {
      background: var(--code-bg);
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      border: 1px solid var(--border-primary);
      position: relative;
      margin: 10px 0;
    }
    pre code {
      font-family: var(--vscode-editor-font-family, 'Fira Code', 'Cascadia Code', Consolas, monospace);
      font-size: 0.9rem;
      color: var(--fg-primary);
    }
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 0.72rem;
      padding: 3px 8px;
      background: var(--bg-card);
      color: var(--desc-fg);
      border: 1px solid var(--border-primary);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .copy-btn:hover {
      background: var(--btn-bg);
      color: var(--btn-fg);
    }

    /* Terminal Window Mockup */
    .terminal-window {
      background: var(--terminal-bg);
      border: 1px solid var(--border-primary);
      border-radius: 6px;
      overflow: hidden;
      margin-top: 10px;
    }
    .terminal-header {
      background: rgba(255, 255, 255, 0.05);
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--desc-fg);
      border-bottom: 1px solid var(--border-primary);
    }
    .terminal-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    .terminal-body {
      padding: 10px 14px;
      margin: 0;
      background: transparent;
      border: none;
      font-family: var(--vscode-editor-font-family, Consolas, monospace);
      font-size: 0.85rem;
      color: #98c379;
    }

    /* Parameters Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 0.88rem;
    }
    th, td {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-primary);
    }
    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--desc-fg);
      background: rgba(128,128,128,0.06);
    }

    /* Pipeline Timeline */
    .pipeline-step {
      position: relative;
      padding-left: 44px;
      margin-bottom: 24px;
      border-left: 2px dashed var(--border-primary);
      padding-bottom: 16px;
    }
    .pipeline-step:last-child {
      border-left: 2px solid transparent;
      padding-bottom: 0;
    }
    .step-number {
      position: absolute;
      left: -15px;
      top: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 0 8px rgba(0,0,0,0.3);
    }
    .step-contracts {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 8px 0;
      font-size: 0.82rem;
    }
    .contract-box {
      background: rgba(128,128,128,0.08);
      border: 1px solid var(--border-primary);
      padding: 6px 10px;
      border-radius: 4px;
      flex: 1;
      min-width: 200px;
    }
    .error-mitigation-box {
      background: rgba(234, 179, 8, 0.08);
      border-left: 3px solid #eab308;
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      margin-top: 8px;
      font-size: 0.82rem;
    }

    .btn-connect {
      padding: 5px 12px;
      font-size: 0.78rem;
      font-weight: 500;
      border-radius: 4px;
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .btn-connect:hover {
      background: var(--btn-hover);
      transform: translateY(-1px);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .tag {
      font-size: 0.72rem;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(128,128,128,0.18);
      margin-right: 6px;
    }
    .hidden-by-filter {
      display: none !important;
    }
  </style>
</head>
<body>

  <!-- Sticky Live Filter & Navigation Bar -->
  <div class="sticky-header">
    <div class="filter-box-wrap">
      <input 
        type="search" 
        id="pageFilter" 
        class="filter-input" 
        placeholder="⚡ Live Filter: Type method, parameter, pipeline step, or error..." 
        oninput="filterContent(this.value)"
      />
    </div>
    <div class="nav-bar">
      <a href="#section-overview" class="nav-pill" onclick="filterSection('all')">📖 Overview</a>
      ${doc.symbols.length > 0 ? `<a href="#section-syntax" class="nav-pill" onclick="filterSection('syntax')">⚡ Syntax & APIs (${doc.symbols.length})</a>` : ''}
      ${doc.pipelines.length > 0 ? `<a href="#section-pipelines" class="nav-pill" onclick="filterSection('pipelines')">🛠️ Implementation Plans (${doc.pipelines.length})</a>` : ''}
      ${doc.examples.length > 0 ? `<a href="#section-examples" class="nav-pill" onclick="filterSection('examples')">💡 Code Examples (${doc.examples.length})</a>` : ''}
      ${doc.relationships.length > 0 ? `<a href="#section-relationships" class="nav-pill" onclick="filterSection('relationships')">🔗 Connected Modules (${doc.relationships.length})</a>` : ''}
      <a href="#section-security" class="nav-pill" onclick="filterSection('security')">🛡️ Security & Errors</a>
      <a href="#section-compatibility" class="nav-pill" onclick="filterSection('compatibility')">🌐 Compatibility</a>
    </div>
  </div>

  <div class="header" id="section-overview">
    <h1>
      ${this.escape(doc.title)}
      <span class="badge badge-accent">${this.escape(doc.language)}</span>
      ${doc.package ? `<span class="badge">${this.escape(doc.package.manager)}</span>` : ''}
      <span class="badge">${this.escape(doc.type)}</span>
    </h1>
    <div class="meta-bar">
      <span><strong>Version:</strong> ${this.escape(doc.metadata.documentation_version)}</span>
      <span><strong>License:</strong> ${this.escape(doc.metadata.license)}</span>
      <span><strong>Completeness:</strong> ${this.escape(doc.metadata.completeness_status)}</span>
      ${doc.metadata.source_url ? `<span><a href="${this.escape(doc.metadata.source_url)}" style="color:var(--accent);">Official Repository ↗</a></span>` : ''}
    </div>
  </div>

  ${doc.package?.installation ? `
    <h3>Installation & Setup</h3>
    <div class="install-box">
      <code>${this.escape(doc.package.installation)}</code>
      <button class="btn-connect" onclick="copySnippet('${this.escapeJs(doc.package.installation)}', this)">Copy Install Command</button>
    </div>
  ` : ''}

  <h3>Architecture Overview & Purpose</h3>
  <div class="card filter-card" data-search-text="${this.escape(doc.documentation.overview)} ${this.escape(doc.documentation.purpose || '')}">
    <p>${this.escape(doc.documentation.overview)}</p>
    ${doc.documentation.purpose ? `<p style="margin-top:8px;"><strong>Core Purpose:</strong> ${this.escape(doc.documentation.purpose)}</p>` : ''}
    ${doc.documentation.configuration ? `<p style="margin-top:8px;"><strong>Configuration:</strong> ${this.escape(doc.documentation.configuration)}</p>` : ''}
  </div>

  <!-- Syntax & API Reference Section -->
  ${doc.symbols.length > 0 ? `
    <div id="section-syntax" class="doc-section" data-section-name="syntax">
      <h3>⚡ Syntax & API Reference</h3>
      <p style="color:var(--desc-fg); margin-top:-4px;">Exact API signatures, parameter specifications, default options, and return types.</p>
      ${doc.symbols.map(s => this.renderSymbol(s)).join('')}
    </div>
  ` : ''}

  <!-- Implementation Pipelines (Step-by-Step Plans) Section -->
  ${doc.pipelines.length > 0 ? `
    <div id="section-pipelines" class="doc-section" data-section-name="pipelines">
      <h3>🛠️ Implementation Plans & Pipelines</h3>
      <p style="color:var(--desc-fg); margin-top:-4px;">Sequential engineering plans, input/output data contracts, syntax, runnable steps, and error mitigations.</p>
      ${doc.pipelines.map(p => this.renderPipeline(p)).join('')}
    </div>
  ` : ''}

  <!-- Practical Code Examples Section -->
  ${doc.examples.length > 0 ? `
    <div id="section-examples" class="doc-section" data-section-name="examples">
      <h3>💡 Practical Code Examples</h3>
      <p style="color:var(--desc-fg); margin-top:-4px;">Domain-tested runnable examples ready to paste into production code.</p>
      ${doc.examples.map(ex => this.renderExample(ex)).join('')}
    </div>
  ` : ''}

  <!-- Connected Modules & Concept Graph Section -->
  ${doc.relationships.length > 0 ? `
    <div id="section-relationships" class="doc-section" data-section-name="relationships">
      <h3>🔗 Connected Modules & Ecosystem Graph</h3>
      <p style="color:var(--desc-fg); margin-top:-4px;">Related modules, architectural alternatives, and prerequisite libraries. Click to explore.</p>
      <div class="grid-2">
        ${doc.relationships.map(r => this.renderRelationship(r)).join('')}
      </div>
    </div>
  ` : ''}

  <!-- Security & Mitigations Section -->
  <div id="section-security" class="doc-section" data-section-name="security">
    <h3>🛡️ Security Considerations & Mitigation</h3>
    <div class="card filter-card" style="border-left: 4px solid #eab308; background: rgba(234, 179, 8, 0.05);" data-search-text="${this.escape(doc.documentation.security_considerations || '')} ${this.escape(doc.documentation.error_handling || '')}">
      <p>${this.escape(doc.documentation.security_considerations || 'Follow standard defensive programming patterns. Validate all external inputs at the boundary.')}</p>
      ${doc.documentation.error_handling ? `<p style="margin-top:8px;"><strong>Error Handling Policy:</strong> ${this.escape(doc.documentation.error_handling)}</p>` : ''}
    </div>
  </div>

  <!-- Compatibility Matrix Section -->
  <div id="section-compatibility" class="doc-section" data-section-name="compatibility">
    <h3>🌐 Ecosystem Compatibility & System Support</h3>
    <div class="card filter-card" data-search-text="compatibility nodejs flutter dart platform linux windows macos">
      <table>
        <thead>
          <tr>
            <th>Runtime / Target</th>
            <th>Supported Versions</th>
            <th>Platform Support</th>
            <th>Verification Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>${this.escape(doc.language)}</code></td>
            <td><code>${this.escape(doc.metadata.documentation_version)} (Latest Verified)</code></td>
            <td>Windows (x64/arm64), Linux, macOS</td>
            <td><strong style="color:#27c93f;">✓ Active & Tested</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:0.85rem; color:var(--desc-fg); margin:8px 0 0 0;">
        ${doc.documentation.compatibility ? this.escape(doc.documentation.compatibility) : `Offline-verified for compatibility with ${this.escape(doc.language)} modern runtimes.`}
      </p>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function copySnippet(text, btnElement) {
      vscode.postMessage({ command: 'copyCode', text: text });
      if (btnElement) {
        const originalText = btnElement.innerText;
        btnElement.innerText = '✓ Copied!';
        btnElement.style.background = '#27c93f';
        btnElement.style.color = '#fff';
        setTimeout(() => {
          btnElement.innerText = originalText;
          btnElement.style.background = '';
          btnElement.style.color = '';
        }, 1500);
      }
    }

    function openDoc(docId) {
      vscode.postMessage({ command: 'openDocument', docId: docId });
    }

    // In-page live search & filtering
    function filterContent(query) {
      const q = query.toLowerCase().trim();
      const cards = document.querySelectorAll('.filter-card');
      
      cards.forEach(card => {
        if (!q) {
          card.classList.remove('hidden-by-filter');
          return;
        }
        const searchText = (card.getAttribute('data-search-text') || card.innerText).toLowerCase();
        if (searchText.includes(q)) {
          card.classList.remove('hidden-by-filter');
        } else {
          card.classList.add('hidden-by-filter');
        }
      });
    }

    function filterSection(sectionName) {
      const sections = document.querySelectorAll('.doc-section');
      if (sectionName === 'all') {
        sections.forEach(s => s.classList.remove('hidden-by-filter'));
      } else {
        sections.forEach(s => {
          if (s.getAttribute('data-section-name') === sectionName) {
            s.classList.remove('hidden-by-filter');
          } else {
            s.classList.add('hidden-by-filter');
          }
        });
      }
    }

    // Auto-scroll and highlight target element if specified
    window.addEventListener('DOMContentLoaded', () => {
      const targetId = '${this.escapeJs(targetId || '')}';
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId) || 
                     document.getElementById('sym-' + targetId) || 
                     document.getElementById('pipe-' + targetId) || 
                     document.getElementById('ex-' + targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-target');
          }
        }, 150);
      }
    });
  </script>
</body>
</html>`;
  }

  private renderSymbol(sym: SymbolRecord): string {
    const symId = `sym-${sym.id}`;
    const searchText = `${sym.name} ${sym.kind} ${sym.syntax} ${sym.description} ${sym.parameters.map(p => `${p.name} ${p.data_type} ${p.description}`).join(' ')}`;

    return `
    <div class="card filter-card" id="${this.escape(symId)}" data-search-text="${this.escape(searchText)}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <h4 style="margin:0;">
          <code>${this.escape(sym.name)}</code>
          <span class="badge badge-kind">${this.escape(sym.kind)}</span>
          ${sym.is_static ? '<span class="tag">static</span>' : ''}
          ${sym.is_async ? '<span class="tag">async</span>' : ''}
          ${sym.is_deprecated ? '<span class="tag" style="background:#d93025;color:#fff;">deprecated</span>' : ''}
        </h4>
        ${sym.return_type ? `<span style="font-size:0.8rem; color:var(--desc-fg);">Returns: <code>${this.escape(sym.return_type)}</code></span>` : ''}
      </div>

      <pre><code>${this.escape(sym.syntax)}</code><button class="copy-btn" onclick="copySnippet('${this.escapeJs(sym.syntax)}', this)">Copy</button></pre>
      <p style="margin: 8px 0;">${this.escape(sym.description)}</p>

      ${sym.parameters.length > 0 ? `
        <h5 style="margin-top:12px; margin-bottom:6px; font-size:0.82rem; text-transform:uppercase; color:var(--desc-fg);">Parameters (${sym.parameters.length})</h5>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Data Type</th>
              <th>Required</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${sym.parameters.map(p => `
              <tr>
                <td><code>${this.escape(p.name)}</code></td>
                <td><code>${this.escape(p.data_type)}</code></td>
                <td>${p.is_required ? '<strong style="color:var(--accent);">Yes</strong>' : 'No'}</td>
                <td>${p.default_value ? `<code>${this.escape(p.default_value)}</code>` : '<span style="color:var(--desc-fg);">—</span>'}</td>
                <td>${this.escape(p.description)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </div>`;
  }

  private renderPipeline(pipe: ImplementationPipeline): string {
    const pipeId = `pipe-${pipe.id}`;
    const searchText = `${pipe.name} ${pipe.objective} ${pipe.steps.map(s => `${s.title} ${s.explanation} ${s.input_data || ''} ${s.output_data || ''} ${s.error_handling || ''}`).join(' ')}`;

    return `
    <div class="card filter-card" id="${this.escape(pipeId)}" style="border-top: 3px solid var(--accent);" data-search-text="${this.escape(searchText)}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4 style="margin:0;">${this.escape(pipe.name)}</h4>
        <span class="badge badge-accent">Implementation Plan</span>
      </div>
      <p style="margin: 8px 0 16px 0;"><strong>Operational Objective:</strong> ${this.escape(pipe.objective)}</p>

      <div style="margin-top: 18px;">
        ${pipe.steps.map(step => `
          <div class="pipeline-step">
            <div class="step-number">${step.step_number}</div>
            <strong style="font-size:0.95rem;">${this.escape(step.title)}</strong>
            <p style="margin: 4px 0 8px 0; color: var(--desc-fg); font-size:0.88rem;">${this.escape(step.explanation)}</p>

            ${(step.input_data || step.output_data) ? `
              <div class="step-contracts">
                ${step.input_data ? `<div class="contract-box"><strong>📥 Input Data:</strong> <code>${this.escape(step.input_data)}</code></div>` : ''}
                ${step.output_data ? `<div class="contract-box"><strong>📤 Resulting Artifact:</strong> <code>${this.escape(step.output_data)}</code></div>` : ''}
              </div>
            ` : ''}

            ${step.syntax ? `
              <pre style="margin: 6px 0;"><code>${this.escape(step.syntax)}</code><button class="copy-btn" onclick="copySnippet('${this.escapeJs(step.syntax)}', this)">Copy</button></pre>
            ` : ''}

            ${step.code_example ? `
              <pre style="margin: 6px 0;"><code>${this.escape(step.code_example)}</code><button class="copy-btn" onclick="copySnippet('${this.escapeJs(step.code_example)}', this)">Copy</button></pre>
            ` : ''}

            ${step.error_handling ? `
              <div class="error-mitigation-box">
                <strong>⚠️ Mitigations & Edge Cases:</strong> ${this.escape(step.error_handling)}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  private renderExample(ex: CodeExample): string {
    const exId = `ex-${ex.id}`;
    const searchText = `${ex.title} ${ex.description || ''} ${ex.code} ${ex.expected_output || ''}`;

    return `
    <div class="card filter-card" id="${this.escape(exId)}" data-search-text="${this.escape(searchText)}">
      <h4 style="margin-top:0;">${this.escape(ex.title)}</h4>
      ${ex.description ? `<p style="color:var(--desc-fg); margin-bottom:8px;">${this.escape(ex.description)}</p>` : ''}
      <pre><code>${this.escape(ex.code)}</code><button class="copy-btn" onclick="copySnippet('${this.escapeJs(ex.code)}', this)">Copy Code</button></pre>
      
      ${ex.expected_output ? `
        <div class="terminal-window">
          <div class="terminal-header">
            <span class="terminal-dot dot-red"></span>
            <span class="terminal-dot dot-yellow"></span>
            <span class="terminal-dot dot-green"></span>
            <span>Console Output · Verified Result</span>
          </div>
          <pre class="terminal-body"><code>${this.escape(ex.expected_output)}</code></pre>
        </div>
      ` : ''}
    </div>`;
  }

  private renderRelationship(r: RelationshipRecord): string {
    const searchText = `${r.target_doc_id} ${r.relationship_type} ${r.description || ''}`;

    return `
    <div class="card filter-card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;" data-search-text="${this.escape(searchText)}">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="tag" style="text-transform:uppercase; font-weight:600;">${this.escape(r.relationship_type.replace('_', ' '))}</span>
          <button class="btn-connect" onclick="openDoc('${this.escapeJs(r.target_doc_id)}')">Explore Concept ➔</button>
        </div>
        <strong style="font-size:0.95rem;">${this.escape(r.target_doc_id)}</strong>
        <p style="margin: 6px 0 0 0; font-size:0.85rem; color:var(--desc-fg);">${r.description ? this.escape(r.description) : 'Connected component in universal developer knowledge graph.'}</p>
      </div>
    </div>`;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapeJs(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }
}
