# Git File Age

Visualize file ages in VS Code's file explorer based on their last git modification dates.

<img src="docs/image.png" width="33%" style="margin: auto" />

## Features

* Shows file age indicators in the file explorer
* Recent files (≤ 7 days) are highlighted in green
* Old files (≥ 100 days) are greyed out

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
