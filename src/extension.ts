import * as vscode from 'vscode';
import { GitFileDecorationProvider } from './providers/GitFileDecorationProvider';
import { registerThresholdCommands } from './commands/thresholdCommands';
import { Debounced } from './utils/Debounced';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  console.log('Git File Age extension is activated');

  const decorationProvider = new GitFileDecorationProvider();

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  //////////// Set up commands ////////////
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

  registerThresholdCommands(context);

  //////////// Refresh on file change ////////////
  const debouncedRefresh = new Debounced(() => decorationProvider.refresh());
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  workspaceFolders.forEach(folder => {
    const watcher = fs.watch(folder.uri.fsPath, { recursive: true }, () => {
      debouncedRefresh.refresh();
    });

    context.subscriptions.push({
      dispose: () => {
        watcher.close();
        debouncedRefresh.dispose();
      }
    });
  });

  //////////// Refresh on configuration change ////////////
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
