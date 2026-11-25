import { redirect } from 'next/navigation';

export default async function TransactionsRedirectPage({ searchParams }) {
  const sp = await searchParams;
  const type = String(sp?.type || '').toUpperCase();
  const status = sp?.status ? `?status=${encodeURIComponent(sp.status)}` : '';
  if (type === 'OUT') redirect(`/transactions/out${status}`);
  redirect(`/transactions/in${status}`);
}
