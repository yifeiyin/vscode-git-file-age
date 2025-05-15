# Git File Age

A VS Code extension that visualizes file ages in the explorer based on their last git modification dates. Quickly identify old and recently modified files with color-coded age indicators.

## Features

- Shows file modification dates from git history in the file explorer
- Color-codes files based on their age
- Toggle file decorations on/off with a command
- Persistent setting to enable/disable the feature

## Extension Settings

This extension contributes the following settings:

* `git-file-age.enabled`: Enable/disable Git File Age decorations (default: true)
* `git-file-age.recentThresholdDays`: Number of days within which files will be highlighted in green (recent changes). Set to 0 to disable recent file highlighting. (default: 7)
* `git-file-age.oldThresholdDays`: Number of days after which files will be grayed out (old changes). Set to a very large number (e.g. 999999) to disable old file highlighting. (default: 100)

### How to Disable Highlighting

You can disable either the recent or old file highlighting by adjusting the threshold settings:

1. To disable recent file highlighting (green):
   - Set `git-file-age.recentThresholdDays` to 0

2. To disable old file highlighting (gray):
   - Set `git-file-age.oldThresholdDays` to 999999

3. To disable all highlighting but keep the age badges:
   - Set both thresholds as described above

## Commands

* `Git File Age: Toggle File Decorations`: Toggle the visibility of git-based file decorations

## Requirements

- Git repository
- VS Code 1.100.0 or higher

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
