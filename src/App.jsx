import React from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from 'sonner';

export function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AppRoutes />
    </>
  );
}

export default App;