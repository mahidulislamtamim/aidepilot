const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../src/db/schema.sql');
const destDir = path.join(__dirname, '../dist/db');
const dest = path.join(destDir, 'schema.sql');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Copied schema.sql to dist/db/');
