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

    if (this.cache.has(filePath)) {
      return this.cache.get(filePath) || undefined;
    }

    this.loadGitInfo(uri, filePath);

    return {
      badge: '•',
      tooltip: 'Loading git info...'
    };
  }

  private async loadGitInfo(uri: vscode.Uri, filePath: string) {
    const info = await this.gitService.getGitInfo(filePath);
    if (!info) {
      this.cache.set(filePath, null);
      this.refresh(uri);
      return;
    }

    const now = new Date();
    const diffDays = (now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24);
    const tooltip = `Last modified: ${formatDate(info.date)} by ${info.author}, ${Math.round(diffDays)} days ago`;

    const config = vscode.workspace.getConfiguration('git-file-age');
    const recentThreshold = config.get('recentThresholdDays', 7);
    const oldThreshold = config.get('oldThresholdDays', 100);

    let color: vscode.ThemeColor | undefined;
    if (diffDays <= recentThreshold) {
      color = new vscode.ThemeColor('gitDecoration.untrackedResourceForeground');
    } else if (diffDays >= oldThreshold) {
      color = new vscode.ThemeColor('gitDecoration.ignoredResourceForeground');
    } else {
      color = undefined;
    }

    const decoration = {
      badge: formatDiffDays(diffDays),
      tooltip,
      color,
    };

    this.cache.set(filePath, decoration);
    this.refresh(uri);
  }

  refresh(uri?: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri);
  }
}

