'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Manage your account settings"
      />

      <div style={{ padding: 'var(--card-padding)' }} className="page-container">
        <Card title="Account Information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--space-1) 0', fontSize: 'var(--font-size-sm)' }}>
                Name
              </p>
              <p style={{ color: 'var(--text)', margin: 0, fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
                {session?.user?.name || 'Not set'}
              </p>
            </div>

            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--space-1) 0', fontSize: 'var(--font-size-sm)' }}>
                Email
              </p>
              <p style={{ color: 'var(--text)', margin: 0, fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
                {session?.user?.email || 'Not set'}
              </p>
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
}
