import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All endpoints are admin-only
router.use(requireAuth, requireAdmin);

const TournamentSchema = z.object({
title: z.string().min(3).max(100),
game: z.string().min(2).max(50),
description: z.string().max(2000).optional().nullable(),
rules: z.string().max(5000).optional().nullable(),
imageUrl: z.string().url().optional().nullable(),
entryFee: z.coerce.number().int().min(0),
prizePool: z.coerce.number().int().min(0),
maxPlayers: z.coerce.number().int().min(2).max(1024),
startAt: z.coerce.date(),
});

const Status = z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELED']);

// List with optional q/status filters + pagination
router.get('/', async (req, res) => {
try {
const q = (req.query.q || '').toString().trim();
const status = req.query.status;
const page = Math.max(1, parseInt(req.query.page) || 1);
const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
const where = {};
if (q) {
  where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { game: { contains: q, mode: 'insensitive' } },
  ];
}
if (status && Status.safeParse(status).success) where.status = status;

const [items, total] = await Promise.all([
  prisma.tournament.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  prisma.tournament.count({ where }),
]);

res.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
} catch (err) {
console.error('List tournaments error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Create
router.post('/', async (req, res) => {
try {
const parsed = TournamentSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
}
const data = parsed.data;
const created = await prisma.tournament.create({
data: { ...data, createdById: req.user.id },
});
res.status(201).json({ success: true, tournament: created });
} catch (err) {
console.error('Create tournament error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Read one
router.get('/:id', async (req, res) => {
const t = await prisma.tournament.findUnique({ where: { id: req.params.id } });
if (!t) return res.status(404).json({ success: false, message: 'Not found' });
res.json({ success: true, tournament: t });
});

// Update
router.put('/:id', async (req, res) => {
try {
const parsed = TournamentSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
}
const updated = await prisma.tournament.update({
where: { id: req.params.id },
data: parsed.data,
});
res.json({ success: true, tournament: updated });
} catch (err) {
console.error('Update tournament error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Delete
router.delete('/:id', async (req, res) => {
try {
await prisma.tournament.delete({ where: { id: req.params.id } });
res.json({ success: true });
} catch (err) {
console.error('Delete tournament error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Change status
router.patch('/:id/status', async (req, res) => {
const s = Status.safeParse(req.body?.status);
if (!s.success) return res.status(400).json({ success: false, message: 'Invalid status' });
const updated = await prisma.tournament.update({
where: { id: req.params.id },
data: { status: s.data },
});
res.json({ success: true, tournament: updated });
});

export default router;