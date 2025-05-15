import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

class GitFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
  private gitRoot: string | null = null;

  // Function to get git root directory for a file
  private async getGitRoot(filePath: string): Promise<string | null> {
    if (this.gitRoot && path.dirname(filePath).startsWith(this.gitRoot)) {
      return this.gitRoot;
    }

    try {
      const { stdout } = await execAsync(`git rev-parse --show-toplevel`, { cwd: path.dirname(filePath) });
      this.gitRoot = stdout.trim();
      return this.gitRoot;
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

      const { stdout } = await execAsync(`git log -1 --format=%ct,%an -- "${filePath}"`, { cwd: gitRoot });
      const [timestamp, author] = stdout.trim().split(',');

      if (isNaN(Number(timestamp))) {
        return null;
      }
      return { date: new Date(Number(timestamp) * 1000), author: author };
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

class GitBlameProvider {
  private isEnabled: boolean = false;
  private activeEditor: vscode.TextEditor | undefined;
  private decorationType: vscode.TextEditorDecorationType;
  private loadingDecorationType: vscode.TextEditorDecorationType;
  private gitRoot: string | null = null;
  private maxLength: number = 20;
  private isLoading: boolean = false;

  constructor() {
    // Create decoration type for blame information
    this.decorationType = vscode.window.createTextEditorDecorationType({
      before: {
        margin: '0 0 0 0',
        color: new vscode.ThemeColor('git.blame.editorDecorationForeground')
      }
    });

    // Create decoration type for loading state
    this.loadingDecorationType = vscode.window.createTextEditorDecorationType({
      before: {
        margin: '0 0 0 0',
        contentText: '⏳ Loading…'.padEnd(this.maxLength + 1, '\u00A0'),
        fontStyle: 'normal',
        color: new vscode.ThemeColor('git.blame.editorDecorationForeground')
      }
    });

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      this.activeEditor = editor;
      if (this.isEnabled) {
        this.updateDecorations();
      }
    });
  }

  // Function to get color based on recency
  private getColorForDate(date: Date): string {
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      // Less than a week old - bright color
      return '#4CAF50'; // Green
    } else if (diffDays < 30) {
      // Less than a month old - medium color
      return '#2196F3'; // Blue
    } else if (diffDays < 90) {
      // Less than 3 months old - muted color
      return '#9C27B0'; // Purple
    } else if (diffDays < 365) {
      // Less than a year old - faded color
      return '#FF9800'; // Orange
    } else {
      // More than a year old - very faded color
      return '#9E9E9E'; // Grey
    }
  }

  // Function to format author name with consistent width
  private formatAuthor(author: string): string {
    if (author.length > this.maxLength) {
      return author.substring(0, this.maxLength) + '…';
    }
    return author.padEnd(this.maxLength + 1, '\u00A0');
  }

  // Function to get git root directory for a file
  private async getGitRoot(filePath: string): Promise<string | null> {
    if (this.gitRoot && path.dirname(filePath).startsWith(this.gitRoot)) {
      return this.gitRoot;
    }

    try {
      const { stdout } = await execAsync(`git rev-parse --show-toplevel`, { cwd: path.dirname(filePath) });
      this.gitRoot = stdout.trim();
      return this.gitRoot;
    } catch (error) {
      console.error(`Error getting git root for ${filePath}:`, error);
      return null;
    }
  }

  // Function to get git blame information for a file
  private async getGitBlame(filePath: string): Promise<Map<number, { author: string, date: Date }>> {
    try {
      const gitRoot = await this.getGitRoot(filePath);
      if (!gitRoot) {
        console.log('No git root found for:', filePath);
        return new Map();
      }

      console.log('Getting git blame for:', filePath);
      const { stdout } = await execAsync(`git blame --line-porcelain -- "${filePath}"`, { cwd: gitRoot });
      const lines = stdout.split('\n');
      const blameMap = new Map<number, { author: string, date: Date }>();
      let currentLine = 0;
      let currentAuthor = '';
      let currentDate = new Date();

      for (const line of lines) {
        if (line.startsWith('author ')) {
          currentAuthor = line.substring(7);
        } else if (line.startsWith('author-time ')) {
          currentDate = new Date(Number(line.substring(12)) * 1000);
        } else if (line.startsWith('\t')) {
          currentLine++;
          blameMap.set(currentLine, { author: currentAuthor, date: currentDate });
        }
      }

      console.log(`Found ${blameMap.size} blame entries for ${filePath}`);
      return blameMap;
    } catch (error) {
      console.error(`Error getting git blame for ${filePath}:`, error);
      return new Map();
    }
  }

  private async updateDecorations() {
    if (!this.activeEditor) {
      return;
    }

    const filePath = this.activeEditor.document.uri.fsPath;
    if (filePath.includes('node_modules') || filePath.includes('.git')) {
      return;
    }

    // Show loading state
    this.isLoading = true;
    const loadingDecorations: vscode.DecorationOptions[] = [];
    const document = this.activeEditor.document;

    for (let i = 0; i < document.lineCount; i++) {
      loadingDecorations.push({
        range: new vscode.Range(i, 0, i, 0)
      });
    }

    this.activeEditor.setDecorations(this.loadingDecorationType, loadingDecorations);
    this.activeEditor.setDecorations(this.decorationType, []);

    try {
      const blameMap = await this.getGitBlame(filePath);
      if (blameMap.size === 0) {
        console.log('No blame information found');
        return;
      }

      const decorations: vscode.DecorationOptions[] = [];

      for (let i = 0; i < document.lineCount; i++) {
        const lineNumber = i + 1;
        const blameInfo = blameMap.get(lineNumber);
        if (blameInfo) {
          const diffDays = (new Date().getTime() - blameInfo.date.getTime()) / (1000 * 60 * 60 * 24);
          const tooltip = new vscode.MarkdownString(
            `**Last modified:** ${formatDate(blameInfo.date)} (${Math.round(diffDays)} days ago)\n\n` +
            `**Author:** ${blameInfo.author}\n`
          );
          tooltip.isTrusted = true;
          const color = this.getColorForDate(blameInfo.date);

          const range = new vscode.Range(i, 0, i, 0);
          decorations.push({
            range,
            renderOptions: {
              before: {
                contentText: this.formatAuthor(blameInfo.author),
                color: color,
                fontStyle: 'normal'
              },
            },
            hoverMessage: tooltip,
          });
        }
      }

      console.log(`Setting ${decorations.length} decorations`);
      this.activeEditor.setDecorations(this.loadingDecorationType, []);
      this.activeEditor.setDecorations(this.decorationType, decorations);
    } catch (error) {
      console.error('Error updating decorations:', error);
      // Clear loading state on error
      this.activeEditor.setDecorations(this.loadingDecorationType, []);
    } finally {
      this.isLoading = false;
    }
  }

  // Method to toggle blame display
  toggle() {
    this.isEnabled = !this.isEnabled;
    console.log('Toggled blame display:', this.isEnabled);

    if (this.activeEditor) {
      if (this.isEnabled) {
        this.updateDecorations();
      } else {
        this.activeEditor.setDecorations(this.decorationType, []);
        this.activeEditor.setDecorations(this.loadingDecorationType, []);
      }
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('GitViz extension is now active');
  const decorationProvider = new GitFileDecorationProvider();
  const blameProvider = new GitBlameProvider();

  // Register file decoration providers
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  // Register command to toggle blame display
  let disposable = vscode.commands.registerCommand('gitviz.toggleBlame', () => {
    console.log('Toggle blame command triggered');
    blameProvider.toggle();
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }
