// Use sandbox API when no real merchant ID is configured
const isSandbox = !process.env.ZARRINPAL_MERCHANT_ID;
const ZARRINPAL_BASE = isSandbox 
  ? 'https://sandbox.zarinpal.com/pg/v4/payment'
  : 'https://api.zarinpal.com/pg/v4/payment';
  
// Merchant ID - use sandbox merchant ID if not set
const MERCHANT_ID = process.env.ZARRINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

if (isSandbox) {
  console.log('Zarrinpal running in SANDBOX MODE (v4 API) with merchant:', MERCHANT_ID);
}

async function requestPayment(amount, description, callbackUrl) {
  // Zarrinpal expects amount in Rials, we store in Tomans, so multiply by 10
  const amountInRials = amount * 10;
  
  const body = {
    merchant_id: MERCHANT_ID,
    amount: amountInRials,
    description: description,
    callback_url: callbackUrl
  };
  const axios = (await import('axios')).default;
  try {
    const url = `${ZARRINPAL_BASE}/request.json`;
    console.log('Zarrinpal request to:', url, 'Amount:', amount, 'Toman =', amountInRials, 'Rial');
    console.log('Request body:', JSON.stringify(body, null, 2));
    const res = await axios.post(url, body, { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Zarrinpal request response:', JSON.stringify(res.data, null, 2));
    // Normalize v4 response shape
    const data = res.data?.data || res.data;
    return data;
  } catch (err) {
    const status = err.response?.status;
    const respData = err.response?.data;
    const msg = typeof respData === 'object' ? JSON.stringify(respData) : (respData || err.message);
    console.error('Zarrinpal request error:', status, msg);
    throw new Error('Failed to create Zarrinpal payment: ' + msg);
  }
}

async function verifyPayment(authority, amount) {
  // Zarrinpal expects amount in Rials, we store in Tomans, so multiply by 10
  const amountInRials = amount * 10;
  
  const body = {
    merchant_id: MERCHANT_ID,
    authority: authority,
    amount: amountInRials
  };
  const axios = (await import('axios')).default;
  try {
    const url = `${ZARRINPAL_BASE}/verify.json`;
    console.log('Zarrinpal verify to:', url, 'Amount:', amount, 'Toman =', amountInRials, 'Rial');
    const res = await axios.post(url, body, { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Zarrinpal verify response:', JSON.stringify(res.data, null, 2));
    const data = res.data?.data || res.data;
    return data;
  } catch (err) {
    const respData = err.response?.data;
    const msg = typeof respData === 'object' ? JSON.stringify(respData) : (respData || err.message);
    console.error('Zarrinpal verify error:', msg);
    return { Code: -1 };
  }
}

export default { requestPayment, verifyPayment };
