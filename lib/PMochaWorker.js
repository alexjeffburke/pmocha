const MochaWorker = require("imocha/lib/MochaWorker");

module.exports = class PMochaWorker extends MochaWorker {
  constructor(program, args) {
    super(program, args);

    this.testRunArgs = [];
  }

  attachArgs(testRunArgs) {
    this.testRunArgs = testRunArgs;
  }

  clearArgs() {
    this.testRunArgs = [];
  }

  generateArgs(testFilePaths) {
    // filter out arguments that we would pass by default. this will make mocha
    // only run the files that we pass as the default glob of test/* is
    // overriden and whatever might have been in mocha.opts is removed.
    let args = this.args.filter(arg => this.program.args.indexOf(arg) === -1);

    // add any args configured for the current test run
    if (this.testRunArgs.length > 0) {
      args = args.concat(this.testRunArgs);
    }

    return args.concat(testFilePaths);
  }
};
