'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/budget');
    } else if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  return null;
}
