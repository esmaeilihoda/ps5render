import * as psn from 'psn-api';

/**
 * psnService - helper wrapper around the `psn-api` library.
 *
 * Exports:
 *  - getProfileData(refreshToken): { success, profile, library, tokens } | { success: false, error }
 *
 * Notes:
 *  - The `psn-api` package has a few different helper names across versions for
 *    exchanging a refresh token and fetching profile/library data. This wrapper
 *    attempts several common method names and fails with a helpful message if
 *    none are available. Adjust the method names here if your installed version
 *    exposes different APIs.
 */

function _extractAccessToken(obj) {
  if (!obj) return null;
  return obj.access_token || obj.accessToken || obj.token || obj.accessToken || null;
}

async function _refreshAccess(refreshToken) {
  // Try several possible function names that different versions of `psn-api` may expose
  const candidates = [
    'refreshAuth',
    'exchangeRefreshToken',
    'getAccessTokenFromRefreshToken',
    // some modules expose an `oauth` namespace
    ['oauth', 'refreshToken']
  ];

  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') {
          const res = await psn[ns][fn](refreshToken);
          return res;
        }
      } else if (typeof psn[c] === 'function') {
        const res = await psn[c](refreshToken);
        return res;
      }
    } catch (err) {
      // If a candidate throws, continue to try others but capture the last error
      // We'll report a combined error if nothing works.
      // eslint-disable-next-line no-console
      console.warn(`psnService: candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }

  // If we reached here nothing matched
  throw new Error('psn-api: no supported refresh method found. Please check your psn-api version and update psnService.js to call the appropriate method.');
}

async function _fetchProfile(accessToken) {
  const candidates = ['getProfile', 'getUserProfile', ['user', 'getProfile']];
  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') {
          return await psn[ns][fn](accessToken);
        }
      } else if (typeof psn[c] === 'function') {
        return await psn[c](accessToken);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`psnService: profile candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }
  throw new Error('psn-api: no supported profile fetch method found.');
}

async function _fetchLibrary(accessToken) {
  // library / owned titles / played games
  const candidates = [
    'getUserTitles',
    'getLibrary',
    'getOwnedTitles',
    ['user', 'getTitles']
  ];

  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') {
          return await psn[ns][fn](accessToken);
        }
      } else if (typeof psn[c] === 'function') {
        return await psn[c](accessToken);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`psnService: library candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }
  // If library fetching isn't available, return null rather than fail hard.
  return null;
}

export async function getProfileData(refreshToken) {
  if (!refreshToken) {
    return { success: false, error: { message: 'Missing refreshToken' } };
  }

  try {
    const refreshResult = await _refreshAccess(refreshToken);
    const accessToken = _extractAccessToken(refreshResult) || refreshResult?.accessToken || refreshResult?.token;

    if (!accessToken) {
      return { success: false, error: { message: 'Unable to obtain access token from refresh result', detail: refreshResult } };
    }

    const [profile, library] = await Promise.all([
      _fetchProfile(accessToken).catch(err => {
        // don't throw yet; return a sentinel so we can return partial data
        // eslint-disable-next-line no-console
        console.warn('psnService: failed to fetch profile', err?.message || err);
        return null;
      }),
      _fetchLibrary(accessToken).catch(err => {
        // eslint-disable-next-line no-console
        console.warn('psnService: failed to fetch library', err?.message || err);
        return null;
      })
    ]);

    return {
      success: true,
      profile,
      library,
      tokens: refreshResult
    };
  } catch (err) {
    // Handle known error shapes
    const message = err?.message || String(err);
    // eslint-disable-next-line no-console
    console.error('psnService.getProfileData error:', message);
    return { success: false, error: { message } };
  }
}

export default {
  getProfileData
};
