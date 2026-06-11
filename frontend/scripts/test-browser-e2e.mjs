#!/usr/bin/env node
/**
 * Browser E2E smoke test for MediaPipe asset + lesson page.
 * Requires: Next server on FE_BASE (default http://127.0.0.1:3002)
 */

import { chromium } from "playwright";

const FE_BASE = process.env.FE_BASE ?? "http://127.0.0.1:3002";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const modelResp = await context.request.get(
    `${FE_BASE}/models/hand_landmarker.task`
  );
  if (!modelResp.ok()) {
    throw new Error(`MediaPipe model asset failed: ${modelResp.status()}`);
  }
  const modelBytes = (await modelResp.body()).length;
  if (modelBytes < 1_000_000) {
    throw new Error(`MediaPipe model too small: ${modelBytes} bytes`);
  }
  console.log(`PASS MediaPipe model asset (${modelBytes} bytes)`);

  const lessonResp = await page.goto(`${FE_BASE}/en/finger-spelling/lessons/1`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  if (!lessonResp || !lessonResp.ok()) {
    throw new Error(`Lesson page failed: ${lessonResp?.status()}`);
  }
  console.log("PASS lesson page loads");

  await page.waitForFunction(
    () => document.body.innerText.includes("REC"),
    { timeout: 60_000 }
  );
  console.log("PASS REC control rendered");

  await browser.close();
  console.log("ALL BROWSER CHECKS PASSED");
}

main().catch((error) => {
  console.error("FAIL browser E2E:", error.message ?? error);
  process.exit(1);
});
