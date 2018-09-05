const SourceGraph = require("imocha/lib/SourceGraph");
const GitClient = require("imocha/lib/GitClient");
const MochaWorker = require("imocha/lib/MochaWorker");
const MochaWatch = require("imocha/lib/MochaWatch");

const loadMochaOptions = require("imocha/lib/loadMochaOptions");
const loadMochaOptsIntoArgs = require("imocha/lib/loadMochaOptsIntoArgs");
const findFilesMochaWouldRun = require("imocha/lib/findFilesMochaWouldRun");

module.exports = async function cli(cwd) {
  const args = loadMochaOptsIntoArgs();
  const program = loadMochaOptions(args);

  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new MochaWorker(program, args);
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

  process.stdin.on("readable", () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      mochaWatch.queueTestRun();
    }
  });

  mochaWatch.on("debug", () => {
    if (process.env.DEBUG) {
      console.log(...args);
    }
  });

  mochaWatch.on("run begin", () => {
    if (!process.env.DEBUG) {
      process.stdout.write("\x1B[2J");
    }

    console.log("Running tests at", new Date());
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
