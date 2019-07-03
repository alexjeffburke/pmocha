const SourceGraph = require("imocha/lib/SourceGraph");
const GitClient = require("imocha/lib/GitClient");

const PMochaWatch = require("./PMochaWatch");
const PMochaWorker = require("./PMochaWorker");
const Prompt = require("./Prompt");

const { loadOptions } = require("mocha/lib/cli/options");

const findFilesMochaWouldRun = require("imocha/lib/findFilesMochaWouldRun");

module.exports = async function cli(cwd, args) {
  const mochaOpts = loadOptions(args);

  const files = findFilesMochaWouldRun(mochaOpts);

  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new PMochaWorker(mochaOpts, args);
  const mochaWatch = new PMochaWatch(
    cwd,
    gitClient,
    sourceGraph,
    mochaWorker,
    mochaOpts,
    files
  );

  await sourceGraph.populate(files);

  mochaWatch.init();

  const prompt = new Prompt({
    stdout: process.stdout,
    stdin: process.stdin,
    onRunTests: (testMode, optsMode, args) => {
      mochaWorker.clearArgs();

      switch (optsMode) {
        case "grep":
          mochaWorker.attachArgs(["-g"].concat(args));
          break;
      }

      switch (testMode) {
        case "changed":
          mochaWatch.applyMode("changed");
          break;
        case "all":
          mochaWatch.applyMode("all");
          break;
      }

      mochaWatch.queueTestRun();
    }
  });
  prompt.executePrompt().then(() => {
    mochaWatch.stop();
    process.stdin.end("\n");
    process.exit(0);
  });

  mochaWatch.on("debug", () => {
    if (process.env.DEBUG) {
      console.log(...args);
    }
  });

  mochaWatch.on("run begin", () => {
    if (process.env.DEBUG) {
      console.log("Running tests at", new Date());
    }
  });

  mochaWatch.on("run complete", result => {
    const { testDuration, testSummary } = result;

    if (testDuration === -1) {
      console.log("\nNo tests to run.");
    } else if (process.env.DEBUG) {
      console.log("%sms", result.testDuration);
    }

    prompt.setLastResult(testSummary);
  });

  process.on("SIGINT", () => {
    mochaWatch.stop();
    process.stdin.end("\n");
  });
};
