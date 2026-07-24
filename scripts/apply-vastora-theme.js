import fs from 'fs';
import path from 'path';

const roots = [path.resolve('Frontend/src'), path.resolve('Admin/src')];

const replacements = [
  ['#296CB3', '#296CB2'],
  ['#1F3150', '#273850'],
  ['bg-navy/95', 'bg-surface'],
  ['bg-navy/90', 'bg-surface'],
  ['bg-navy/80', 'bg-navy/80'],
  ['bg-white/5', 'bg-surface'],
  ['border-white/10', 'border-line'],
  ['border-white/15', 'border-line'],
  ['text-navy/85', 'text-ink'],
  ['text-navy/55', 'text-muted'],
  ['text-navy/70', 'text-muted'],
  ['text-white/80', 'text-ink'],
  ['text-white/65', 'text-muted'],
  ['hover:bg-brand/90', 'hover:bg-brand-hover'],
  ['bg-brand/90', 'bg-brand-hover'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.jsx$/.test(entry.name)) files.push(full);
  }
  return files;
}

let count = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    if (file.includes('layouts/Sidebar') || file.includes('layouts/Header')) continue;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(file, content);
      count += 1;
    }
  }
}

console.log(`Vastora light-theme migration: ${count} files updated.`);
