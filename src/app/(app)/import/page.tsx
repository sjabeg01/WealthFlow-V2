import type { Metadata } from 'next';
import ImportClient from './ImportClient';
import { getAccounts } from '@/lib/dataService';

export const metadata: Metadata = {
  title: 'Import Transactions | WealthFlow',
};

export default async function ImportPage() {
  const accounts = await getAccounts();

  return <ImportClient initialAccounts={accounts} />;
}
