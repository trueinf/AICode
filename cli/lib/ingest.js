// cli/lib/ingest.js
import fs from "fs";
import path from "path";

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, fileList);
    } else if (file.endsWith(".js") || file.endsWith(".ts")) {
      const content = fs.readFileSync(filepath, "utf-8");
      fileList.push({ path: filepath, content });
    }
  }
  return fileList;
}

export async function ingest(basePath = "./") {
  console.log(`🔍 Ingesting from: ${basePath}`);
  if (!fs.existsSync(basePath)) {
    throw new Error(`Directory does not exist: ${basePath}`);
  }
  return walk(basePath);
}
