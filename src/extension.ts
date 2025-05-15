import * as vscode from 'vscode';
import { GitFileDecorationProvider } from './providers/GitFileDecorationProvider';


export function activate(context: vscode.ExtensionContext) {
  console.log('Git File Age extension is now active');

  // Initialize the decoration provider
  const decorationProvider = new GitFileDecorationProvider();

  // Register the decoration provider
  const decorationProviderDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
  context.subscriptions.push(decorationProviderDisposable);

  // Register the toggle command
  const toggleCommand = vscode.commands.registerCommand('git-file-age.toggle', () => {
    const config = vscode.workspace.getConfiguration('git-file-age');
    const currentValue = config.get('enabled');
    config.update('enabled', !currentValue, true);
  });

  const refreshCommand = vscode.commands.registerCommand('git-file-age.refresh', () => {
    decorationProvider.refresh();
  });

  context.subscriptions.push(toggleCommand);
  context.subscriptions.push(refreshCommand);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('git-file-age')) {
        decorationProvider.refresh();
      }
    })
  );
}

export function deactivate() {
}
