import * as vscode from 'vscode';
import { GitFileDecorationProvider } from './providers/GitFileDecorationProvider';
import { GitBlameProvider } from './providers/GitBlameProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('GitViz extension is now active');
  const decorationProvider = new GitFileDecorationProvider();
  const blameProvider = new GitBlameProvider();

  // Create status bar item for Git blame toggle
  const blameStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  blameStatusBarItem.text = "$(git-commit) Git Blame";
  blameStatusBarItem.tooltip = "Toggle Git Blame Annotations";
  blameStatusBarItem.command = 'gitviz.toggleBlame';
  blameStatusBarItem.show();
  context.subscriptions.push(blameStatusBarItem);

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitviz.toggleBlame', () => {
      console.log('Toggle blame command triggered');
      blameProvider.toggle();

      // Update status bar item to show active/inactive state
      if (blameProvider.isEnabled) {
        blameStatusBarItem.text = "$(git-commit) Git Blame: On";
        blameStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      } else {
        blameStatusBarItem.text = "$(git-commit) Git Blame";
        blameStatusBarItem.backgroundColor = undefined;
      }
    })
  );
}

export function deactivate() { }
