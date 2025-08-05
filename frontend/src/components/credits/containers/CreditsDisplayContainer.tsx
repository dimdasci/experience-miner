import React from 'react';
import { CreditsDisplayUI } from '../views/CreditsDisplayUI';
import { useCreditsDisplay } from '../hooks/useCreditsDisplay';

const CreditsDisplayContainer: React.FC = () => {
  const { credits, loading, error, onRefresh } = useCreditsDisplay();
  return (
    <CreditsDisplayUI
      credits={credits}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
    />
  );
};

export default CreditsDisplayContainer;
