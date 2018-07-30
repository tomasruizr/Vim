import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { Message } from '../../util/message';
import * as node from '../node';

export interface IWriteCommandArguments extends node.ICommandArgs {
  opt?: string;
  optValue?: string;
  bang?: boolean;
  range?: node.LineRange;
  file?: string;
  append?: boolean;
  cmd?: string;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends node.CommandBase {
  protected _arguments: IWriteCommandArguments;

  constructor(args: IWriteCommandArguments) {
    super();
    this._name = 'write';
    this._arguments = args;
  }

  get arguments(): IWriteCommandArguments {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.arguments.opt) {
      Message.ShowError('Not implemented.');
      return;
    } else if (this.arguments.file) {
      Message.ShowError('Not implemented.');
      return;
    } else if (this.arguments.append) {
      Message.ShowError('Not implemented.');
      return;
    } else if (this.arguments.cmd) {
      Message.ShowError('Not implemented.');
      return;
    }

    if (vimState.editor.document.isUntitled) {
      await vscode.commands.executeCommand('workbench.action.files.save');
      return;
    }

    try {
      fs.accessSync(vimState.editor.document.fileName, fs.constants.W_OK);
      return this.save(vimState);
    } catch (accessErr) {
      if (this.arguments.bang) {
        fs.chmod(vimState.editor.document.fileName, 666, e => {
          if (!e) {
            return this.save(vimState);
          }
          StatusBar.SetText(e.message, vimState.currentMode, vimState.isRecordingMacro, true, true);
          return;
        });
      } else {
        StatusBar.SetText(
          accessErr.message,
          vimState.currentMode,
          vimState.isRecordingMacro,
          true,
          true
        );
      }
    }
  }

  private async save(vimState: VimState): Promise<void> {
    await vimState.editor.document.save().then(
      () => {
        let text =
          '"' +
          path.basename(vimState.editor.document.fileName) +
          '" ' +
          vimState.editor.document.lineCount +
          'L ' +
          vimState.editor.document.getText().length +
          'C written';
        StatusBar.SetText(text, vimState.currentMode, vimState.isRecordingMacro, true, true);
      },
      e => StatusBar.SetText(e, vimState.currentMode, vimState.isRecordingMacro, true, true)
    );
  }
}
