const MochaWatch = require("imocha/lib/MochaWatch");

const findTestFilesToRun = require("imocha/lib/findTestFilesToRun");

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
    let relatedTestFiles;
    if (this.testMode === "all") {
      relatedTestFiles = this.allFiles;
    } else {
      relatedTestFiles = await findTestFilesToRun(
        this.sourceGraph,
        this.gitClient
      );
    }

    this.emit("run begin");

    const result = await this.mochaWorker.runTests(relatedTestFiles);

    this.emit("run complete", result);
  }
};
