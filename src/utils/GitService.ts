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

  async getGitBlame(filePath: string): Promise<Map<number, GitInfo>> {
    try {
      const gitRoot = await this.getGitRoot(filePath);
      if (!gitRoot) {
        console.log('No git root found for:', filePath);
        return new Map();
      }

      console.log('Getting git blame for:', filePath);
      const { stdout } = await execAsync(`git blame --line-porcelain -- "${filePath}"`, { cwd: gitRoot });
      const lines = stdout.split('\n');
      const blameMap = new Map<number, GitInfo>();
      let currentLine = 0;
      let currentAuthor = '';
      let currentDate = new Date();

      for (const line of lines) {
        if (line.startsWith('author ')) {
          currentAuthor = line.substring(7);
        } else if (line.startsWith('author-time ')) {
          currentDate = new Date(Number(line.substring(12)) * 1000);
        } else if (line.startsWith('\t')) {
          currentLine++;
          blameMap.set(currentLine, { author: currentAuthor, date: currentDate });
        }
      }

      console.log(`Found ${blameMap.size} blame entries for ${filePath}`);
      return blameMap;
    } catch (error) {
      console.error(`Error getting git blame for ${filePath}:`, error);
      return new Map();
    }
  }
}
