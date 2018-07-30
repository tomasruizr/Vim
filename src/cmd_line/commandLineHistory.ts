import * as fs from 'fs';
import * as path from 'path';
import { configuration } from '../configuration/configuration';
import { logger } from '../util/logger';

const mkdirp = require('mkdirp');

export class CommandLineHistory {
  private static readonly _historyFileName = '.cmdline_history';
  private _historyDir: string;
  private _history: string[] = [];
  private get _historyFilePath(): string {
    return path.join(this._historyDir, CommandLineHistory._historyFileName);
  }

  constructor(historyDir: string) {
    this._historyDir = historyDir;
    this._loadFromFile();
  }

  public add(command: string | undefined): void {
    if (!command || command.length === 0) {
      return;
    }

    // remove duplicates
    let index: number = this._history.indexOf(command);
    if (index !== -1) {
      this._history.splice(index, 1);
    }

    // append to the end
    this._history.push(command);

    // resize array if necessary
    if (this._history.length > configuration.history) {
      this._history = this._history.slice(this._history.length - configuration.history);
    }

    this.save();
  }

  public get(): string[] {
    // resize array if necessary
    if (this._history.length > configuration.history) {
      this._history = this._history.slice(this._history.length - configuration.history);
    }

    return this._history;
  }

  public clear() {
    try {
      fs.unlinkSync(this._historyFilePath);
    } catch (err) {
      logger.warn(`CommandLineHistory: unable to delete ${this._historyFilePath}. err=${err}.`);
    }
  }

  public async save(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!fs.existsSync(this._historyDir)) {
          mkdirp.sync(this._historyDir, 0o775);
        }
      } catch (err) {
        logger.error(
          `CommandLineHistory: Failed to create directory. path=${this._historyDir}. err=${err}.`
        );
        reject(err);
      }

      try {
        fs.writeFileSync(this._historyFilePath, JSON.stringify(this._history), 'utf-8');
      } catch (err) {
        logger.error(`CommandLineHistory: Failed to save history. err=${err}.`);
        reject(err);
      }

      resolve();
    });
  }

  private _loadFromFile() {
    let data = '';

    try {
      data = fs.readFileSync(this._historyFilePath, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.debug('CommandLineHistory: History does not exist.');
      } else {
        logger.error(`CommandLineHistory: Failed to load history. err=${err}.`);
        return;
      }
    }

    if (data.length === 0) {
      return;
    }

    try {
      let parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw Error('Expected JSON');
      }
      this._history = parsedData;
    } catch (e) {
      logger.error(`CommandLineHistory: Deleting corrupted history file. err=${e}.`);
      this.clear();
    }
  }
}
