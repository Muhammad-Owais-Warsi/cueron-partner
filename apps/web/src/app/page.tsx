'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import Landing from '@/components/landing';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    <Spinner />;
  }

  return (
    // <main className="flex min-h-screen flex-col items-center justify-center p-24">
    <div className="text-center">
      <Landing />
    </div>
    // </main>
  );
}
