import React from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppShell } from './shell/AppShell';

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
