'use client';

import * as React from 'react';
import Focus from '../components/Focus';

export default function FocusPage() {
  const handleStatusChange = async (gameId: number, newStatus: string) => {
    console.log(`Game ${gameId} status changed to ${newStatus}`);
  };

  return (
    <Focus onStatusChange={handleStatusChange} />
  );
} 