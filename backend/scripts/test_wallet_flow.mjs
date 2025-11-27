import '../src/lib/prisma.js';
import { prisma } from '../src/lib/prisma.js';
import zarrinpalService from '../src/services/zarrinpalService.js';

async function main() {
  console.log('Starting wallet flow test (server-side)');

  // Create or find a test user
  const email = `test+wallet@local.test`;
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, name: 'Wallet Test', psnId: `test-psn-${Date.now()}`, passwordHash: 'x' } });
    console.log('Created test user', user.id);
  }

  // Ensure walletBalance starts at 0
  await prisma.user.update({ where: { id: user.id }, data: { walletBalance: BigInt(0) } });

  // Create pending transaction
  const amount = BigInt(5000);
  const authority = 'SIM-TEST-' + Date.now();
  const tx = await prisma.transaction.create({ data: { userId: user.id, amount, type: 'DEPOSIT', status: 'PENDING', gateway: 'ZARRINPAL', authority } });
  console.log('Created pending transaction', tx.id, 'authority', authority);

  // In test mode, zarrinpalService.verifyPayment returns success
  const verify = await zarrinpalService.verifyPayment(authority, Number(amount));
  console.log('verify result', verify);

  // Simulate route behavior: if success Code 100 then mark success and credit user
  const successCodes = [100];
  const isSuccess = verify && ((verify.data && successCodes.includes(verify.data.Code)) || (verify.Code && successCodes.includes(verify.Code)));

  if (isSuccess) {
    await prisma.$transaction([
      prisma.transaction.update({ where: { id: tx.id }, data: { status: 'SUCCESS' } }),
      prisma.user.update({ where: { id: user.id }, data: { walletBalance: { increment: amount } } }),
    ]);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    console.log('Transaction succeeded. New walletBalance:', String(updated.walletBalance));
  } else {
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'FAILED' } });
    console.log('Transaction failed.');
  }

  // Cleanup optional: leave records for inspection
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
