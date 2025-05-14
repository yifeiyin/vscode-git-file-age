// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Define decoration types for different time ranges
const recentDecoration = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(0, 255, 0, 0.1)',
	border: '1px solid rgba(0, 255, 0, 0.3)'
});

const oldDecoration = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(255, 0, 0, 0.1)',
	border: '1px solid rgba(255, 0, 0, 0.3)'
});

// Function to get git root directory for a file
async function getGitRoot(filePath: string): Promise<string | null> {
	try {
		const { stdout } = await execAsync(`git rev-parse --show-toplevel`, { cwd: path.dirname(filePath) });
		return stdout.trim();
	} catch (error) {
		console.error(`Error getting git root for ${filePath}:`, error);
		return null;
	}
}

// Function to get git modification date for a file
async function getGitModificationDate(filePath: string): Promise<Date | null> {
	try {
		const gitRoot = await getGitRoot(filePath);
		if (!gitRoot) {
			return null;
		}

		// Get relative path from git root
		const relativePath = path.relative(gitRoot, filePath);

		// Execute git log from the git root directory
		const { stdout } = await execAsync(`git log -1 --format=%ct -- "${relativePath}"`, { cwd: gitRoot });
		const timestamp = parseInt(stdout.trim());

		if (isNaN(timestamp)) {
			return null;
		}
		return new Date(timestamp * 1000);
	} catch (error) {
		console.error(`Error getting git date for ${filePath}:`, error);
		return null;
	}
}

// Function to update decorations for a file
async function updateFileDecoration(uri: vscode.Uri) {
	const filePath = uri.fsPath;
	if (filePath.includes('node_modules')) {
		return;
	}
	if (filePath.includes('.git')) {
		return;
	}
	console.log('Updating decoration for', filePath);
	const modDate = await getGitModificationDate(filePath);

	if (!modDate) {
		return;
	}

	const now = new Date();
	const diffDays = (now.getTime() - modDate.getTime()) / (1000 * 60 * 60 * 24);

	const decoration = diffDays <= 7 ? recentDecoration : oldDecoration;

	// Create decoration range for the entire file
	const range = new vscode.Range(0, 0, 0, 0);

	// Apply decoration to the file in the explorer
	vscode.window.visibleTextEditors.forEach(editor => {
		if (editor.document.uri.fsPath === filePath) {
			editor.setDecorations(decoration, [range]);
		}
	});
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('GitViz extension is now active!');

	// Watch for file system changes
	const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*');

	fileSystemWatcher.onDidChange(uri => {
		updateFileDecoration(uri);
	});

	fileSystemWatcher.onDidCreate(uri => {
		updateFileDecoration(uri);
	});

	// Update decorations for all visible editors
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateFileDecoration(editor.document.uri);
		}
	});

	// Initial decoration update
	vscode.window.visibleTextEditors.forEach(editor => {
		updateFileDecoration(editor.document.uri);
	});

	context.subscriptions.push(fileSystemWatcher);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clean up decorations
	recentDecoration.dispose();
	oldDecoration.dispose();
}
