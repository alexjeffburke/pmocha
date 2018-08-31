const ansiEscapes = require("ansi-escapes");
const { KEYS, Prompt: JestPrompt, PatternPrompt } = require("jest-watcher");

module.exports = class Prompt {
  constructor({ stdout, stdin, onRunTests }) {
    this.stdout = stdout;
    this.stdin = stdin;

    this.activePrompt = null;
    this.testMode = "all";
    this.testModeArgs = [];
    this.onRunTests = onRunTests;
  }

  get isPromptActive() {
    return this.activePrompt !== null;
  }

  _onPromptSuccess(value) {
    this.clearPrompt();
    this.testModeArgs = [value];
    this.issueTests();
  }

  _onPromptCancel() {
    this.clearPrompt();
    this.activePrompt = null;
    this.testModeArgs = [];
  }

  setPrompt(prompt) {
    this.activePrompt = prompt;
    prompt.run(
      this._onPromptSuccess.bind(this),
      this._onPromptCancel.bind(this)
    );
  }

  clearPrompt() {
    this.stdout.write(ansiEscapes.cursorHide);
    this.stdout.write(ansiEscapes.clearScreen);
    this.stdout.write(ansiEscapes.cursorShow);
  }

  issueTests() {
    if (typeof this.onRunTests === "function") {
      this.clearPrompt();
      this.onRunTests(this.testMode, this.testModeArgs);
    }
  }

  executePrompt() {
    const { stdin, stdout } = this;

    return new Promise((resolve, reject) => {
      const prompt = new JestPrompt();

      const onKeypress = key => {
        if (key === KEYS.CONTROL_C || key === KEYS.CONTROL_D || key === "q") {
          if (typeof stdin.setRawMode === "function") {
            stdin.setRawMode(false);
          }
          stdout.write("\n");
          resolve();
        } else if (this.isPromptActive) {
          prompt.put(key);
          stdout.write(prompt._value); // write the current value to the prompt
        } else if (key === "p") {
          this.testMode = "grep";
          this.clearPrompt();
          this.setPrompt(new PatternPrompt(stdout, prompt));
        } else if (key === "a") {
          this.testMode = "all";
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
