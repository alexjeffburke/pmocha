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

    this._entityName = undefined;
  }

  run(onSuccess, onCancel) {
    this._pipe.write(ansiEscapes.cursorHide);
    this._pipe.write(ansiEscapes.clearScreen);

    this._pipe.write(this.usage());
    this._pipe.write(ansiEscapes.cursorShow);

    this._prompt.enter(this._onChange.bind(this), onSuccess, onCancel);
  }

  usage() {
    return usage(this._entityName);
  }

  _onChange(pattern) {
    this._pipe.write(ansiEscapes.eraseLine);
    this._pipe.write(ansiEscapes.cursorLeft);
  }
};
