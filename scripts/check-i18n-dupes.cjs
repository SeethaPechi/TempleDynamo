#!/usr/bin/env node
/**
 * Duplicate-key guard for i18n locale JSON files.
 * Runs as part of the build / lint step and exits non-zero if any
 * duplicate key is found at any nesting level.
 *
 * Usage:  node scripts/check-i18n-dupes.js
 *   or:   npm run lint:i18n
 */

const fs = require("fs");
const path = require("path");

const LOCALE_DIR = path.join(__dirname, "../client/src/i18n/locales");

/**
 * Walk the raw JSON text and report every duplicate key at every depth.
 * Standard JSON.parse silently keeps the last value, so we need our own
 * character-level scanner.
 */
function findDuplicateKeys(text) {
  const dupes = [];
  // Stack of { path: string, keys: Set<string> } — one entry per open object
  const stack = [];
  let inString = false;
  let escaped = false;
  let buf = "";
  let capturingKey = false;
  let justOpenedObject = true; // next string inside {} is a key

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Handle escape sequences inside strings
    if (escaped) {
      escaped = false;
      if (capturingKey) buf += ch;
      continue;
    }
    if (inString && ch === "\\") {
      escaped = true;
      if (capturingKey) buf += ch;
      continue;
    }

    // Toggle string mode
    if (ch === '"') {
      if (!inString) {
        // Opening quote — are we about to read a key?
        inString = true;
        buf = "";
        // A key appears at the start of an object or after a comma (at object level)
        capturingKey = stack.length > 0 && justOpenedObject;
        justOpenedObject = false;
      } else {
        // Closing quote
        inString = false;
        if (capturingKey) {
          const key = buf;
          const frame = stack[stack.length - 1];
          if (frame.keys.has(key)) {
            dupes.push({ path: (frame.path ? frame.path + "." : "") + key });
          } else {
            frame.keys.add(key);
          }
          capturingKey = false;
        }
        buf = "";
      }
      continue;
    }

    if (inString) {
      if (capturingKey) buf += ch;
      continue;
    }

    // Structural characters
    if (ch === "{") {
      const parentPath = stack.length > 0 ? stack[stack.length - 1].path : "";
      // The object's path is the last-read key of its parent frame
      const myPath =
        stack.length > 0
          ? stack[stack.length - 1]._lastKey || parentPath
          : "";
      stack.push({ path: myPath, keys: new Set(), _lastKey: "" });
      justOpenedObject = true;
    } else if (ch === "}") {
      stack.pop();
      justOpenedObject = false;
    } else if (ch === ":") {
      // The string we just read was a key; remember it so child objects can use it as path
      if (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const lastKey = [...frame.keys].pop() || "";
        frame._lastKey = (frame.path ? frame.path + "." : "") + lastKey;
      }
      // Next token is a value, not a key — but after it, next string at this
      // depth (after comma) is a key again
      justOpenedObject = false;
    } else if (ch === ",") {
      justOpenedObject = true; // next string at current depth is a key
    }
    // '[' and ']' — arrays don't have keys, we don't need to track them
  }

  return dupes;
}

let failed = false;

const files = fs
  .readdirSync(LOCALE_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => path.join(LOCALE_DIR, f));

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const text = fs.readFileSync(file, "utf8");

  // 1. Basic JSON validity
  try {
    JSON.parse(text);
  } catch (e) {
    console.error(`❌  ${rel}: invalid JSON — ${e.message}`);
    failed = true;
    continue;
  }

  // 2. Duplicate-key check
  const dupes = findDuplicateKeys(text);
  if (dupes.length > 0) {
    console.error(
      `❌  ${rel}: duplicate keys found:\n` +
        dupes.map((d) => `     • ${d.path}`).join("\n")
    );
    failed = true;
  } else {
    console.log(`✅  ${rel}: no duplicate keys`);
  }
}

if (failed) {
  process.exit(1);
}
