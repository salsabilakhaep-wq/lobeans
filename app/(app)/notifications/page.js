import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDateTime } from '@/lib/format.js';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/actions/notifications.js';
import { Card, PageHeader } from '@/components/ui.js';
import { buttonClass } from '@/components/styles.js';

export const metadata = { title: 'Notifikasi' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await many(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT 50',
    [user.id],
  );
  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <>
      <PageHeader
        eyebrow="Pusat Pemberitahuan"
        title="Notifikasi"
        subtitle={`${unread} notifikasi belum dibaca untuk akun Anda.`}
        action={
          unread > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className={buttonClass('secondary', 'md')}>
                Tandai Semua Dibaca
              </button>
            </form>
          )
        }
      />

      <Card>
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-[13px] text-lobeans-muted">Belum ada notifikasi.</p>
        ) : (
          <ul className="divide-y divide-[#f0efe8]">
            {rows.map((n) => (
              <li
                key={n.id}
                className={`flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center ${
                  n.is_read ? 'bg-white' : 'bg-amber-50/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-lobeans-mustard" />}
                    <p className="text-[13.5px] font-bold text-lobeans-ink">{n.title}</p>
                    <span className="text-[11px] text-lobeans-muted">· {fmtDateTime(n.created_at)}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[#435549]">{n.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <Link href={n.link || '/dashboard'} className={buttonClass('secondary', 'sm')}>
                    Buka →
                  </Link>
                  {!n.is_read && (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-[11px] font-semibold text-lobeans-muted hover:text-lobeans-ink">
                        Tandai dibaca
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
