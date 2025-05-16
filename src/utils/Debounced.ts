import * as vscode from 'vscode';

export class Debounced {
  private timeout: NodeJS.Timeout | undefined;
  private readonly delay: number;
  private files: Set<vscode.Uri> = new Set();
  private readonly maxFiles = 10;

  constructor(private refreshCallback: (file?: vscode.Uri) => void, delay: number = 500) {
    this.delay = delay;
  }

  refresh(file: vscode.Uri) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    if (this.files.size < this.maxFiles) {
      this.files.add(file);
    }

    this.timeout = setTimeout(() => {
      if (this.files.size >= this.maxFiles) {
        this.refreshCallback();
      } else {
        this.files.forEach(file => this.refreshCallback(file));
      }
      this.files.clear();
      this.timeout = undefined;
    }, this.delay);
  }

  dispose() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    this.files.clear();
  }
}
