const fs = require('fs');
const path = require('path');

const files = [
  'app/(admin)/facturas/scan/page.tsx',
  'components/facturas/AuditModal.tsx',
  'components/facturas/HistoryModal.tsx',
  'app/(admin)/facturas/history/page.tsx',
  'app/(admin)/facturas/audit/page.tsx',
  'scripts/force-migrate.js'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, '..', f);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Reemplazar \` con `
    content = content.replace(/\\`/g, '`');
    // Reemplazar \$ con $
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${f}`);
  }
});
