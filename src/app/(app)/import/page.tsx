import type { Metadata } from 'next';
import ImportClient from './ImportClient';
import { getAccounts, getCategories } from '@/lib/dataService';

export const metadata: Metadata = {
  title: 'Import Transactions | Rakam',
};

export default async function ImportPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();

  return <ImportClient initialAccounts={accounts} categories={categories} />;
}
