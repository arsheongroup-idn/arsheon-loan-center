// Scans the project for real credential VALUES (not variable names).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SKIP = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.mjs', '.example', '']);
const PATTERNS = [
  [/AIza[0-9A-Za-z_-]{20,}/, 'Google API key value'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'Private key block'],
  [/"client_email"\s*:\s*"[^"]+@[^"]+\.iam\.gserviceaccount\.com"/, 'Service account email'],
  [/"private_key"\s*:/, 'Service account private_key field'],
  [/password\s*=\s*['"]?[^\s'"]{4,}/i, 'password= value'],
  [/secret\s*=\s*['"]?[^\s'"]{4,}/i, 'secret= value'],
  [/token\s*=\s*['"]?[A-Za-z0-9_-]{16,}/i, 'token= value'],
];

const hits = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (name === 'security-scan.mjs' || !EXT.has(extname(name))) continue;
    const text = readFileSync(p, 'utf8');
    text.split('\n').forEach((line, i) => {
      for (const [re, label] of PATTERNS) if (re.test(line)) hits.push(`${p}:${i + 1}  ${label}`);
    });
  }
})(process.cwd());

if (hits.length) {
  console.error('Possible credentials found:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('Security scan passed: no credential values found.');
