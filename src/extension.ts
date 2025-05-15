import * as vscode from 'vscode';
import { GitFileDecorationProvider } from './providers/GitFileDecorationProvider';
import { registerThresholdCommands } from './commands/thresholdCommands';


export function activate(context: vscode.ExtensionContext) {
  console.log('Git File Age extension is now active');

  const decorationProvider = new GitFileDecorationProvider();

  const decorationProviderDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
  context.subscriptions.push(decorationProviderDisposable);

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

  // Register threshold commands
  registerThresholdCommands(context);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('git-file-age')) {
        decorationProvider.clearCache();
        decorationProvider.refresh();
      }
    })
  );
}

export function deactivate() {
}
