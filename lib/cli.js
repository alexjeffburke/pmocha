const SourceGraph = require("imocha/lib/SourceGraph");
const GitClient = require("imocha/lib/GitClient");
const MochaWatch = require("imocha/lib/MochaWatch");

const PMochaWorker = require("./PMochaWorker");
const Prompt = require("./Prompt");

const loadMochaOptions = require("imocha/lib/loadMochaOptions");
const loadMochaOptsIntoArgs = require("imocha/lib/loadMochaOptsIntoArgs");
const findFilesMochaWouldRun = require("imocha/lib/findFilesMochaWouldRun");

module.exports = async function cli(cwd) {
  const args = loadMochaOptsIntoArgs();
  const program = loadMochaOptions(args);

  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new PMochaWorker(program, args);
  const mochaWatch = new MochaWatch(
    cwd,
    gitClient,
    sourceGraph,
    mochaWorker,
    program
  );

  const files = findFilesMochaWouldRun(program);
  await sourceGraph.populate(files);

  mochaWatch.init();

  const prompt = new Prompt({
    stdout: process.stdout,
    stdin: process.stdin,
    onRunTests: (runKey, args) => {
      mochaWorker.clearArgs();

      switch (runKey) {
        case "all":
          break;
        case "grep":
          mochaWorker.attachArgs(["-g"].concat(args));
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
    const { testDuration } = result;

    if (testDuration === -1) {
      console.log("\nNo tests to run.");
    } else if (process.env.DEBUG) {
      console.log("%sms", result.testDuration);
    }
  });

  process.on("SIGINT", () => {
    mochaWatch.stop();
    process.stdin.end("\n");
  });
};
