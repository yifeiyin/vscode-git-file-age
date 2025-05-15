# Git File Age

Visualize file ages in VS Code's file explorer based on their last git modification dates.

<img src="docs/image.png" width="33%" style="margin: auto" />

[Open in VSCode](vscode:extension/yifeiyin.git-file-age)

## Features

* Due to [VSCode limitations](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/api/common/extHostTypes.ts#L3788C1-L3794C5), at most 2 characters can be shown
  * < 100 days: show days (eg "42")
  * < 10 months: show months (eg "9m")
  * otherwise: shows years, capped at 9 (eg "2y")
* Recent files (default ≤ 7 days) are highlighted in green
* Old files (default ≥ 100 days) are greyed out

## Commands

* `Git File Age: Toggle` - Enable/disable the decorations
* `Git File Age: Refresh` - Refresh the decorations
* `Git File Age: Update threshold for new files` - Set threshold for recent files (0 to disable)
* `Git File Age: Update threshold for old files` - Set threshold for old files (999999 to disable)
  * You can enter:
  * A number of days (e.g., "7")
  * A date in YYYY-MM-DD format (e.g., "2024-03-01")
  * A commit hash (e.g., "a1b2c3d")

## Settings

* `git-file-age.enabled` - Enable/disable the extension
* `git-file-age.recentThresholdDays` - Days threshold for recent files (default: 7)
* `git-file-age.oldThresholdDays` - Days threshold for old files (default: 100)
