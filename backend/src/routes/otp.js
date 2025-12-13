/**
 * OTP Routes for Phone Verification
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { sendOtpSms, generateOtpCode, normalizePhone, isValidIranianMobile } from '../services/smsService.js';

const router = Router();

// Rate limiting: max OTP requests per phone
const OTP_COOLDOWN_SECONDS = 60; // 1 minute between requests
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

const SendOtpSchema = z.object({
  phone: z.string().min(10, 'شماره موبایل معتبر نیست').max(15)
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(10, 'شماره موبایل معتبر نیست').max(15),
  code: z.string().length(6, 'کد تایید باید 6 رقم باشد')
});

/**
 * POST /api/otp/send
 * Send OTP to phone number
 */
router.post('/send', async (req, res) => {
  try {
    const parsed = SendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: parsed.error.errors[0]?.message || 'شماره موبایل نامعتبر است' 
      });
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'فرمت شماره موبایل نادرست است. لطفا شماره را به فرمت 09xxxxxxxxx وارد کنید' 
      });
    }

    // Check if phone is already verified by another user
    const existingUser = await prisma.user.findFirst({
      where: { phone, phoneVerified: true }
    });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'این شماره موبایل قبلاً ثبت شده است' 
      });
    }

    // Check cooldown - find most recent OTP for this phone
    const recentOtp = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' }
    });

    if (recentOtp) {
      const secondsSinceLastOtp = (Date.now() - recentOtp.createdAt.getTime()) / 1000;
      if (secondsSinceLastOtp < OTP_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLastOtp);
        return res.status(429).json({ 
          success: false, 
          message: `لطفاً ${remainingSeconds} ثانیه صبر کنید`,
          retryAfter: remainingSeconds
        });
      }
    }

    // Generate OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to database
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt
      }
    });

    // Send SMS
    const smsResult = await sendOtpSms(phone, code);
    
    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      return res.status(500).json({ 
        success: false, 
        message: 'ارسال پیامک با خطا مواجه شد. لطفاً دوباره تلاش کنید' 
      });
    }

    console.log(`OTP sent to ${phone}: ${code} (recId: ${smsResult.recId})`);

    return res.json({ 
      success: true, 
      message: 'کد تایید ارسال شد',
      expiresIn: OTP_EXPIRY_MINUTES * 60 // seconds
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

/**
 * POST /api/otp/verify
 * Verify OTP code
 */
router.post('/verify', async (req, res) => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: parsed.error.errors[0]?.message || 'داده‌های نامعتبر' 
      });
    }

    const phone = normalizePhone(parsed.data.phone);
    const { code } = parsed.data;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'شماره موبایل نامعتبر است' 
      });
    }

    // Find the most recent unverified OTP for this phone
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'کد تایید منقضی شده یا وجود ندارد. لطفاً کد جدید دریافت کنید' 
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ 
        success: false, 
        message: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً کد جدید دریافت کنید' 
      });
    }

    // Increment attempts
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } }
    });

    // Verify code
    if (otpRecord.code !== code) {
      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return res.status(400).json({ 
        success: false, 
        message: `کد تایید اشتباه است. ${remainingAttempts} تلاش باقی‌مانده` 
      });
    }

    // Mark as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    // Clean up old OTPs for this phone
    await prisma.otpCode.deleteMany({
      where: {
        phone,
        id: { not: otpRecord.id }
      }
    });

    return res.json({ 
      success: true, 
      message: 'شماره موبایل تایید شد',
      verified: true 
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

/**
 * POST /api/otp/check
 * Check if a phone number has a valid verified OTP (for registration flow)
 */
router.post('/check', async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({ success: false, verified: false });
    }

    // Check for recently verified OTP (within last 10 minutes)
    const verifiedOtp = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        verified: true,
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ 
      success: true, 
      verified: !!verifiedOtp 
    });

  } catch (err) {
    console.error('Check OTP error:', err);
    return res.status(500).json({ success: false, verified: false });
  }
});

export default router;
