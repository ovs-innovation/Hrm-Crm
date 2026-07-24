#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const roots = [
  path.join(process.cwd(), 'Admin', 'src'),
  path.join(process.cwd(), 'Frontend', 'src'),
];

const replacements = [
  [/text-white\/50/g, 'text-muted'],
  [/text-white\/70/g, 'text-muted'],
  [/text-white\/35/g, 'text-muted'],
  [/text-white\/45/g, 'text-muted'],
  [/bg-white bg-navy/g, 'bg-surface'],
  [/bg-white bg-surface/g, 'bg-surface'],
  [/border-navy\/12 border-line/g, 'border-line'],
  [/border-navy\/15/g, 'border-line'],
  [/border-navy\/10/g, 'border-line'],
  [/border-white\/5/g, 'border-line'],
  [/divide-white\/5/g, 'divide-line'],
  [/divide-white\/10/g, 'divide-line'],
  [/bg-navy\/20/g, 'bg-soft'],
  [/bg-navy\/50/g, 'bg-soft'],
  [/bg-navy\/80/g, 'bg-ink/30'],
  [/hover:bg-white\/\[0\.02\]/g, 'hover:bg-soft'],
  [/text-2xl font-bold text-white/g, 'text-[15px] font-semibold text-ink'],
  [/text-3xl font-extrabold text-white/g, 'text-[15px] font-semibold text-ink'],
  [/text-xl font-bold text-white/g, 'text-[15px] font-semibold text-ink'],
  [/text-lg font-bold text-white/g, 'text-[15px] font-semibold text-ink'],
  [/font-medium text-white(?![/\w])/g, 'font-medium text-ink'],
  [/ dark:[^\s"']+/g, ''],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(jsx|tsx|js|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const [pattern, replacement] of replacements) {
      content = content.replace(pattern, replacement);
    }
    if (content !== original) {
      fs.writeFileSync(file, content);
      changed++;
      console.log('fixed:', path.relative(process.cwd(), file));
    }
  }
}
console.log(`Done. ${changed} files updated.`);
