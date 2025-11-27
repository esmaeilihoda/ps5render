import fs from 'fs';
import * as psn from 'psn-api';

// Usage: set env PSN_NPSSO and run `node .\scripts\psn_full_fetch.js` from the backend folder

function redact(obj) {
  try {
    const s = JSON.stringify(obj);
    return s
      .replace(/(access[_-]?token\":\")([^\"]+)/ig, '$1<REDACTED>')
      .replace(/(refresh[_-]?token\":\")([^\"]+)/ig, '$1<REDACTED>')
      .replace(/(id[_-]?token\":\")([^\"]+)/ig, '$1<REDACTED>');
  } catch (e) {
    return String(obj);
  }
}

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
      console.warn(`candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }
  return null;
}

async function main() {
  const npsso = process.env.PSN_NPSSO;
  if (!npsso) {
    console.error('Missing env PSN_NPSSO. Set it and re-run.');
    process.exit(2);
  }

  const out = {
    meta: { timestamp: new Date().toISOString() },
    steps: {}
  };

  // Step 1: exchange npsso for code
  const codeCandidates = ['exchangeNpssoForCode', 'exchangeNpssoForAccessCode', ['oauth', 'exchangeNpssoForCode']];
  const codeAttempt = await tryCandidates(codeCandidates, npsso);
  out.steps.exchangeNpsso = {
    used: codeAttempt ? codeAttempt.name : null,
    raw: codeAttempt ? redact(codeAttempt.result) : null
  };

  const code = codeAttempt?.result?.code || codeAttempt?.result?.accessCode || codeAttempt?.result?.authCode || codeAttempt?.result?.authorizationCode;
  if (!code) {
    console.error('Failed to obtain code from npsso exchange. See output.');
    fs.writeFileSync('psn_full_fetch_failed_exchange.json', JSON.stringify(out, null, 2));
    process.exit(1);
  }

  // Step 2: exchange code for auth tokens
  const authCandidates = ['exchangeCodeForAccessToken', 'exchangeAccessCodeForAuthTokens', ['oauth', 'exchangeCodeForAccessToken']];
  const authAttempt = await tryCandidates(authCandidates, code);
  out.steps.exchangeCode = {
    used: authAttempt ? authAttempt.name : null,
    raw: authAttempt ? redact(authAttempt.result) : null
  };

  const auth = authAttempt?.result || authAttempt?.result?.authorization || authAttempt?.result?.tokens || authAttempt?.result;

  // Try to normalize common shapes
  const authorization = {
    accessToken: auth?.access_token || auth?.accessToken || auth?.token || auth?.idToken || null,
    refreshToken: auth?.refresh_token || auth?.refreshToken || auth?.refresh || null,
    idToken: auth?.id_token || auth?.idToken || null,
    accountId: auth?.accountId || auth?.account_id || auth?.user?.accountId || auth?.userId || null,
    raw: redact(auth)
  };

  out.authorization = authorization;

  if (!authorization.accessToken || !authorization.accountId) {
    console.warn('Authorization object is missing accessToken or accountId. The script will continue and attempt calls but results may be 401/invalid token.');
  }

  // Helper to attempt named fetches with candidates
  async function fetchWithCandidates(name, candidates, ...args) {
    const attempt = await tryCandidates(candidates, ...args);
    return { name, used: attempt ? attempt.name : null, raw: attempt ? attempt.result : null };
  }

  // Build token shape object used by earlier experiments
  const tokenShape = { accessToken: authorization.accessToken, idToken: authorization.idToken, refreshToken: authorization.refreshToken };

  // Calls to fetch
  const accountId = authorization.accountId;

  const calls = {};

  // getProfile
  calls.getProfile = await fetchWithCandidates('getProfileFromAccountId', ['getProfileFromAccountId', 'getProfile', ['profile', 'getProfile'], ['user', 'getProfileFromAccountId']], tokenShape, accountId);

  // getFriends
  calls.getFriends = await fetchWithCandidates('getUserFriendsAccountIds', ['getUserFriendsAccountIds', 'getUserFriends', ['friends', 'getUserFriendsAccountIds']], tokenShape, accountId);

  // getTrophies summary
  calls.getTrophySummary = await fetchWithCandidates('getUserTrophyProfileSummary', ['getUserTrophyProfileSummary', ['trophy', 'getUserTrophyProfileSummary']], tokenShape, accountId);

  // getUserTitles (library)
  calls.getUserTitles = await fetchWithCandidates('getUserTitles', ['getUserTitles', 'getUserTitlesForUser', ['user', 'getUserTitles']], tokenShape, accountId);

  // getRecentlyPlayedGames
  calls.getRecentlyPlayedGames = await fetchWithCandidates('getRecentlyPlayedGames', ['getRecentlyPlayedGames', 'getRecentlyPlayed'], tokenShape, accountId);

  // getGroupConversations - try likely wrapper names, else fallback to psn.call()
  let groupConv = await fetchWithCandidates('getGroupConversations', ['getGroupConversations', 'getConversations', ['messages', 'getGroupConversations']], tokenShape, accountId);
  if (!groupConv.used) {
    try {
      // fallback to raw call if psn.call exists
      if (typeof psn.call === 'function') {
        const endpoint = '/messaging/v1/users/me/group-conversations';
        const raw = await psn.call({ accessToken: authorization.accessToken }, 'GET', endpoint);
        groupConv = { name: 'getGroupConversations', used: 'psn.call', raw };
      }
    } catch (err) {
      groupConv = { name: 'getGroupConversations', used: 'psn.call', raw: { error: String(err) } };
    }
  }
  calls.getGroupConversations = groupConv;

  // If we have titles, iterate and fetch title trophies
  calls.titleTrophies = [];
  const titles = calls.getUserTitles?.raw?.titles || calls.getUserTitles?.raw?.data?.titles || calls.getUserTitles?.raw?.games || [];

  for (const t of titles) {
    try {
      const npCommunicationId = t.npCommunicationId || t.npId || t.titleId || t.npId?.toString?.() || t.title?.npCommunicationId || t.id;
      if (!npCommunicationId) continue;
      const tt = await fetchWithCandidates(`getTitleTrophies:${npCommunicationId}`, ['getTitleTrophies', ['trophy', 'getTitleTrophies']], tokenShape, npCommunicationId, 'all');
      calls.titleTrophies.push({ title: npCommunicationId, result: tt });
    } catch (err) {
      calls.titleTrophies.push({ title: t, error: String(err) });
    }
  }

  out.steps.calls = calls;

  // Redact tokens before writing
  const serialized = JSON.stringify(out, (k, v) => {
    if (typeof v === 'string') {
      return v.replace(/(eyJ[a-zA-Z0-9_-]{10,})/g, '<REDACTED_JWT>');
    }
    return v;
  }, 2);

  const outPath = `psn_full_fetch_${accountId || 'unknown'}.json`;
  fs.writeFileSync(outPath, serialized);
  console.log('WROTE', outPath);
}

main().catch(err => {
  console.error('script error', err);
  process.exit(1);
});