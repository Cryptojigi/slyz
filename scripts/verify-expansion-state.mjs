import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// Test 1: Verify constants.ts
const constantsContent = fs.readFileSync(path.join(projectRoot, 'src', 'lib', 'constants.ts'), 'utf8');

// Extract symbols
const xstocksMatches = constantsContent.match(/symbol:\s*["']([^"']+)["'],\s*name:[^,]+,\s*underlying:[^,]+,\s*mint:[^,]+,\s*decimals:\s*8,\s*logo:[^,]+,\s*category:[^,]+,\s*market:\s*["']public["'],\s*issuer:\s*["']xstocks["']/g) || [];
console.log('Verified xStocks parsed count:', xstocksMatches.length);

const prestocksMatches = constantsContent.match(/issuer:\s*["']prestocks["']/g) || [];
console.log('Verified PreStocks count:', prestocksMatches.length);

// Check if any non-PreStocks preipo exists
const invalidPreipo = constantsContent.match(/category:\s*["']preipo["'][^}]*issuer:\s*["'](?!prestocks)["']/g);
console.log('Invalid non-PreStocks pre-IPO tokens:', invalidPreipo ? invalidPreipo.length : 0);

// Check new baskets
const hasPayments = constantsContent.includes('id: "payments"');
const hasConsumer = constantsContent.includes('id: "consumer"');
const hasHardAssets = constantsContent.includes('id: "hard-assets"');
const mag3Default = constantsContent.indexOf('id: "mag-3"') < constantsContent.indexOf('id: "payments"');

console.log('Basket Checks:');
console.log(' - Payments basket present:', hasPayments);
console.log(' - Consumer basket present:', hasConsumer);
console.log(' - Hard Assets basket present:', hasHardAssets);
console.log(' - Mag 3 is default first basket:', mag3Default);

// Check for dead domain useslyz.com
let domainCount = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'scratch' || entry.name === 'verify-expansion-state.mjs') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.mjs') || full.endsWith('.html') || full.endsWith('.svg'))) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('useslyz.com')) {
        console.error('Found useslyz.com in:', full);
        domainCount++;
      }
    }
  }
}
walk(projectRoot);
console.log('Total useslyz.com references in active files:', domainCount);

// Check for "10 Verified" or "All Verified" in src
let staleStringCount = 0;
function walkSrc(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full);
    else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      const c = fs.readFileSync(full, 'utf8');
      if (/10 verified|all verified/i.test(c)) {
        console.error('Found stale string in:', full);
        staleStringCount++;
      }
    }
  }
}
walkSrc(path.join(projectRoot, 'src'));
console.log('Total stale 10-verified / all-verified strings in src:', staleStringCount);

console.log('\n--- VERIFICATION RESULT ---');
const allPassed = (
  prestocksMatches.length === 8 &&
  !invalidPreipo &&
  hasPayments &&
  hasConsumer &&
  hasHardAssets &&
  mag3Default &&
  domainCount === 0 &&
  staleStringCount === 0
);
console.log(allPassed ? 'ALL AUDIT CHECKS PASSED!' : 'SOME AUDIT CHECKS FAILED!');
