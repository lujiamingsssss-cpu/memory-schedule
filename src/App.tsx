/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LearningLog } from './pages/LearningLog';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { supabase } from './lib/supabaseClient';
import { useStore, useStoreBase } from './lib/store';

export default function App() {
  const { setSessionUser } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setSessionUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            username: data.session.user.user_metadata?.username || data.session.user.email?.split('@')[0] || 'User',
            avatar_url: data.session.user.user_metadata?.avatar_url || 'https://picsum.photos/seed/fallback/200/200',
          });
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSessionUser({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url || 'https://picsum.photos/seed/fallback/200/200',
        });
      } else if (event === 'SIGNED_OUT') {
        useStoreBase.getState().logout();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setSessionUser]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<LearningLog />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

