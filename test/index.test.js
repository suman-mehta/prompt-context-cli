import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const tmpDir = resolve(process.cwd(), "tmp-test");
await rm(tmpDir, { recursive: true, force: true });
await writeFile(tmpDir, ""); // ensure directory exists

test("prompt-context orchestrates correctly", async t => {
  const configPath = resolve("tmp-test", "config.json");
  const ctxPath = resolve("tmp-test", "ctx.txt");
  const input = "Hello world";
  const config = {
    prompts: [
      {
        template: "Summarize: {{input}}",
        contextFile: "ctx.txt"
      },
      {
        template: "Translate: {{previous}}",
        contextFile: null
      }
    ]
  };
  await writeFile(configPath, JSON.stringify(config, null, 2));
  await writeFile(ctxPath, "Context line");

  const result = spawnSync("node", [resolve("src", "index.js"), "--config", configPath], {
    input,
    encoding: "utf8"
  });

  assert.strictEqual(result.status, 0);
  const expected = "Translate: Summarize: Hello world";
  assert.strictEqual(result.stdout.trim(), expected);
});

await rm("tmp-test", { recursive: true, force: true });