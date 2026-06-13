'use client';

import React, { useState } from 'react';
import SetupWizard from './SetupWizard';
import { dismissWizard } from '@/app/actions';

export default function SetupWizardWrapper() {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = async () => {
    setIsVisible(false);
    await dismissWizard();
  };

  if (!isVisible) return null;

  return <SetupWizard onComplete={handleDismiss} onSkip={handleDismiss} />;
}
