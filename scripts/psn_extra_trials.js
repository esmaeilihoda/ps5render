const path = require('path');
const fs = require('fs');
const psn = require(path.join(__dirname, '..', 'backend', 'node_modules', 'psn-api'));

const inPath = path.join(__dirname, '..', 'psn_profile_salehtr1382.json');
let inData = {};
try { inData = JSON.parse(fs.readFileSync(inPath, 'utf8')); } catch (e) { console.error('Cannot read previous tokens file:', e.message); process.exit(1); }

const tokens = inData.tokens || {};
const idPayload = inData.idTokenPayload || {};
const accessToken = tokens.accessToken || tokens.access_token || null;
const idToken = tokens.idToken || tokens.id_token || null;
const refreshToken = tokens.refreshToken || tokens.refresh_token || null;
const username = (idPayload && (idPayload.online_id || idPayload.onlineId || idPayload.sub)) || 'salehtr1382';
const accountId = idPayload && (idPayload.sub || idPayload.account_id || idPayload.accountId) || null;

function safe(v){ try{ return JSON.parse(JSON.stringify(v)); }catch(e){ return String(v); } }

function redactString(s){
  if (!s || typeof s !== 'string') return s;
  let out = s;
  if (accessToken) out = out.split(accessToken).join('<REDACTED>');
  if (idToken) out = out.split(idToken).join('<REDACTED>');
  if (refreshToken) out = out.split(refreshToken).join('<REDACTED>');
  return out;
}

function redact(obj){
  try{
    const j = JSON.stringify(obj, null, 2);
    return JSON.parse(redactString(j));
  }catch(e){
    return redactString(String(obj));
  }
}

const results = { meta: { username, accountId, accessTokenPresent: !!accessToken, idTokenPresent: !!idToken }, attempts: [], successes: {}, errors: {}, available: Object.keys(psn).filter(k=>typeof psn[k]==='function') };

// methods to focus on (the ones that failed earlier)
const methods = [
  'getUserTrophyProfileSummary',
  'getUserPlayedGames',
  'getUserFriendsAccountIds',
  'getUserTitles',
  'getRecentlyPlayedGames',
  'getBasicPresence',
  'getProfileFromUserName',
  'getProfileFromAccountId',
  'getProfileShareableLink'
];

// base auth shapes (reuse previous)
const authShapes = [];
if (accessToken) {
  authShapes.push(accessToken);
  authShapes.push({ accessToken });
  authShapes.push({ access_token: accessToken });
  authShapes.push({ token: accessToken });
  authShapes.push({ authorization: 'Bearer ' + accessToken });
  authShapes.push({ auth: { accessToken } });
}
if (idToken) {
  authShapes.push({ idToken });
  authShapes.push({ id_token: idToken });
  authShapes.push(idToken);
  authShapes.push({ authorization: 'Bearer ' + idToken });
}
if (refreshToken) authShapes.push({ refreshToken });

// extended shapes
if (accessToken && idToken) {
  authShapes.push({ accessToken, idToken });
  authShapes.push({ idToken, accessToken });
  authShapes.push({ access_token: accessToken, id_token: idToken });
  authShapes.push({ auth: { accessToken, idToken } });
  authShapes.push({ token: { access_token: accessToken, id_token: idToken } });
}
if (accessToken && refreshToken) authShapes.push({ accessToken, refreshToken });

// header based shapes
if (accessToken) authShapes.push({ headers: { Authorization: 'Bearer ' + accessToken } });
if (idToken) authShapes.push({ headers: { Authorization: 'Bearer ' + idToken } });

// try empty auth too
authShapes.push({});

async function tryCall(method, args){
  try{
    const fn = psn[method];
    if (typeof fn !== 'function') throw new Error('Method not available');
    const res = await fn(...args);
    return { ok: true, data: safe(res) };
  }catch(err){
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

(async () => {
  for (const m of methods){
    let succeeded = false;
    // permutations for each auth shape
    for (const auth of authShapes){
      if (succeeded) break;
      const perms = [ [auth], [auth, username], [username, auth], [username], [accountId, auth], [auth, accountId] ];
      for (const p of perms){
        if (p.some(x => x === null || x === undefined)) continue;
        results.attempts.push({ method: m, argsPreview: p.map(a => (typeof a === 'string' && a.length > 80) ? a.slice(0,80) + '...' : a) });
        const r = await tryCall(m, p);
        if (r.ok){
          results.successes[m + ' | args:' + JSON.stringify(p.map(a=> typeof a==='string' && a.length>80? a.slice(0,80)+'...': a))] = redact(r.data);
          succeeded = true; break;
        } else {
          results.errors[m] = (results.errors[m] || '') + (results.errors[m] ? ' || ' : '') + redactString(r.error);
        }
      }
    }

    // try psn.call variants
    if (!succeeded && results.available.includes('call')){
      try{
        // try passing header-style auth
        const authObj = (authShapes.find(a=> a.headers) || authShapes[0]) || (accessToken|| idToken || {});
        const callRes = await psn.call(m, authObj, username);
        results.successes['call.'+m] = redact(safe(callRes));
        succeeded = true;
      }catch(e){
        results.errors['call.'+m] = (results.errors['call.'+m] || '') + (results.errors['call.'+m] ? ' || ' : '') + redactString(String(e && e.message?e.message:e));
      }
    }
  }

  const outPath = path.join(__dirname, '..', 'psn_profile_salehtr1382_extra.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log('WROTE', outPath);
})();
