import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const webDist = resolve(__dirname, '../../web/dist');
  const dest = resolve(__dirname, '../assets/web-build');
  await cp(webDist, dest, { recursive: true });
  console.log('[copy-web-build] Copied', webDist, '->', dest);
}

main().catch((err) => {
  console.error('[copy-web-build] Error:', err);
  process.exit(1);
});
