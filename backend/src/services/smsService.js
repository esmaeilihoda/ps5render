/**
 * SMS Service for Melipayamak (ملی پیامک)
 * Uses Pattern Mode for guaranteed OTP delivery
 */

import https from 'https';

// Configuration from environment variables
const SMS_USERNAME = process.env.SMS_USERNAME || '19136944035';
const SMS_API_KEY = process.env.SMS_API_KEY || 'fb0a0a24-8fd5-4b49-aa58-454f892af7ec';
const SMS_BODY_ID = process.env.SMS_BODY_ID || '405666';

/**
 * Send OTP via Pattern Mode (پترن)
 * Pattern text: کاربر گرامی، کد تایید شما جهت ثبت نام {0} می باشد. g4r
 * @param {string} phone - Phone number in format 09xxxxxxxxx
 * @param {string} code - OTP code to send
 * @returns {Promise<{success: boolean, recId?: string, error?: string}>}
 */
export async function sendOtpSms(phone, code) {
  // Normalize phone number
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const postData = JSON.stringify({
    username: SMS_USERNAME,
    password: SMS_API_KEY, // API key is used as password
    text: [code], // Array of variables to replace {0}, {1}, etc.
    to: normalizedPhone,
    bodyId: parseInt(SMS_BODY_ID, 10)
  });

  const options = {
    hostname: 'rest.payamak-panel.com',
    port: 443,
    path: '/api/SendSMS/BaseServiceNumber',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('SMS API Response:', result);
          
          // Check for success - RetStatus 1 means success
          if (result.RetStatus === 1 || result.Value > 0) {
            resolve({ success: true, recId: result.Value?.toString() });
          } else {
            resolve({ 
              success: false, 
              error: getErrorMessage(result.RetStatus || result.Value) 
            });
          }
        } catch (e) {
          console.error('SMS parse error:', e, data);
          resolve({ success: false, error: 'Failed to parse SMS API response' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('SMS request error:', e);
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Generate a random 6-digit OTP code
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalize Iranian phone number to 09xxxxxxxxx format
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  
  // Handle +98 prefix
  if (digits.startsWith('98') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  }
  
  // Handle 9xxxxxxxxx (without leading 0)
  if (digits.length === 10 && digits.startsWith('9')) {
    digits = '0' + digits;
  }
  
  // Validate format: 09xxxxxxxxx (11 digits)
  if (digits.length === 11 && digits.startsWith('09')) {
    return digits;
  }
  
  return null;
}

/**
 * Validate Iranian mobile phone format
 */
export function isValidIranianMobile(phone) {
  return normalizePhone(phone) !== null;
}

/**
 * Get human-readable error message from Melipayamak error code
 */
function getErrorMessage(code) {
  const errors = {
    0: 'نام کاربری یا رمز عبور اشتباه است',
    1: 'ارسال موفق',
    2: 'اعتبار کافی نیست',
    3: 'محدودیت در ارسال روزانه',
    4: 'محدودیت در حجم ارسال',
    5: 'شماره فرستنده معتبر نیست',
    6: 'به‌روزرسانی سیستم',
    7: 'متن حاوی کلمات فیلتر شده',
    9: 'ارسال از خطوط اشتراکی امکان‌پذیر نیست',
    10: 'کد متن پیش‌فرض تعریف نشده',
    '-1': 'خطای سرور',
    '-2': 'محدودیت تعداد ارسال در بازه زمانی',
    '-7': 'خطا در شماره فرستنده',
    '-10': 'لینک در متغیرها وجود دارد'
  };
  return errors[code] || `خطای ناشناخته (${code})`;
}

export default {
  sendOtpSms,
  generateOtpCode,
  normalizePhone,
  isValidIranianMobile
};
