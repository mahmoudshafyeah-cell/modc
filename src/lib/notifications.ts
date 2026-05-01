import { sendEmailNotification } from './email';

export async function notifyUserOnDeposit(email: string, amount: number, status: 'approved' | 'pending') {
  if (status === 'approved') {
    await sendEmailNotification(
      email,
      'تمت الموافقة على إيداعك',
      `<p>مرحباً،</p><p>تمت الموافقة على طلب الإيداع بقيمة <strong>$${amount.toFixed(2)}</strong> وإضافته إلى رصيدك.</p>`
    );
  } else {
    await sendEmailNotification(
      email,
      'طلب إيداع قيد المراجعة',
      `<p>مرحباً،</p><p>تم استلام طلب الإيداع بقيمة <strong>$${amount.toFixed(2)}</strong> وهو قيد المراجعة.</p>`
    );
  }
}

export async function notifyUserOnPurchase(email: string, productName: string, code?: string) {
  await sendEmailNotification(
    email,
    'تم شراء المنتج بنجاح',
    `<p>مرحباً،</p><p>تم شراء <strong>${productName}</strong> بنجاح.</p>${code ? `<p>الكود: <strong>${code}</strong></p>` : ''}`
  );
}

export async function notifyUserOnTransfer(email: string, amount: number, direction: 'sent' | 'received') {
  await sendEmailNotification(
    email,
    direction === 'sent' ? 'تم التحويل بنجاح' : 'تم استلام حوالة',
    `<p>مرحباً،</p><p>${direction === 'sent' ? `تم تحويل <strong>$${amount.toFixed(2)}</strong> بنجاح.` : `تم إيداع <strong>$${amount.toFixed(2)}</strong> في محفظتك.`}</p>`
  );
}