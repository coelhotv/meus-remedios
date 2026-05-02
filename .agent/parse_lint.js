import fs from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node parse_lint.js <file.json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const summary = {};

data.forEach(file => {
  file.messages.forEach(msg => {
    const ruleId = msg.ruleId || 'unknown';
    if (!summary[ruleId]) {
      summary[ruleId] = {
        count: 0,
        files: new Set()
      };
    }
    summary[ruleId].count++;
    summary[ruleId].files.add(file.filePath);
  });
});

const sorted = Object.entries(summary).sort((a, b) => b[1].count - a[1].count);

sorted.forEach(([rule, info]) => {
  console.log(`${rule}: ${info.count} problems (${info.files.size} files)`);
});
