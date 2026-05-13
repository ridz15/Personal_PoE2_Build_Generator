import { readFile } from "node:fs/promises";

export async function loadJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

