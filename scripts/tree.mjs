import fs from "fs";
import path from "path";

const IGNORED = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".turbo",
  "dist",
  "build",
  ".DS_Store",
]);

function printTree(dirPath, prefix = "") {
  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !IGNORED.has(entry.name))
    .sort((a, b) => {
      // Directories first, then files alphabetically
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      console.log(`${prefix}${connector}📁 \x1b[32m${entry.name}/\x1b[0m`);
      printTree(fullPath, `${prefix}${childPrefix}`);
    } else {
      console.log(`${prefix}${connector}📄 ${entry.name}`);
    }
  });
}

const rootDir = process.cwd();
const rootName = path.basename(rootDir);
console.log(`\n📦 \x1b[1m\x1b[34m${rootName}\x1b[0m`);
printTree(rootDir);
console.log("");
