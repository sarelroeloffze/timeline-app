'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Loading } from '@/components/shared';

export default function Home() {
  const router = useRouter();
  const { user, setUser, loading, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (loading) {
    return <Loading size="lg" fullScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
