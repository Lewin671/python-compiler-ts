#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = {
    maxIter: 5,
    testPromptPath: "prompts/test.txt",
    promptPath: "prompts/task.txt",
    commitPromptPath: "prompts/commit.txt",
    testCmd: "codex --dangerously-bypass-approvals-and-sandbox exec",
    taskCmd: "codex --dangerously-bypass-approvals-and-sandbox exec",
    commitCmd: "codex --dangerously-bypass-approvals-and-sandbox exec",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--max-iter") {
      args.maxIter = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--test-prompt") {
      args.testPromptPath = argv[i + 1];
      i += 1;
    } else if (arg === "--prompt") {
      args.promptPath = argv[i + 1];
      i += 1;
    } else if (arg === "--test-cmd") {
      args.testCmd = argv[i + 1];
      i += 1;
    } else if (arg === "--task-cmd") {
      args.taskCmd = argv[i + 1];
      i += 1;
    } else if (arg === "--commit-prompt") {
      args.commitPromptPath = argv[i + 1];
      i += 1;
    } else if (arg === "--commit-cmd") {
      args.commitCmd = argv[i + 1];
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
  }

  return args;
}

function usage() {
  return [
    "Usage: scripts/codex-loop.js [options]",
    "",
    "Options:",
    "  --max-iter <n>      Max iterations (default 5)",
    "  --test-prompt <path>     Test prompt file path (default prompts/test.txt)",
    "  --test-cmd <cmd>    Test command (default \"codex --dangerously-bypass-approvals-and-sandbox exec\")",
    "  --prompt <path>     Task prompt file path (default prompts/task.txt)",
    "  --task-cmd <cmd>    Task command (default \"codex --dangerously-bypass-approvals-and-sandbox exec\")",
    "  --commit-prompt <path>  Commit prompt file (default prompts/commit.txt)",
    "  --commit-cmd <cmd>  Commit command (default \"codex --dangerously-bypass-approvals-and-sandbox exec\")",
    "",
    "Workflow: Test Agent -> Task Agent -> Commit Agent",
  ].join("\n");
}

function runShell(cmd, opts = {}) {
  const result = spawnSync(cmd, {
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    env: opts.env || process.env,
    input: opts.input || undefined,
  });
  return result.status ?? 1;
}

function readPrompt(promptPath) {
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, "utf8");
}

function buildPrompt(base, testOutput) {
  if (!testOutput) return base;
  return `${base}\n\n[Test failures]\n${testOutput}`;
}

function runTest(testCmd, testPromptPath, log, errorLog) {
  log("=== PHASE: Test (Generate test cases & find issues) ===");
  const testPrompt = readPrompt(testPromptPath);
  const testStatus = runShell(testCmd, { input: testPrompt });
  
  if (testStatus !== 0) {
    errorLog(`✗ Test agent failed (exit ${testStatus}).`);
    return false;
  }
  
  log("✓ Test agent completed - issues identified.");
  return true;
}

function runTask(taskCmd, taskPromptPath, testOutput, log, errorLog) {
  log("=== PHASE: Task ===");
  const basePrompt = readPrompt(taskPromptPath);
  const combinedPrompt = buildPrompt(basePrompt, testOutput);
  const taskStatus = runShell(taskCmd, { input: combinedPrompt });
  
  if (taskStatus !== 0) {
    errorLog(`✗ Task command failed (exit ${taskStatus}).`);
    return false;
  }
  
  log("✓ Task completed successfully.");
  return true;
}

function runCommit(commitCmd, commitPromptPath, gitDir, cwd, log, errorLog) {
  log("=== PHASE: Commit ===");
  const commitPrompt = readPrompt(path.resolve(commitPromptPath));
  const commitStatus = runShell(commitCmd, { input: commitPrompt });
  
  if (commitStatus !== 0) {
    errorLog(`✗ Commit command failed (exit ${commitStatus}).`);
    return false;
  }
  
  log("✓ Commit completed successfully.");
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!Number.isFinite(args.maxIter) || args.maxIter < 1) {
    console.error("Invalid --max-iter value.");
    process.exit(1);
  }

  let lastTestOutput = "";
  const promptPath = path.resolve(args.promptPath);
  const cwd = process.cwd();
  const gitDir = path.resolve(cwd, ".git");

  // Initialize logging
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const logFile = path.join(os.tmpdir(), `codex-loop-${dateStr}.log`);

  console.log(`Logging to ${logFile}`);
  const log = (message) => {
    console.log(message);
    fs.appendFileSync(logFile, `${message}\n`, "utf8");
  };

  const errorLog = (message) => {
    console.error(message);
    fs.appendFileSync(logFile, `[ERROR] ${message}\n`, "utf8");
  };

  for (let i = 1; i <= args.maxIter; i += 1) {
    log(`\n========== Iteration ${i}/${args.maxIter} ==========`);

    // STEP 1: Test (AI Agent generates test cases and identifies issues)
    const testSuccess = runTest(
      args.testCmd,
      path.resolve(args.testPromptPath),
      log,
      errorLog
    );
    if (!testSuccess) {
      errorLog("Test agent execution failed. Exiting.");
      process.exit(1);
    }

    // STEP 2: Task (AI Agent fixes issues)
    const taskSuccess = runTask(
      args.taskCmd,
      promptPath,
      "",
      log,
      errorLog
    );
    if (!taskSuccess) {
      errorLog("Task execution failed. Exiting.");
      process.exit(1);
    }

    // STEP 3: Commit
    const commitSuccess = runCommit(
      args.commitCmd,
      path.resolve(args.commitPromptPath),
      gitDir,
      cwd,
      log,
      errorLog
    );
    if (!commitSuccess) {
      errorLog("Commit execution failed. Exiting.");
      process.exit(1);
    }

    log(`Iteration ${i} completed. Restarting test phase...\n`);
  }

  errorLog("Reached max iterations without completion.");
  errorLog(`Log file: ${logFile}`);
  process.exit(1);
}

main();
