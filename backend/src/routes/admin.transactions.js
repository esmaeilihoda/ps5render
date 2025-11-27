import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// GET /api/admin/transactions - admin only
// optional query: status, userId, gateway, take, skip
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, userId, gateway, take = 50, skip = 0 } = req.query || {};
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (gateway) where.gateway = gateway;

    console.log('Admin transactions query:', { where, take, skip });
    const rows = await prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, take: Number(take), skip: Number(skip), include: { user: true } });
    console.log('Found transactions:', rows.length);
    const count = await prisma.transaction.count({ where });
    // Convert BigInt to string for JSON serialization and safely serialize user
    const items = rows.map(tx => ({
      ...tx,
      amount: String(tx.amount),
      user: tx.user ? {
        id: tx.user.id,
        email: tx.user.email,
        name: tx.user.name,
        walletBalance: String(tx.user.walletBalance || 0),
        balanceToman: String(tx.user.balanceToman || 0),
        balanceUsdt: String(tx.user.balanceUsdt || 0),
      } : null,
    }));
    console.log('Returning items:', items.length);
    return res.json({ success: true, items, count });
  } catch (err) {
    console.error('GET /api/admin/transactions error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// PATCH /api/admin/transactions/:id - admin-only update status or metadata
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, metadata } = req.body || {};
    const data = {};
    if (status) data.status = status;
    if (metadata) data.metadata = metadata;
    const tx = await prisma.transaction.update({ where: { id }, data });
    return res.json({ success: true, transaction: { ...tx, amount: String(tx.amount) } });
  } catch (err) {
    console.error('PATCH /api/admin/transactions/:id error', err?.message || err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
