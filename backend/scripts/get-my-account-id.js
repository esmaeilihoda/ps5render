import * as psn from 'psn-api';
import fs from 'fs';

// Very small helper: exchange NPSSO -> code -> tokens, then call getProfile(authorization, 'me')
// Edit the constant below and paste your NPSSO token, or set the env var PSN_NPSSO and leave this as-is.
const MY_NPSSO_TOKEN = "paste_your_npsso_token_here";

async function tryCandidates(candidates, ...args) {
  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') {
          return { name: `${ns}.${fn}`, result: await psn[ns][fn](...args) };
        }
      } else if (typeof psn[c] === 'function') {
        return { name: c, result: await psn[c](...args) };
      }
    } catch (err) {
      // console.warn to keep output minimal but helpful
      console.warn(`candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }
  return null;
}

async function main() {
  let npsso = (MY_NPSSO_TOKEN && MY_NPSSO_TOKEN !== 'paste_your_npsso_token_here') ? MY_NPSSO_TOKEN : process.env.PSN_NPSSO;

  // If FORCE_USE_EXCHANGE is set, ignore NPSSO and use any existing exchange result
  if (process.env.FORCE_USE_EXCHANGE === '1') npsso = null;

  // If no NPSSO provided, fall back to any previously saved exchange result and use its tokens
  if (!npsso) {
    const exchangePath = '../psn_exchange_code_result.json';
    if (fs.existsSync(exchangePath)) {
      const r = JSON.parse(fs.readFileSync(exchangePath, 'utf8'));
      const auth = r.raw || r.result || r;
      const authorization = {
        accessToken: auth?.accessToken || auth?.access_token || auth?.token || auth?.idToken || null,
        refreshToken: auth?.refreshToken || auth?.refresh_token || null,
        idToken: auth?.idToken || auth?.id_token || null,
        raw: auth
      };

      // Build the token shape and call getProfile directly; if that fails, try username-based lookup
      const tokenShape = { accessToken: authorization.accessToken, idToken: authorization.idToken, refreshToken: authorization.refreshToken };
      const profileCandidates = ['getProfile', 'getProfileFromAccountId', ['profile', 'getProfile'], ['user', 'getProfileFromAccountId']];
      let profileAttempt = await tryCandidates(profileCandidates, tokenShape, 'me');
      if (!profileAttempt) profileAttempt = await tryCandidates(profileCandidates, 'me', tokenShape);

      if (!profileAttempt) {
        // Try username-based function names using online id from idToken if present
        let username = null;
        try {
          const idTok = authorization.idToken;
          if (idTok && typeof idTok === 'string') {
            const parts = idTok.split('.');
            if (parts.length >= 2) {
              const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
              username = payload.online_id || payload.onlineId || payload.onlne_id || payload.sub || null;
            }
          }
        } catch (e) {
          // ignore decode errors
        }

        if (username) {
          const userNameCandidates = ['getProfileFromUserName', ['profile', 'getProfileFromUserName']];
          profileAttempt = await tryCandidates(userNameCandidates, tokenShape, username) || await tryCandidates(userNameCandidates, username, tokenShape) || await tryCandidates(userNameCandidates, authorization.accessToken, username);
        }
      }

      if (!profileAttempt) {
        console.error('getProfile call failed for all candidates using existing tokens.');
        process.exit(1);
      }
      console.log(JSON.stringify(profileAttempt.result || profileAttempt.raw || profileAttempt, null, 2));
      return;
    }

    console.error('No NPSSO provided and no existing exchange result found. Set MY_NPSSO_TOKEN or export PSN_NPSSO.');
    process.exit(2);
  }

  // Step 1: exchange NPSSO for a code
  const codeCandidates = ['exchangeNpssoForCode', 'exchangeNpssoForAccessCode', ['oauth', 'exchangeNpssoForCode']];
  const codeAttempt = await tryCandidates(codeCandidates, npsso);
  if (!codeAttempt) {
    console.error('Failed to exchange NPSSO for code. No candidate worked.');
    process.exit(1);
  }

  const code = codeAttempt.result?.code || codeAttempt.result?.accessCode || codeAttempt.result?.authCode || codeAttempt.result?.authorizationCode || (typeof codeAttempt.result === 'string' ? codeAttempt.result : null);
  if (!code) {
    console.error('Exchange returned no code object:', JSON.stringify(codeAttempt.result || codeAttempt, null, 2));
    process.exit(1);
  }

  // Step 2: exchange the code for tokens
  const authCandidates = ['exchangeCodeForAccessToken', 'exchangeAccessCodeForAuthTokens', ['oauth', 'exchangeCodeForAccessToken']];
  const authAttempt = await tryCandidates(authCandidates, code);
  if (!authAttempt) {
    console.error('Failed to exchange code for tokens. No candidate worked.');
    process.exit(1);
  }

  // Normalize possible auth shapes
  const rawAuth = authAttempt.result || authAttempt.result?.authorization || authAttempt.result?.tokens || authAttempt;
  const authorization = {
    accessToken: rawAuth?.accessToken || rawAuth?.access_token || rawAuth?.token || rawAuth?.idToken || null,
    refreshToken: rawAuth?.refreshToken || rawAuth?.refresh_token || null,
    idToken: rawAuth?.idToken || rawAuth?.id_token || null,
    raw: rawAuth
  };

  // Build several token shapes to try — different psn-api versions expect different shapes
  const tokenShape = { accessToken: authorization.accessToken, idToken: authorization.idToken, refreshToken: authorization.refreshToken };
  const tokenVariants = [
    tokenShape,
    authorization.accessToken,
    { accessToken: authorization.accessToken },
    { access_token: authorization.accessToken },
    { authorization: tokenShape },
    { auth: tokenShape }
  ];

  // Attempt getProfile(authorization, 'me') with multiple token shapes and arg orderings
  const profileCandidates = ['getProfile', 'getProfileFromAccountId', ['profile', 'getProfile'], ['user', 'getProfileFromAccountId']];
  let profileAttempt = null;
  for (const variant of tokenVariants) {
    profileAttempt = await tryCandidates(profileCandidates, variant, 'me');
    if (profileAttempt) break;
    profileAttempt = await tryCandidates(profileCandidates, 'me', variant);
    if (profileAttempt) break;
  }

  if (!profileAttempt) {
    console.error('getProfile call failed for all candidates and token shapes.');
    process.exit(1);
  }

  // Print only the profile result, nicely formatted
  console.log(JSON.stringify(profileAttempt.result || profileAttempt.raw || profileAttempt, null, 2));
}

main().catch(err => {
  console.error('script error', err?.message || String(err));
  process.exit(1);
});
