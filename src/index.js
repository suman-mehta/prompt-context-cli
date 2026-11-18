#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

function loadConfig(configPath) {
  const absPath = resolve(process.cwd(), configPath);
  const raw = readFileSync(absPath, "utf8");
  return JSON.parse(raw);
}

function loadContext(filePath) {
  if (!filePath) return "";
  const absPath = resolve(process.cwd(), filePath);
  return readFileSync(absPath, "utf8");
}

function substitute(template, data) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => data[key] ?? "");
}

function orchestrate(config, initialInput) {
  let previous = "";
  for (const step of config.prompts) {
    const context = loadContext(step.contextFile);
    const merged = `${context}
${previous || initialInput}`;
    const output = substitute(step.template, { input: initialInput, previous });
    previous = output;
  }
  return previous;
}

// CLI argument parsing
const args = process.argv.slice(2);
let configPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--config" && i + 1 < args.length) {
    configPath = args[i + 1];
    i++;
  }
}
if (!configPath) {
  console.error("Error: --config <path> is required");
  process.exit(1);
}

// Read stdin as the initial input
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => (stdin += chunk));
process.stdin.on("end", () => {
  const config = loadConfig(configPath);
  const result = orchestrate(config, stdin.trim());
  console.log(result);
  process.exit(0);
});
process.stdin.resume();