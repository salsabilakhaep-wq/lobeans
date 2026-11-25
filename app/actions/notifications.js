'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [user.id]);
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
}

export async function markNotificationReadAction(formData) {
  const user = await requireUser();
  const id = Number(formData.get('id'));
  await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, user.id]);
  revalidatePath('/notifications');
}
