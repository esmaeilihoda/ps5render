import axios from 'axios';

const API_KEY = process.env.PAYMENT4_API_KEY;
const BASE_URL = 'https://service.payment4.com/api/v1';

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('payment4Service: Missing PAYMENT4_API_KEY in environment');
}

// According to Payment4 OpenAPI, required fields for create:
// amount:number, currency:string, callbackUrl:string
// Optional: callbackParams, webhookUrl, webhookParams, language (EN|FR|ES|AR|TR|FA), sandBox:boolean
export async function createPayment({ amount, currency = 'USD', callbackUrl, callbackParams, sandBox, language = 'EN' }) {
  const url = `${BASE_URL}/payment`;
  const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' };

  // Dev/test fallback when no key or explicit test mode
  if (!API_KEY || process.env.PAYMENT4_TEST_MODE === '1') {
    const paymentUid = `MOCK-${Date.now()}`;
    return { paymentUrl: `https://service.payment4.com/mock/StartPay/${paymentUid}`, paymentUid };
  }

  const payload = {
    amount: Number(amount),
    currency,
    callbackUrl,
    ...(callbackParams ? { callbackParams } : {}),
    ...(typeof sandBox === 'boolean' ? { sandBox } : { sandBox: process.env.NODE_ENV !== 'production' }),
    language,
  };

  const { data } = await axios.post(url, payload, { headers, timeout: 15000 });
  // Response schema: { id:number, paymentUid:string, paymentUrl:string }
  return { paymentUrl: data?.paymentUrl, paymentUid: data?.paymentUid };
}

// Verify requires: paymentUid, amount, currency
export async function verifyPayment({ paymentUid, amount, currency = 'USD' }) {
  const url = `${BASE_URL}/payment/verify`;
  // Dev/test short-circuit
  if (!API_KEY || process.env.PAYMENT4_TEST_MODE === '1') {
    return { verified: true, paymentStatus: 'SUCCESS' };
  }
  const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' };
  const payload = { paymentUid, amount: Number(amount), currency };
  const { data } = await axios.put(url, payload, { headers, timeout: 15000 });
  // data: { verified:boolean, paymentStatus:'PENDING'|'SUCCESS'|'EXPIRED'|'ACCEPTABLE'|'MISMATCH', amountDifference?:number }
  return { verified: !!data?.verified, paymentStatus: data?.paymentStatus };
}

export default {
  createPayment,
  verifyPayment,
};
