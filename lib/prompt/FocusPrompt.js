const chalk = require("chalk");

const BasicPrompt = require("./BasicPrompt");

const usage = options => {
  let output = "";
  output += `\n${chalk.bold("Focus Usage")}\n`;
  output += ` ${chalk.dim("\u203A Press")} Esc ${chalk.dim(
    "to exit this mode."
  )}\n`;
  options.forEach((name, index) => {
    output += ` ${chalk.dim("\u203A Press")} ${index + 1} ${chalk.dim(
      'for "'
    )}${name}${chalk.dim('"')} \n`;
  });
  if (options.length > 0) {
    output += `      ${chalk.dim("followed by")} Enter ${chalk.dim(
      "to filter by the corresponding failing test."
    )}\n`;
  }
  output += `\n`;
  return output;
};

module.exports = class FocusPrompt extends BasicPrompt {
  getTestFailures() {
    const lastResult = this._prompt.getLastResult();
    return lastResult.failures || [];
  }

  run(parentOnSuccess, onCancel, isReset) {
    const onSuccess = value => {
      const optionIndex = Number(value);
      if (!isNaN(optionIndex)) {
        let testIndex = optionIndex;
        testIndex -= 1; // account for options being numbered from 1
        const test = this.getTestFailures()[testIndex];
        value = test !== undefined ? test.fullTitle : "";
      } else {
        value = "";
      }

      parentOnSuccess(value, optionIndex);
    };

    super.run(onSuccess, onCancel, isReset);
  }

  usage() {
    const options = this.getTestFailures().map(test => {
      return test.fullTitle;
    });

    const output = usage(options);
    this._currentUsageRows = output.length;
    return output;
  }
};
