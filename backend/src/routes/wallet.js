import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import payment4Service from '../services/payment4Service.js';
import zarrinpalService from '../services/zarrinpalService.js';

const router = express.Router();

// Helper to get the first client origin (in case CLIENT_ORIGIN has multiple URLs)
const getClientOrigin = () => {
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return origin.split(',')[0].trim();
};

// GET /api/wallet - protected
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Multi-currency balances
    const walletBalance = (user.balanceToman ?? user.walletBalance ?? 0);
    const usdtBalance = user.balanceUsdt ?? 0;

    let transactions = [];
    try {
      const rows = await prisma.transaction.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 });
      // Convert BigInt fields to strings to avoid JSON serialization errors
      transactions = rows.map(t => ({
        ...t,
        amount: String(t.amount),
      }));
    } catch {}

    return res.json({ success: true, walletBalance: String(walletBalance), usdtBalance: String(usdtBalance), transactions });
  } catch (err) {
    console.error('GET /api/wallet error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /deposit/payment4 (USDT deposit)
router.post('/deposit/payment4', requireAuth, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // Create pending transaction
  const tx = await prisma.transaction.create({
    data: {
      userId,
      amount: BigInt(amount),
      gateway: 'PAYMENT4',
      status: 'PENDING',
      type: 'DEPOSIT',
      metadata: { currency: 'USD' },
    },
  });

  // Create payment with Payment4
  const apiBase = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  // Important: do NOT add query here; Payment4 appends its own query and callbackParams.
  const callbackUrl = `${apiBase}/api/wallet/verify/payment4`;
  let paymentUrl, paymentUid;
  try {
    const created = await payment4Service.createPayment({ 
      amount: Number(amount), 
      currency: 'USD', 
      callbackUrl, 
      callbackParams: { txId: tx.id },
      sandBox: false,
      language: 'EN'
    });
    paymentUrl = created.paymentUrl;
    paymentUid = created.paymentUid;
  } catch (err) {
    console.warn('Payment4 createPayment failed, falling back (dev/test):', err?.message || err);
    if (process.env.PAYMENT4_TEST_MODE === '1' || !process.env.PAYMENT4_API_KEY) {
      paymentUid = `MOCK-${Date.now()}`;
      paymentUrl = `https://service.payment4.com/mock/StartPay/${paymentUid}`;
    } else {
      return res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
  }

  // Save paymentUid to transaction
  await prisma.transaction.update({ where: { id: tx.id }, data: { authority: paymentUid } });

  res.json({ url: paymentUrl });
});

// GET /verify/payment4 - public callback
router.get('/verify/payment4', async (req, res) => {
  try {
    const { txId, paymentUid: paymentUidFromQuery, paymentStatus, status } = req.query;
    console.log('Payment4 verify callback:', { txId, paymentUid: paymentUidFromQuery, paymentStatus, status });
    
    const tx = txId ? await prisma.transaction.findUnique({ where: { id: String(txId) } }) : null;
    if (!tx || tx.status !== 'PENDING') {
      // Gracefully redirect back to app on invalid or already processed transaction
      const redirectUrl = `${getClientOrigin()}/wallet?status=failed`;
      console.log('Redirecting (invalid tx):', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Verify payment
    const currency = (tx.metadata && tx.metadata.currency) ? tx.metadata.currency : 'USD';
    const paymentUid = paymentUidFromQuery || tx.authority;
    const result = await payment4Service.verifyPayment({ paymentUid, amount: Number(String(tx.amount)), currency });
    const finalStatus = (paymentStatus || status || result.paymentStatus || '').toString().toUpperCase();
    const isSuccess = (result.verified || finalStatus === 'SUCCESS' || finalStatus === 'ACCEPTABLE');
    console.log('Payment4 verify result:', { verified: result.verified, finalStatus, isSuccess });
    
    if (isSuccess) {
      await prisma.transaction.update({ where: { id: txId }, data: { status: 'SUCCESS' } });
      // Try crediting USDT balance if field exists; ignore errors
      try {
        await prisma.user.update({ where: { id: tx.userId }, data: { balanceUsdt: { increment: tx.amount } } });
        console.log('USDT balance credited for user:', tx.userId);
      } catch (err) {
        console.warn('Failed to credit USDT balance (field may not exist):', err.message);
      }
      const redirectUrl = `${getClientOrigin()}/wallet?status=success`;
      console.log('Redirecting (success):', redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      await prisma.transaction.update({ where: { id: txId }, data: { status: 'FAILED' } });
      const redirectUrl = `${getClientOrigin()}/wallet?status=failed`;
      console.log('Redirecting (failed):', redirectUrl);
      return res.redirect(redirectUrl);
    }
  } catch (err) {
    console.error('Payment4 verify error:', err);
    const redirectUrl = `${getClientOrigin()}/wallet?status=failed`;
    console.log('Redirecting (error):', redirectUrl);
    return res.redirect(redirectUrl);
  }
});

// POST /deposit/zarrinpal (Toman deposit)
router.post('/deposit/zarrinpal', requireAuth, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // Create pending transaction
  const tx = await prisma.transaction.create({
    data: {
      userId,
      amount: BigInt(amount),
      gateway: 'ZARRINPAL',
      status: 'PENDING',
      type: 'DEPOSIT',
      metadata: { currency: 'IRT' },
    },
  });

  // Create payment with Zarrinpal - callback must go to backend
  const apiBase = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  const callbackUrl = `${apiBase}/api/wallet/verify/zarrinpal?txId=${tx.id}`;
  
  let result;
  try {
    result = await zarrinpalService.requestPayment(Number(amount), `Wallet deposit tx ${tx.id} for user ${userId}`, callbackUrl);
    console.log('Zarrinpal deposit result:', result);
  } catch (err) {
    console.error('Zarrinpal deposit error:', err.message);
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'FAILED' } });
    return res.status(500).json({ success: false, message: 'Zarrinpal payment failed: ' + err.message });
  }

  // Extract authority (v4 uses snake_case); service returns normalized data
  const authority = (result && (result.authority || result.Authority))
    || (result && result.data && (result.data.authority || result.data.Authority));
  if (!authority) {
    console.error('Zarrinpal deposit failed - no authority:', result);
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'FAILED' } });
    return res.status(500).json({ success: false, message: 'Failed to get payment authority from Zarrinpal' });
  }
  await prisma.transaction.update({ where: { id: tx.id }, data: { authority } });

  // Construct Zarrinpal payment URL (use sandbox if in test mode)
  const isTestMode = !process.env.ZARRINPAL_MERCHANT_ID || process.env.ZARRINPAL_TEST_MODE === '1';
  const baseUrl = isTestMode ? 'https://sandbox.zarinpal.com/pg/StartPay' : 'https://www.zarinpal.com/pg/StartPay';
  const paymentUrl = `${baseUrl}/${authority}`;
  console.log('Zarrinpal payment URL:', paymentUrl);
  return res.json({ url: paymentUrl, transactionId: tx.id });
});

