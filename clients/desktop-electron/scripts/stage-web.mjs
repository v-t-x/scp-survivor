import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

async function copyTree(sourceRoot, currentDir, stageDir, files) {
  const names = (await readdir(currentDir)).sort();
  for (const name of names) {
    const sourcePath = join(currentDir, name);
    const info = await lstat(sourcePath);
    if (info.isSymbolicLink()) {
      throw new Error("Symbolic links are not allowed: " + sourcePath);
    }
    const relativePath = relative(sourceRoot, sourcePath);
    const targetPath = join(stageDir, relativePath);
    if (info.isDirectory()) {
      await mkdir(targetPath, { recursive: true });
      await copyTree(sourceRoot, sourcePath, stageDir, files);
      continue;
    }
    if (!info.isFile()) {
      throw new Error("Unsupported artifact entry: " + sourcePath);
    }
    const bytes = await readFile(sourcePath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, bytes);
    files.push({
      path: relativePath.split(sep).join("/"),
      size: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex")
    });
  }
}

export async function stageWeb({ sourceDir, stageDir, commit, dirty }) {
  let entry;
  try {
    entry = await lstat(join(sourceDir, "index.html"));
  } catch {
    throw new Error("Missing web entry: index.html");
  }
  if (!entry.isFile()) {
    throw new Error("Missing web entry: index.html");
  }
  await rm(stageDir, { recursive: true, force: true });
  await mkdir(stageDir, { recursive: true });
  const files = [];
  await copyTree(sourceDir, sourceDir, stageDir, files);
  files.sort((left, right) => left.path.localeCompare(right.path));
  const manifest = { commit, dirty, files };
  await writeFile(
    join(stageDir, "build-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return manifest;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const clientRoot = resolve(dirname(scriptPath), "..");
  const repoRoot = resolve(clientRoot, "..", "..");
  const commit = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
    encoding: "utf8"
  }).trim();
  const dirty = execFileSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8"
  }).trim().length > 0;
  await stageWeb({
    sourceDir: join(repoRoot, "dist"),
    stageDir: join(clientRoot, ".web-dist"),
    commit,
    dirty
  });
}
