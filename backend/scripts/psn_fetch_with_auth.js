import fs from 'fs';
import * as psn from 'psn-api';

// Usage: run `node .\scripts\psn_fetch_with_auth.js` from the backend folder

function redact(obj) {
  try {
    const s = JSON.stringify(obj);
    return s
      .replace(/(access[_-]?token\":\")[^\"]+/ig, '$1<REDACTED>')
      .replace(/(refresh[_-]?token\":\")[^\"]+/ig, '$1<REDACTED>')
      .replace(/(id[_-]?token\":\")[^\"]+/ig, '$1<REDACTED>');
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
  const exchangePath = '../psn_exchange_code_result.json';
  if (!fs.existsSync(exchangePath)) {
    console.error('Missing', exchangePath, ' — run the code exchange script first.');
    process.exit(2);
  }

  const r = JSON.parse(fs.readFileSync(exchangePath, 'utf8'));
  const auth = r.raw || r.result || r;

  const authorization = {
    accessToken: auth?.accessToken || auth?.access_token || auth?.token || auth?.idToken || null,
    refreshToken: auth?.refreshToken || auth?.refresh_token || auth?.refresh || null,
    idToken: auth?.idToken || auth?.id_token || null,
    accountId: auth?.accountId || auth?.account_id || auth?.user?.accountId || auth?.userId || null,
    raw: redact(auth)
  };

  const out = { meta: { timestamp: new Date().toISOString() }, authorization };

  if (!authorization.accessToken || !authorization.accountId) {
    console.warn('Missing accessToken or accountId in exchange result; continuing may cause 401s.');
  }

  // If accountId is missing, try to resolve it by calling getProfile(authorization, 'me')
  if (!authorization.accountId && authorization.accessToken) {
    const tokenShape = { accessToken: authorization.accessToken, idToken: authorization.idToken, refreshToken: authorization.refreshToken };
    const tokenVariants = [
      tokenShape,
      authorization.accessToken,
      { accessToken: authorization.accessToken },
      { access_token: authorization.accessToken }
    ];
    const profileCandidates = ['getProfile', 'getProfileFromAccountId', ['profile', 'getProfile'], ['user', 'getProfileFromAccountId'], 'getProfileFromUserName'];
    let profileAttempt = null;
    for (const variant of tokenVariants) {
      profileAttempt = await tryCandidates(profileCandidates, variant, 'me');
      if (profileAttempt) break;
      profileAttempt = await tryCandidates(profileCandidates, 'me', variant);
      if (profileAttempt) break;
    }
    if (!profileAttempt && authorization.idToken && typeof authorization.idToken === 'string') {
      try {
        const parts = authorization.idToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
          const username = payload.online_id || payload.onlineId || payload.onlne_id || payload.sub || null;
          if (username) {
            profileAttempt = await tryCandidates(['getProfileFromUserName', ['profile', 'getProfileFromUserName']], tokenShape, username) || await tryCandidates(['getProfileFromUserName'], username, tokenShape);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (profileAttempt) {
      const prof = profileAttempt.result || profileAttempt.raw || profileAttempt;
      const acct = prof?.profile?.accountId || prof?.accountId || prof?.profile?.account_id || prof?.account_id || prof?.sub || null;
      if (acct) {
        authorization.accountId = acct;
        out.authorization = authorization;
        console.log('Resolved accountId from profile:', acct);
      } else {
        console.warn('Profile call returned but accountId not found in response.');
      }
    } else {
      console.warn('Could not resolve accountId from tokens.');
    }
  }

  async function fetchWithCandidates(name, candidates, ...args) {
    const attempt = await tryCandidates(candidates, ...args);
    return { name, used: attempt ? attempt.name : null, raw: attempt ? attempt.result : null };
  }

  const tokenShape = { accessToken: authorization.accessToken, idToken: authorization.idToken, refreshToken: authorization.refreshToken };
  const accountId = authorization.accountId;
  const calls = {};

  calls.getProfile = await fetchWithCandidates('getProfileFromAccountId', ['getProfileFromAccountId', 'getProfile', ['profile', 'getProfile'], ['user', 'getProfileFromAccountId']], tokenShape, accountId);
  calls.getFriends = await fetchWithCandidates('getUserFriendsAccountIds', ['getUserFriendsAccountIds', 'getUserFriends', ['friends', 'getUserFriendsAccountIds']], tokenShape, accountId);
  calls.getTrophySummary = await fetchWithCandidates('getUserTrophyProfileSummary', ['getUserTrophyProfileSummary', ['trophy', 'getUserTrophyProfileSummary']], tokenShape, accountId);
  calls.getUserTitles = await fetchWithCandidates('getUserTitles', ['getUserTitles', 'getUserTitlesForUser', ['user', 'getUserTitles']], tokenShape, accountId);
  calls.getRecentlyPlayedGames = await fetchWithCandidates('getRecentlyPlayedGames', ['getRecentlyPlayedGames', 'getRecentlyPlayed'], tokenShape, accountId);

  // group conversations
  let groupConv = await fetchWithCandidates('getGroupConversations', ['getGroupConversations', 'getConversations', ['messages', 'getGroupConversations']], tokenShape, accountId);
  if (!groupConv.used) {
    try {
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

  // per-title trophies
  calls.titleTrophies = [];
  const titles = calls.getUserTitles?.raw?.titles || calls.getUserTitles?.raw?.data?.titles || calls.getUserTitles?.raw?.games || [];
  for (const t of titles) {
    try {
      const npCommunicationId = t.npCommunicationId || t.npId || t.titleId || (t.npId && t.npId.toString && t.npId.toString()) || t.title?.npCommunicationId || t.id;
      if (!npCommunicationId) continue;
      const tt = await fetchWithCandidates(`getTitleTrophies:${npCommunicationId}`, ['getTitleTrophies', ['trophy', 'getTitleTrophies']], tokenShape, npCommunicationId, 'all');
      calls.titleTrophies.push({ title: npCommunicationId, result: tt });
    } catch (err) {
      calls.titleTrophies.push({ title: t, error: String(err) });
    }
  }

  out.calls = calls;

  const serialized = JSON.stringify(out, (k, v) => {
    if (typeof v === 'string') return v.replace(/(eyJ[a-zA-Z0-9_-]{10,})/g, '<REDACTED_JWT>');
    return v;
  }, 2);

  const outPath = `psn_full_fetch_${accountId || 'unknown'}.json`;
  fs.writeFileSync(outPath, serialized);
  console.log('WROTE', outPath);
}

main().catch(err => { console.error('script error', err); process.exit(1); });
