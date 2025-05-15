import * as vscode from 'vscode';
import { GitService } from '../utils/GitService';
import { formatDate, formatDiffDays } from '../utils/helpers';

export class GitFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
  private gitService: GitService;

  constructor() {
    this.gitService = new GitService();
  }

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    const filePath = uri.fsPath;

    const info = await this.gitService.getGitInfo(filePath);
    if (!info) {
      return undefined;
    }

    const now = new Date();
    const diffDays = (now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24);
    const tooltip = `Last modified: ${formatDate(info.date)} by ${info.author}, ${Math.round(diffDays)} days ago`;

    return {
      badge: formatDiffDays(diffDays),
      tooltip,
      color: diffDays >= 100 ? new vscode.ThemeColor('git.blame.editorDecorationForeground') : undefined,
    };
  }

  // Method to trigger decoration updates
  refresh(uri?: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri || []);
  }
}
