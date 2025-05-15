import * as vscode from 'vscode';
import { GitService } from '../utils/GitService';
import { formatDate, getColorForDate, padRight } from '../utils/helpers';

export class GitBlameProvider {
  public isEnabled: boolean = false;

  private activeEditor: vscode.TextEditor | undefined;
  private decorationType: vscode.TextEditorDecorationType;
  private maxLength: number = 20;
  private gitService: GitService;

  constructor() {
    this.gitService = new GitService();

    // Create decoration type for blame information
    this.decorationType = vscode.window.createTextEditorDecorationType({
      before: {
        margin: '0 0 0 0',
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

    // Listen for cursor changes
    vscode.window.onDidChangeTextEditorSelection(event => {
      if (this.isEnabled) {
        this.updateDecorations();
      }
    });

    if (this.isEnabled) {
      this.updateDecorations();
    }
  }

  private async updateDecorations() {
    if (!this.activeEditor) {
      return;
    }

    const filePath = this.activeEditor.document.uri.fsPath;

    const document = this.activeEditor.document;
    const loadingDecorations: vscode.DecorationOptions[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      loadingDecorations.push({
        range: new vscode.Range(i, 0, i, 0),
        renderOptions: {
          before: {
            contentText: padRight('Loading…', this.maxLength),
            color: new vscode.ThemeColor('git.blame.editorDecorationForeground')
          }
        }
      });
    }

    this.activeEditor.setDecorations(this.decorationType, loadingDecorations);

    try {
      const blameMap = await this.gitService.getGitBlame(filePath);
      if (blameMap.size === 0) {
        // TODO: Show a message to the user that no blame information was found
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
          const color = getColorForDate(blameInfo.date);

          const range = new vscode.Range(i, 0, i, 0);
          decorations.push({
            range,
            renderOptions: {
              before: {
                contentText: padRight(blameInfo.author, this.maxLength),
                color: color,
                fontStyle: 'normal'
              },
            },
            hoverMessage: tooltip,
          });
        }
      }

      console.log(`Setting ${decorations.length} decorations`);
      this.activeEditor.setDecorations(this.decorationType, decorations);
    } catch (error) {
      console.error('Error updating decorations:', error);
      this.activeEditor.setDecorations(this.decorationType, []);
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
      }
    }
  }
}
