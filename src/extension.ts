import * as vscode from 'vscode';
import { GitFileDecorationProvider } from './providers/GitFileDecorationProvider';

let decorationProvider: GitFileDecorationProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Git File Age extension is now active');

  // Initialize the decoration provider
  decorationProvider = new GitFileDecorationProvider();

  // Register the decoration provider
  const decorationProviderDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
  context.subscriptions.push(decorationProviderDisposable);

  // Register the toggle command
  const toggleCommand = vscode.commands.registerCommand('git-file-age.toggle', () => {
    const config = vscode.workspace.getConfiguration('git-file-age');
    const currentValue = config.get('enabled');
    config.update('enabled', !currentValue, true);
  });

  context.subscriptions.push(toggleCommand);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('git-file-age.enabled')) {
        const config = vscode.workspace.getConfiguration('git-file-age');
        const enabled = config.get('enabled');

        if (enabled) {
          if (!decorationProvider) {
            decorationProvider = new GitFileDecorationProvider();
            context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorationProvider));
          }
        } else {
          if (decorationProvider) {
            decorationProvider.refresh();
            decorationProvider = undefined;
          }
        }
      }
    })
  );
}

export function deactivate() {
  decorationProvider = undefined;
}
