/**
 * Brand theme migrator — maps blue/indigo chrome to design tokens.
 *
 * Intentionally does NOT rewrite semantic status colors (success/warning/danger).
 * Also repairs known invalid Tailwind leftovers from older runs.
 */
import fs from 'fs';
import path from 'path';

const roots = [
  path.resolve('Frontend/src'),
  path.resolve('Admin/src'),
];

// Only brand/chrome replacements — never map red/emerald/amber status palettes.
const replacements = [
  ['text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400', 'text-brand'],
  ['bg-gradient-to-tr from-blue-500 to-indigo-500', 'bg-brand'],
  ['bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-brand'],
  ['bg-gradient-to-br from-blue-500 to-indigo-600', 'bg-brand'],
  ['bg-gradient-to-tr from-indigo-500 to-purple-500', 'bg-brand'],
  ['from-blue-600 to-indigo-600', 'from-brand to-brand'],
  ['from-blue-600 to-purple-600', 'from-brand to-brand'],
  ['from-blue-500 to-indigo-500', 'from-brand to-brand'],
  ['from-indigo-500 to-purple-500', 'from-brand to-brand'],
  ['shadow-blue-500/30', 'shadow-brand/20'],
  ['shadow-blue-500/20', 'shadow-brand/15'],
  ['shadow-blue-500/5', 'shadow-brand/10'],
  ['shadow-indigo-500/30', 'shadow-brand/15'],
  ['shadow-indigo-500/20', 'shadow-brand/15'],
  ['text-blue-700', 'text-brand'],
  ['text-blue-600', 'text-brand'],
  ['text-blue-500', 'text-brand'],
  ['text-blue-400', 'text-brand'],
  ['text-indigo-600', 'text-brand'],
  ['text-indigo-500', 'text-brand'],
  ['text-indigo-400', 'text-brand'],
  ['bg-blue-700', 'bg-brand/90'],
  ['bg-blue-600', 'bg-brand'],
  ['bg-blue-500', 'bg-brand'],
  ['bg-blue-400', 'bg-brand'],
  ['bg-blue-100', 'bg-brand/10'],
  ['bg-blue-50', 'bg-brand/10'],
  ['bg-indigo-600', 'bg-brand'],
  ['bg-indigo-500', 'bg-brand'],
  ['bg-indigo-100', 'bg-brand/15'],
  ['bg-indigo-50', 'bg-brand/10'],
  ['hover:bg-blue-700', 'hover:bg-brand/90'],
  ['hover:bg-blue-600', 'hover:bg-brand/90'],
  ['hover:bg-blue-100', 'hover:bg-brand/15'],
  ['hover:bg-blue-50', 'hover:bg-brand/10'],
  ['hover:bg-indigo-700', 'hover:bg-brand/90'],
  ['hover:bg-indigo-50', 'hover:bg-brand/10'],
  ['hover:text-blue-700', 'hover:text-brand/90'],
  ['hover:text-blue-600', 'hover:text-brand/90'],
  ['focus:ring-blue-500', 'focus:ring-brand/30'],
  ['focus:border-blue-500', 'focus:border-brand'],
  ['focus:ring-indigo-500/50', 'focus:ring-brand/30'],
  ['border-blue-500', 'border-brand'],
  ['border-blue-200', 'border-brand/25'],
  ['border-indigo-100', 'border-brand/20'],
  ['ring-blue-500', 'ring-brand'],
  ['from-blue-500', 'from-brand'],
  ['from-indigo-500', 'from-brand'],
  ['to-indigo-600', 'to-brand'],
  ['to-indigo-500', 'to-brand'],
  ['to-indigo-700', 'to-brand/90'],
  ['glass-panel', 'app-panel'],
  ['glass-card', 'app-card'],
];

// Repair invalid / stacked opacity classes left by older theme runs.
const repairs = [
  [/bg-brand\/(\d+)\/(\d+)/g, 'bg-brand/$1'],
  [/hover:bg-brand\/(\d+)\/(\d+)/g, 'hover:bg-brand/$1'],
  [/text-brand\/(\d+)\/(\d+)/g, 'text-brand/$1'],
  [/border-brand\/(\d+)\/(\d+)/g, 'border-brand/$1'],
  [/shadow-brand\/100/g, 'shadow-brand/20'],
  [/bg-surface0/g, 'bg-soft'],
  [/bg-white0/g, 'bg-white/30'],
  [/bg-white\/30\/20/g, 'bg-soft'],
  [/border-white\/15\/\d+/g, 'border-white/15'],
  [/placeholder-white\/35/g, 'placeholder:text-muted'],
  [/hover:bg-brand\/100\/10/g, 'hover:bg-brand/10'],
  [/hover:bg-brand\/100\/20/g, 'hover:bg-brand/10'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(jsx?|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let fileCount = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    if (file.endsWith('index.css')) continue;
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
      }
    }
    for (const [pattern, to] of repairs) {
      content = content.replace(pattern, to);
    }

    if (content !== original) {
      fs.writeFileSync(file, content);
      fileCount += 1;
    }
  }
}

console.log(`Updated ${fileCount} files.`);
