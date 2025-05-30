import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitInfo {
  date: Date;
  author: string;
}

export class GitService {
  private gitRoot: string | null = null;

  async getGitRoot(filePath: string): Promise<string | null> {
    if (this.gitRoot && path.dirname(filePath).startsWith(this.gitRoot)) {
      return this.gitRoot;
    }

    try {
      const { stdout } = await execAsync(`git rev-parse --show-toplevel`, { cwd: path.dirname(filePath) });
      this.gitRoot = stdout.trim();
      return this.gitRoot;
    } catch (error) {
      console.error(`Error getting git root for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * null is returned for Git ignored files
   */
  async getGitInfo(filePath: string): Promise<GitInfo | null> {
    try {
      const gitRoot = await this.getGitRoot(filePath);
      if (!gitRoot) {
        return null;
      }

      console.debug('Fetching git info for', filePath);
      const { stdout } = await execAsync(`git log -1 --format=%ct,%an -- "${filePath}"`, { cwd: gitRoot });
      if (stdout.trim() === '') { return null; }
      const [timestamp, author] = stdout.trim().split(',');

      if (isNaN(Number(timestamp))) {
        return null;
      }
      return { date: new Date(Number(timestamp) * 1000), author: author };
    } catch (error) {
      console.error(`Error getting git date for ${filePath}:`, error);
      return null;
    }
  }
}
