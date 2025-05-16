import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getCommitDate(commitHash: string): Promise<Date> {
  try {
    const gitRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!gitRoot) {
      throw new Error('No git root found');
    }
    const { stdout } = await execAsync(`git show -s --format=%ci ${commitHash}`, { cwd: gitRoot });
    return new Date(stdout.trim());
  } catch (error: any) {
    throw new Error(`Failed to get commit date: ${error.message}`);
  }
}

function calculateDaysDiff(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function updateThreshold(settingKey: string, promptMessage: string) {
  const input = await vscode.window.showInputBox({
    prompt: promptMessage,
    placeHolder: 'Enter: number of days, a date in YYYY-MM-DD, or a commit hash'
  });

  if (!input) {
    return;
  }

  let daysDiff: number;

  // First check if it's a number
  const numberInput = Number(input);
  if (!isNaN(numberInput) && numberInput >= 0) {
    daysDiff = Math.floor(numberInput);
  }
  // Then check if it's a commit hash (simple heuristic: 7-40 characters of hex)
  else if (/^[0-9a-f]{7,40}$/i.test(input)) {
    try {
      const commitDate = await getCommitDate(input);
      daysDiff = calculateDaysDiff(commitDate);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
      return;
    }
  } else {
    // Try parsing as date
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      vscode.window.showErrorMessage('Invalid input. Please enter a number of days, a date in YYYY-MM-DD format, or a valid commit hash.');
      return;
    }
    daysDiff = calculateDaysDiff(date);
  }

  // Update the setting
  await vscode.workspace.getConfiguration('git-file-age').update(
    settingKey,
    daysDiff,
    vscode.ConfigurationTarget.Global
  );

  vscode.window.showInformationMessage(`Updated ${settingKey} to ${daysDiff}`);
}

export function registerThresholdCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('git-file-age.updateRecentThreshold', () => {
      updateThreshold(
        'recentThresholdDays',
        'Newer files will be highlighted in green. Set to -1 to disable.'
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('git-file-age.updateOldThreshold', () => {
      updateThreshold(
        'oldThresholdDays',
        'Older files will be grayed out. Set to -1 to disable.'
      );
    })
  );
}
