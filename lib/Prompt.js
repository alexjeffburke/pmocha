const ansiEscapes = require("ansi-escapes");
const { KEYS, Prompt: JestPrompt } = require("jest-watcher");

const GrepPrompt = require("./prompt/GrepPrompt");

module.exports = class Prompt {
  constructor({ stdout, stdin, onRunTests }) {
    this.stdout = stdout;
    this.stdin = stdin;

    this.basePrompt = new JestPrompt();

    this.activePrompt = null;
    this.isPromptApplied = false;
    this.optsMode = null;
    this.testMode = "changed";
    this.testModeArgs = [];
    this.onRunTests = onRunTests;

    this.onPromptSuccess = this._onPromptSuccess.bind(this);
    this.onPromptCancel = this._onPromptCancel.bind(this);
  }

  get isPromptActive() {
    return this.activePrompt !== null;
  }

  _onPromptSuccess(value) {
    this.clearPrompt();
    this.isPromptApplied = true;
    this.testModeArgs = [value];
    this.issueTests();
  }

  _onPromptCancel() {
    this.clearPrompt();

    // If the prompt was previously activated via enter
    // we should restore it then Esc is pressed. Only
    // Esc being pressed a second time with the options
    // shown shuld return to the top level menu.
    if (this.isPromptApplied) {
      this.isPromptApplied = false;
      const promptValue = this.testModeArgs[0];
      this.basePrompt._value = promptValue;
      const prompt = this.activePrompt;
      prompt._entityName = `"${promptValue}"`;
      this.setPrompt(prompt, true); // isReset = true
      return;
    }

    this.activePrompt = null;
    this.optsMode = null;
    this.testModeArgs = [];

    this.issueTests();
  }

  setPrompt(prompt, isReset = false) {
    this.activePrompt = prompt;

    if (isReset) {
      prompt._printScreen();
      prompt._printPrompt(this.basePrompt._value); // write out the current value
    } else {
      prompt.run(this.onPromptSuccess, this.onPromptCancel);
    }
  }

  clearPrompt() {
    this.stdout.write(ansiEscapes.cursorHide);
    this.stdout.write(ansiEscapes.clearScreen);
    this.stdout.write(ansiEscapes.cursorShow);
  }

  issueTests() {
    if (typeof this.onRunTests === "function") {
      this.clearPrompt();
      this.onRunTests(this.testMode, this.optsMode, this.testModeArgs);
    }
  }

  executePrompt() {
    const { stdin, stdout, basePrompt } = this;

    return new Promise((resolve, reject) => {
      const onKeypress = key => {
        if (key === KEYS.CONTROL_C || key === KEYS.CONTROL_D || key === "q") {
          if (typeof stdin.setRawMode === "function") {
            stdin.setRawMode(false);
          }
          stdout.write("\n");
          resolve();
        } else if (this.isPromptActive) {
          basePrompt.put(key);
        } else if (key === "p") {
          this.optsMode = "grep";
          this.clearPrompt();
          const prompt = new GrepPrompt(stdout, basePrompt);
          prompt._entityName = '"*"';
          this.setPrompt(prompt);
        } else if (key === "a") {
          this.testMode = "all";
          this.issueTests();
        } else if (key === "c") {
          this.testMode = "changed";
          this.issueTests();
        } else if (key === KEYS.ENTER) {
          this.issueTests();
        }
      };

      if (typeof stdin.setRawMode === "function") {
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");
        stdin.on("data", onKeypress);
      }
    });
  }
};
