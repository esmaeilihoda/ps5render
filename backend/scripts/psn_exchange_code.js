import fs from 'fs';
import * as psn from 'psn-api';

async function tryCandidates(candidates, ...args) {
  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') {
          const res = await psn[ns][fn](...args);
          return { name: `${ns}.${fn}`, result: res };
        }
      } else if (typeof psn[c] === 'function') {
        const res = await psn[c](...args);
        return { name: c, result: res };
      }
    } catch (err) {
      console.warn(`candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }
  return null;
}

async function main() {
  const code = 'v3.DFxGB3';
  console.log('Trying to exchange code:', code);
  const authCandidates = ['exchangeCodeForAccessToken', 'exchangeAccessCodeForAuthTokens', ['oauth', 'exchangeCodeForAccessToken'], 'exchangeAccessCodeForAuthTokens'];
  const attempt = await tryCandidates(authCandidates, code);
  if (!attempt) {
    console.error('No candidate worked for code exchange');
    process.exit(1);
  }
  console.log('Used:', attempt.name);
  const outPath = 'psn_exchange_code_result.json';
  fs.writeFileSync(outPath, JSON.stringify({ used: attempt.name, raw: attempt.result }, null, 2));
  console.log('WROTE', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
