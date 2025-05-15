import * as vscode from 'vscode';
import { GitFileDecorationProvider } from './providers/GitFileDecorationProvider';
import { GitBlameProvider } from './providers/GitBlameProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('GitViz extension is now active');
  const decorationProvider = new GitFileDecorationProvider();
  const blameProvider = new GitBlameProvider();

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitviz.toggleBlame', () => {
      console.log('Toggle blame command triggered');
      blameProvider.toggle();
    })
  );
}

export function deactivate() { }
