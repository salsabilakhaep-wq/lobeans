/** Catat aktivitas penting ke activity_logs (Audit Trail Sistem). */
export async function logActivity(client, { actor, action, entityType, entityId = null, summary }) {
  await client.query(
    `INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, summary)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actor?.id ?? null, actor?.role ?? 'system', action, entityType, entityId, summary],
  );
}

/** Kirim notifikasi ke seluruh pengguna aktif dengan role tertentu. */
export async function notifyRole(client, roleCode, { title, message, link = '/dashboard' }) {
  await client.query(
    `INSERT INTO notifications (user_id, title, message, link)
     SELECT u.id, $2, $3, $4
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE r.code = $1 AND u.is_active = TRUE`,
    [roleCode, title, message, link],
  );
}

/** Kirim notifikasi ke akun Supplier pemilik supplier_id tertentu. */
export async function notifySupplier(client, supplierId, { title, message, link = '/supply-orders' }) {
  await client.query(
    `INSERT INTO notifications (user_id, title, message, link)
     SELECT id, $2, $3, $4 FROM users WHERE supplier_id = $1 AND is_active = TRUE`,
    [supplierId, title, message, link],
  );
}
