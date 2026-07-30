#!/usr/bin/env node
/**
 * Converts a transparent (VP9-alpha) WebM loop into the WebP frame sequence
 * rendered by `src/components/VialLoop.tsx`.
 *
 * Safari cannot play VP9-alpha video, so the site draws alpha WebP frames on
 * a canvas instead. This script is the pipeline from a compositing export
 * (e.g. `*_transparent_loop.webm`) to those frames.
 *
 * Run with:
 *   npm run vial:frames -- path/to/loop.webm
 *   node scripts/extract-vial-frames.mjs path/to/loop.webm [--fps 15] [--width 337] [--out public/images/vial-frames]
 *
 * Requires ffmpeg on PATH. Decoding is forced through libvpx-vp9 because
 * ffmpeg's native VP9 decoder silently drops the alpha channel.
 *
 * When writing to the default output directory, the FRAME_COUNT, FRAME_WIDTH,
 * FRAME_HEIGHT, and FPS constants in VialLoop.tsx are updated automatically.
 */

import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, writeFile, unlink, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_OUT = join(ROOT, "public/images/vial-frames");
const VIAL_LOOP_COMPONENT = join(ROOT, "src/components/VialLoop.tsx");

// VialLoop's frameSrc pads frame numbers to 2 digits, so the sequence tops
// out at 100 frames. At the default 15 fps that allows loops up to ~6.6 s.
const MAX_FRAMES = 100;

const log = (...args) => console.log("[vial-frames]", ...args);

function fail(message) {
  console.error(`[vial-frames] error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { fps: 15, width: 337, out: DEFAULT_OUT, input: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--fps") args.fps = Number(argv[++i]);
    else if (arg === "--width") args.width = Number(argv[++i]);
    else if (arg === "--out") args.out = resolve(argv[++i]);
    else if (!arg.startsWith("--") && !args.input) args.input = resolve(arg);
    else fail(`unknown argument: ${arg}`);
  }
  if (!args.input) fail("usage: node scripts/extract-vial-frames.mjs <input.webm> [--fps N] [--width N] [--out DIR]");
  if (!Number.isFinite(args.fps) || args.fps <= 0) fail("--fps must be a positive number");
  if (!Number.isInteger(args.width) || args.width <= 0) fail("--width must be a positive integer");
  return args;
}

function assertFfmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    fail("ffmpeg not found on PATH — install it first (e.g. `brew install ffmpeg`)");
  }
}

async function extractPngFrames(input, fps, width, workDir) {
  // -c:v libvpx-vp9 is load-bearing: ffmpeg's built-in VP9 decoder ignores
  // the alpha side-band, producing opaque frames with no warning.
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "error",
      "-c:v", "libvpx-vp9",
      "-i", input,
      "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos`,
      "-start_number", "0",
      join(workDir, "frame-%03d.png"),
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    fail(`ffmpeg failed:\n${result.stderr || result.error?.message || "unknown error"}`);
  }
  const pngs = (await readdir(workDir)).filter((f) => f.endsWith(".png")).sort();
  if (pngs.length === 0) fail("ffmpeg produced no frames — is the input a valid video?");
  return pngs.map((f) => join(workDir, f));
}

async function writeWebpFrames(pngFiles, outDir) {
  await mkdir(outDir, { recursive: true });

  // Clear the previous sequence so a shorter loop leaves no stale frames.
  for (const entry of await readdir(outDir)) {
    if (/^frame-\d+\.webp$/.test(entry)) await unlink(join(outDir, entry));
  }

  let totalBytes = 0;
  let dimensions;
  for (let i = 0; i < pngFiles.length; i++) {
    const png = await readFile(pngFiles[i]);
    if (i === 0) {
      // Probe the decoded PNG, not the WebP output: the WebP encoder strips
      // the alpha channel from individual fully-opaque frames, which would
      // falsely report an opaque source.
      const meta = await sharp(png).metadata();
      dimensions = { width: meta.width, height: meta.height, hasAlpha: meta.hasAlpha };
    }
    const buffer = await sharp(png).webp({ quality: 82, effort: 6 }).toBuffer();
    totalBytes += buffer.byteLength;
    await writeFile(join(outDir, `frame-${String(i).padStart(2, "0")}.webp`), buffer);
  }
  return { totalBytes, dimensions };
}

async function updateVialLoopConstants({ count, width, height, fps }) {
  let source;
  try {
    source = await readFile(VIAL_LOOP_COMPONENT, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      log(`skipped constant update — ${VIAL_LOOP_COMPONENT} not found`);
      return;
    }
    throw err;
  }
  const replacements = [
    [/const FRAME_COUNT = \d+;/, `const FRAME_COUNT = ${count};`],
    [/const FRAME_WIDTH = \d+;/, `const FRAME_WIDTH = ${width};`],
    [/const FRAME_HEIGHT = \d+;/, `const FRAME_HEIGHT = ${height};`],
    [/const FPS = \d+;/, `const FPS = ${fps};`],
  ];
  let updated = source;
  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(updated)) fail(`could not find \`${pattern}\` in VialLoop.tsx — update constants manually`);
    updated = updated.replace(pattern, replacement);
  }
  if (updated !== source) {
    await writeFile(VIAL_LOOP_COMPONENT, updated);
    log(`updated constants in ${VIAL_LOOP_COMPONENT}`);
  }
}

const { input, fps, width, out } = parseArgs(process.argv.slice(2));
assertFfmpeg();

const workDir = await mkdtemp(join(tmpdir(), "vial-frames-"));
try {
  log(`extracting frames from ${input} at ${fps} fps, ${width}px wide`);
  const pngFiles = await extractPngFrames(input, fps, width, workDir);

  if (pngFiles.length > MAX_FRAMES) {
    fail(
      `got ${pngFiles.length} frames but VialLoop supports at most ${MAX_FRAMES} ` +
        `(2-digit frame names). Lower --fps or trim the loop.`,
    );
  }

  const { totalBytes, dimensions } = await writeWebpFrames(pngFiles, out);
  log(
    `wrote ${pngFiles.length} frames (${dimensions.width}x${dimensions.height}, ` +
      `${(totalBytes / 1024).toFixed(0)} KB total) to ${out}`,
  );

  if (!dimensions.hasAlpha) {
    log("warning: frames have NO alpha channel — the source video may not contain transparency");
  }

  if (out === DEFAULT_OUT) {
    await updateVialLoopConstants({
      count: pngFiles.length,
      width: dimensions.width,
      height: dimensions.height,
      fps,
    });
  } else {
    log("custom --out dir: VialLoop.tsx constants were not touched");
  }
  log("done.");
} finally {
  await rm(workDir, { recursive: true, force: true });
}
