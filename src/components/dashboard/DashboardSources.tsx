'use client';

import React, { useState } from 'react';
import DataSourcesPanel from '../sources/DataSourcesPanel';
import AddSourceModal from '../sources/AddSourceModal';
import type { DataSource } from '@/types';
import { useRouter } from 'next/navigation';

export default function DashboardSources({ initialSources }: { initialSources: DataSource[] }) {
  const [sources, setSources] = useState<DataSource[]>(initialSources);
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <DataSourcesPanel 
        sources={sources} 
        onAddSource={() => setShowAddModal(true)} 
        onSourceClick={(source) => router.push(`/sources/${source.id}`)}
      />
      <AddSourceModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSourceAdded={(newSource) => {
          setSources([newSource, ...sources]);
          setShowAddModal(false);
        }}
      />
    </>
  );
}
