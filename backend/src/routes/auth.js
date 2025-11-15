import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must include letters and numbers'),
  psnId: z.string()
    .regex(/^[A-Za-z][A-Za-z0-9_-]{2,15}$/, 'PSN ID must start with a letter and be 3–16 chars; only letters, numbers, - and _ allowed'),
  acceptTerms: z.boolean().refine(v => v === true, 'You must accept the terms')
});

const LoginSchema = z.object({
email: z.string().email('Invalid email'),
password: z.string().min(1, 'Password is required')
});

function signToken(user) {
return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    }

    const { name, email, password, psnId } = parsed.data;
const emailL = email.toLowerCase();

    const existingEmail = await prisma.user.findUnique({ where: { email: emailL } });
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email already in use' });

    const existingPSN = await prisma.user.findUnique({ where: { psnId } });
    if (existingPSN) return res.status(409).json({ success: false, message: 'PSN ID already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, psnId, passwordHash, role: 'USER' },
      select: { id: true, email: true, name: true, psnId: true, role: true, createdAt: true }
    });

    return res.status(201).json({ success: true, user, message: 'Account created. Please log in.' });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
try {
const parsed = LoginSchema.safeParse(req.body);
if (!parsed.success) {
const errors = parsed.error.flatten().fieldErrors;
return res.status(400).json({ success: false, errors, message: 'Validation failed' });
}

const email = parsed.data.email.toLowerCase();
const password = parsed.data.password;

const user = await prisma.user.findUnique({ where: { email } });
if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password' });

const token = signToken(user);
const userSafe = { id: user.id, email: user.email, name: user.name, psnId: user.psnId, role: user.role };

return res.json({ success: true, token, user: userSafe });


} catch (err) {
console.error('Login error', err);
return res.status(500).json({ success: false, message: 'Server error' });
}
});

router.get('/me', requireAuth, async (req, res) => {
const user = await prisma.user.findUnique({
where: { id: req.user.id },
select: { id: true, email: true, name: true, psnId: true, role: true, createdAt: true }
});
if (!user) return res.status(404).json({ success: false, message: 'User not found' });
return res.json({ success: true, user });
});



export default router;