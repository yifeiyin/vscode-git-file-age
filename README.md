# Git File Age

Visualize file ages in VS Code's file explorer based on their last git modification dates.

<img src="docs/image.png" style="margin: auto; max-width: 300px;" />

[Open in VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=yifeiyin.git-file-age)

## Features

* Due to [VSCode limitations](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/api/common/extHostTypes.ts#L3788C1-L3794C5), at most 2 characters can be shown
  * < 100 days: show days (eg "42")
  * < 10 months: show months (eg "9m")
  * otherwise: shows years, capped at 9 (eg "2y")
* Recent files (default ≤ 7 days) are highlighted in green
* Old files (default ≥ 1 year) are greyed out

## Commands

* `Git File Age: Toggle`
* `Git File Age: Refresh`
* `Git File Age: Update threshold for new files`
* `Git File Age: Update threshold for old files`
  * You can enter:
  * A number of days
  * A date in YYYY-MM-DD format
  * A commit hash

## Settings

* `git-file-age.enabled` - Enable/disable the extension
* `git-file-age.recentThresholdDays` - Days threshold for recent files
* `git-file-age.oldThresholdDays` - Days threshold for old files
