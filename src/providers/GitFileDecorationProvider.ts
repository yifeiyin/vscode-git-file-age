import * as vscode from 'vscode';
import { GitService } from '../utils/GitService';
import { formatDate } from '../utils/helpers';

export class GitFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
  private gitService: GitService;

  constructor() {
    this.gitService = new GitService();
  }

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    const filePath = uri.fsPath;

    // Skip node_modules and .git directories
    if (filePath.includes('node_modules') || filePath.includes('.git')) {
      return undefined;
    }

    const info = await this.gitService.getGitInfo(filePath);
    if (!info) {
      return undefined;
    }

    const now = new Date();
    const diffDays = (now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24);
    const tooltip = `Last modified: ${formatDate(info.date)} by ${info.author}, ${Math.round(diffDays)} days ago`;

    if (diffDays >= 100) {
      const years = diffDays / 365;
      const months = Math.round(diffDays / 30);
      let badge: string;

      if (months < 10) {
        badge = months.toString() + 'm';
      } else {
        // Show whole years from 1 to 9
        badge = Math.min(Math.round(years), 9) + 'y';
      }

      return {
        badge,
        tooltip,
        color: new vscode.ThemeColor('git.blame.editorDecorationForeground'),
      };
    }

    // For files less than 100 days old, show days
    return {
      badge: Math.round(diffDays).toString(),
      tooltip,
    };
  }

  // Method to trigger decoration updates
  refresh(uri?: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri || []);
  }
}
