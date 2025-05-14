// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

class GitFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  // Function to get git root directory for a file
  private async getGitRoot(filePath: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`git rev-parse --show-toplevel`, { cwd: path.dirname(filePath) });
      return stdout.trim();
    } catch (error) {
      console.error(`Error getting git root for ${filePath}:`, error);
      return null;
    }
  }

  // Function to get git modification date for a file
  private async getGitInfo(filePath: string): Promise<{ date: Date, author: string } | null> {
    try {
      const gitRoot = await this.getGitRoot(filePath);
      if (!gitRoot) {
        return null;
      }

      // Get relative path from git root
      const relativePath = path.relative(gitRoot, filePath);

      // Execute git log from the git root directory
      const { stdout } = await execAsync(`git log -1 --format=%ct -- "${relativePath}"`, { cwd: gitRoot });
      const { stdout: authorOut } = await execAsync(`git log -1 --format=%an -- "${relativePath}"`, { cwd: gitRoot });
      const author = authorOut.trim();
      const timestamp = parseInt(stdout.trim());

      if (isNaN(timestamp)) {
        return null;
      }
      return { date: new Date(timestamp * 1000), author: author };
    } catch (error) {
      console.error(`Error getting git date for ${filePath}:`, error);
      return null;
    }
  }

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    const filePath = uri.fsPath;

    // Skip node_modules and .git directories
    if (filePath.includes('node_modules') || filePath.includes('.git')) {
      return undefined;
    }

    const info = await this.getGitInfo(filePath);
    if (!info) {
      return undefined;
    }

    const now = new Date();
    const diffDays = (now.getTime() - info.date.getTime()) / (1000 * 60 * 60 * 24);
    const tooltip = `Modified on ${formatDate(info.date)} by ${info.author}`;

    // 🟢 ⚪️🟡🟠🟣🟤⚫️
    if (diffDays >= 100) {
      const years = diffDays / 365;
      let badge: string;

      if (years < 1) {
        // Show decimal years for less than 1 year
        badge = '.' + Math.round(years * 10);
      } else if (years < 9) {
        // Show whole years from 1 to 9
        badge = Math.round(years) + 'y';
      } else {
        // Show 9+ for 9 years or more
        badge = '9+';
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('GitViz extension is now active!');

  const decorationProvider = new GitFileDecorationProvider();
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  // Watch for file system changes
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*');

  fileSystemWatcher.onDidChange(uri => {
    decorationProvider.refresh(uri);
  });

  fileSystemWatcher.onDidCreate(uri => {
    decorationProvider.refresh(uri);
  });

  // Update decorations when switching workspaces
  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    decorationProvider.refresh();
  });

  // Initial decoration update
  decorationProvider.refresh();
}

// This method is called when your extension is deactivated
export function deactivate() { }
