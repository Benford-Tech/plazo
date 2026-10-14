import { spawn } from 'child_process';
import { retryDelay, transientCodeIn } from '@/domain/migrate-retry';

/**
 * `prisma migrate deploy` for the Vercel build, retried while the database is waking up.
 *
 * The output is passed through as it comes; a run that fails with a connection error (P1001, P1002,
 * P1017) is started again after a short wait, any other failure stops the build with Prisma's exit code.
 */
function runOnce(): Promise<{ code: number; output: string }> {
  return new Promise(resolve => {
    const child = spawn('prisma', ['migrate', 'deploy'], { stdio: ['inherit', 'pipe', 'pipe'], shell: true });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk);
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
      output += chunk.toString();
    });
    child.on('close', code => resolve({ code: code ?? 1, output }));
    child.on('error', err => resolve({ code: 1, output: String(err) }));
  });
}

async function main() {
  for (let attempt = 1; ; attempt++) {
    const { code, output } = await runOnce();
    if (code === 0) return;
    const transient = transientCodeIn(output);
    const wait = transient ? retryDelay(attempt) : null;
    if (wait === null) {
      process.exitCode = code;
      return;
    }
    console.warn(`[migrate] ${transient} on attempt ${attempt}: database not reachable yet, new attempt in ${wait / 1000} s`);
    await new Promise(r => setTimeout(r, wait));
  }
}

void main();
