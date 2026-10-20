const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(tsx|ts)$/.test(file) && !file.includes('translations.ts')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('src/components').concat(['src/App.tsx']);
const thaiRegex = /[\u0E00-\u0E7F]/;

const findings = {};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (!thaiRegex.test(line)) return;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    let stripped = line;
    stripped = stripped.replace(/t\(\s*['"][a-zA-Z0-9_]+['"]\s*,\s*['"][^'"]*['"]\s*\)/g, '');
    stripped = stripped.replace(/t\(\s*['"][a-zA-Z0-9_]+['"]\s*\)/g, '');

    if (thaiRegex.test(stripped)) {
      if (!findings[file]) findings[file] = [];
      findings[file].push({ lineNum: idx + 1, content: trimmed });
    }
  });
});

console.log('COMPONENT SCAN:');
for (const file of Object.keys(findings)) {
  console.log(`\n=== FILE: ` + file + ` (` + findings[file].length + ` lines) ===`);
  findings[file].forEach(item => {
    console.log(`  L` + item.lineNum + `: ` + item.content.substring(0, 110));
  });
}
if (Object.keys(findings).length === 0) {
  console.log('ALL COMPONENTS CLEAN OF HARDCODED THAI!');
}
