const fs = require('fs');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.log('File not found:', file);
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');
const thaiRegex = /[\u0E00-\u0E7F]/;

lines.forEach((line, idx) => {
  if (!thaiRegex.test(line)) return;
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

  let stripped = line;
  stripped = stripped.replace(/t\(\s*['"][a-zA-Z0-9_]+['"]\s*,\s*['"][^'"]*['"]\s*\)/g, '');
  stripped = stripped.replace(/t\(\s*['"][a-zA-Z0-9_]+['"]\s*\)/g, '');

  if (thaiRegex.test(stripped)) {
    console.log(`L${idx + 1}: ${line}`);
  }
});
