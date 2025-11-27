// Lightweight script to simulate match verification via PSN endpoint
// Usage:
//   node scripts/simulate_match_verification.js <matchId> [serverUrl] [authToken]
// or set env: MATCH_ID, SERVER_URL, AUTH_TOKEN

const matchId = process.argv[2] || process.env.MATCH_ID;
const SERVER_URL = process.argv[3] || process.env.SERVER_URL || 'http://localhost:5001';
const AUTH_TOKEN = process.argv[4] || process.env.AUTH_TOKEN;

if (!matchId) {
  console.error('Usage: node scripts/simulate_match_verification.js <matchId> [serverUrl] [authToken]');
  process.exit(1);
}

async function run() {
  const url = `${SERVER_URL}/api/matches/${matchId}/verify-psn`;
  console.log('POST', url);
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

  try {
    const res = await fetch(url, { method: 'POST', headers });
    const body = await res.json().catch(() => null);
    console.log('Status:', res.status);
    console.log('Body:', body);
  } catch (err) {
    console.error('Request failed:', err?.message || err);
  }
}

run();
