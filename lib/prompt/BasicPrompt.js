/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

"use strict";

const chalk = require("chalk");
const ansiEscapes = require("ansi-escapes");

const {
  printPatternCaret,
  printRestoredPatternCaret
} = require("jest-watcher");

const usage = entity => {
  let output = "";
  output += `\n${chalk.bold("Pattern Mode Usage")}\n`;
  output += ` ${chalk.dim("\u203A Press")} Esc ${chalk.dim(
    "to exit this mode."
  )}\n`;
  output += ` ${chalk.dim("\u203A Press")} Enter `;
  output += `${chalk.dim(`to filter by a ${entity} regex pattern.`)}\n`;
  output += `\n`;
  return output;
};

module.exports = class BasicPrompt {
  constructor(pipe, prompt) {
    this._pipe = pipe;
    this._prompt = prompt;

    this._currentUsageRows = 0;
    this._entityName = undefined;
  }

  run(onSuccess, onCancel) {
    this._printScreen();
    this._prompt.enter(this._onChange.bind(this), onSuccess, onCancel);
  }

  usage() {
    const output = usage(this._entityName);
    this._currentUsageRows = output.length;
    return output;
  }

  _onChange(pattern) {
    this._pipe.write(ansiEscapes.eraseLine);
    this._pipe.write(ansiEscapes.cursorLeft);

    this._printPrompt(pattern);
  }

  _printPrompt(pattern) {
    printPatternCaret(pattern, this._pipe);
    printRestoredPatternCaret(pattern, this._currentUsageRows, this._pipe);
  }

  _printScreen() {
    this._pipe.write(ansiEscapes.cursorHide);
    this._pipe.write(ansiEscapes.clearScreen);

    this._pipe.write(this.usage());
    this._pipe.write(ansiEscapes.cursorShow);
  }
};
