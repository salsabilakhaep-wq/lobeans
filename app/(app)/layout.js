import { requireUser } from '@/lib/auth.js';
import { one } from '@/lib/db.js';
import { Sidebar, TopBar } from '@/components/Sidebar.js';

export default async function AppLayout({ children }) {
  const user = await requireUser();
  const notifRow = await one('SELECT COUNT(*)::int AS cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE', [user.id]);
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: process.env.APP_TZ || 'Asia/Makassar',
  });

  const unreadCount = notifRow?.cnt || 0;

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Sidebar user={user} unreadCount={unreadCount} />
      <div className="lg:pl-[260px]">
        <TopBar user={user} today={today} unreadCount={unreadCount} />
        <main className="mx-auto max-w-[1160px] px-4 pb-14 pt-6 sm:px-6 lg:px-10 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
