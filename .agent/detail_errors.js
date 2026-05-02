import fs from 'fs';

const filePath = process.argv[2];
const rules = process.argv.slice(3);

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data.forEach(file => {
  file.messages.forEach(msg => {
    if (rules.includes(msg.ruleId)) {
      console.log(`File: ${file.filePath}`);
      console.log(`Line: ${msg.line}:${msg.column}`);
      console.log(`Rule: ${msg.ruleId}`);
      console.log(`Message: ${msg.message}`);
      console.log('---');
    }
  });
});