// GET /verify/zarrinpal - public callback (no auth required)
router.get('/verify/zarrinpal', async (req, res) => {
  try {
    const { txId, Authority, authority, Status, status } = req.query;
    const authFromQuery = authority || Authority;
    const statusFromQuery = status || Status;
    console.log('Zarrinpal verify callback:', { txId, authority: authFromQuery, Status: statusFromQuery });
    
    const tx = txId ? await prisma.transaction.findUnique({ where: { id: String(txId) } }) : null;
    if (!tx || tx.status !== 'PENDING') {
      const redirectUrl = `${getClientOrigin()}/wallet?status=failed`;
      console.log('Redirecting (invalid tx):', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Check if Zarrinpal already indicated failure via Status query param
    if (statusFromQuery && statusFromQuery !== 'OK') {
      await prisma.transaction.update({ where: { id: txId }, data: { status: 'FAILED' } });
      const redirectUrl = `${getClientOrigin()}/wallet?status=failed&gw=zarrinpal&reason=${encodeURIComponent(statusFromQuery)}`;
      console.log('Redirecting (cancelled):', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Verify payment with Zarrinpal
    const verify = await zarrinpalService.verifyPayment(authFromQuery || tx.authority, Number(String(tx.amount)));
    const successCodes = [100, 101]; // 100 = verified, 101 = already verified
    const verifyCode = (verify && (verify.code || verify.Code)) || (verify && verify.data && (verify.data.code || verify.data.Code));
    const isSuccess = successCodes.includes(verifyCode);
    console.log('Zarrinpal verify result:', { code: verifyCode, isSuccess, raw: verify });

    if (isSuccess) {
      await prisma.transaction.update({ where: { id: txId }, data: { status: 'SUCCESS' } });
      await prisma.user.update({
        where: { id: tx.userId },
        data: { balanceToman: { increment: tx.amount } },
      });
      console.log('Toman balance credited for user:', tx.userId);
      const redirectUrl = `${getClientOrigin()}/wallet?status=success`;
      console.log('Redirecting (success):', redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      await prisma.transaction.update({ where: { id: txId }, data: { status: 'FAILED' } });
      const redirectUrl = `${getClientOrigin()}/wallet?status=failed&gw=zarrinpal&code=${verifyCode}`;
      console.log('Redirecting (failed):', redirectUrl);
      return res.redirect(redirectUrl);
    }
  } catch (err) {
    console.error('Zarrinpal verify error:', err);
    const redirectUrl = `${getClientOrigin()}/wallet?status=failed&gw=zarrinpal`;
    console.log('Redirecting (error):', redirectUrl);
    return res.redirect(redirectUrl);
  }
});

export default router;
