import * as vscode from 'vscode';
import { GitService } from '../utils/GitService';
import { formatDate, formatDiffDays } from '../utils/helpers';

export class GitFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
  private gitService: GitService;
  private cache: Map<string, vscode.FileDecoration | null> = new Map();

  constructor() {
    this.gitService = new GitService();
  }

  clearCache() {
    this.cache.clear();
  }

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    if (!vscode.workspace.getConfiguration('git-file-age').get('enabled')) {
      return undefined;
    }
    const filePath = uri.fsPath;

    this.loadGitInfo(uri, filePath);

    if (this.cache.has(filePath)) {
      return this.cache.get(filePath) || undefined;
    }

    return {
      badge: '•',
      tooltip: 'Loading git info...'
    };
  }

  private async loadGitInfo(uri: vscode.Uri, filePath: string) {
    const info = await this.gitService.getGitInfo(filePath);
    let decoration: vscode.FileDecoration | null = null;

    if (info) {
      const now = new Date();
      const diffDays = (now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24);
      const tooltip = `Last modified: ${formatDate(info.date)} by ${info.author}, ${Math.round(diffDays)} days ago`;

      const config = vscode.workspace.getConfiguration('git-file-age');
      const recentThreshold = config.get('recentThresholdDays', 7);
      const oldThreshold = config.get('oldThresholdDays', 365);

      let color: vscode.ThemeColor | undefined;
      if (recentThreshold > 0 && diffDays <= recentThreshold) {
        color = new vscode.ThemeColor('gitDecoration.untrackedResourceForeground');
      } else if (oldThreshold > 0 && diffDays >= oldThreshold) {
        color = new vscode.ThemeColor('gitDecoration.ignoredResourceForeground');
      } else {
        color = undefined;
      }

      decoration = {
        badge: formatDiffDays(diffDays),
        tooltip,
        color,
      };
    }

    if (JSON.stringify(this.cache.get(filePath)) !== JSON.stringify(decoration)) {
      this.cache.set(filePath, decoration);
      this.refresh(uri);
    }
  }

  refresh(uri?: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri);
  }
}

