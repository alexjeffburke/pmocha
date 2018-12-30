const MochaWatch = require("imocha/lib/MochaWatch");

module.exports = class PMochaWatch extends MochaWatch {
  constructor(cwd, gitClient, sourceGraph, mochaWorker, program, allFiles) {
    super(cwd, gitClient, sourceGraph, mochaWorker, program);

    this.allFiles = allFiles;
    this.testMode = "changed";
  }

  applyMode(testMode) {
    this.testMode = testMode;
  }

  async runTests(testRunArgs) {
    await this.flushQueuedFiles();

    let testFilesToRun;
    if (this.testMode === "all") {
      testFilesToRun = this.allFiles;
    } else {
      testFilesToRun = await this.findTestFilesToRun();
    }

    this.emit("run begin");

    const result = await this.mochaWorker.runTests(testFilesToRun);

    this.emit("run complete", result);
  }
};
