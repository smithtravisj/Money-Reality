'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './page.module.css';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [nameFormData, setNameFormData] = useState({ name: '' });
  const [emailFormData, setEmailFormData] = useState({ email: '' });
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [loadingName, setLoadingName] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.name) {
      setNameFormData({ name: session.user.name });
    }
    if (session?.user?.email) {
      setEmailFormData({ email: session.user.email });
    }
  }, [session]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setNameFormData({ name: value });
    if (errors.name) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors.name; return newErrors; });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmailFormData({ email: value });
    if (errors.email) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors.email; return newErrors; });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (!nameFormData.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    setLoadingName(true);
    try {
      const response = await fetch('/api/profile/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameFormData.name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ name: errorData.error || 'Failed to update name' });
        return;
      }

      setMessage('✓ Name updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setErrors({ name: error instanceof Error ? error.message : 'Failed to update name' });
    } finally {
      setLoadingName(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (!emailFormData.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFormData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoadingEmail(true);
    try {
      const response = await fetch('/api/profile/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFormData.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ email: errorData.error || 'Failed to update email' });
        return;
      }

      setMessage('✓ Email updated successfully! Please verify your new email address.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : 'Failed to update email' });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (!passwordFormData.currentPassword) {
      setErrors({ currentPassword: 'Current password is required' });
      return;
    }

    if (!passwordFormData.newPassword) {
      setErrors({ newPassword: 'New password is required' });
      return;
    }

    if (passwordFormData.newPassword.length < 8) {
      setErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoadingPassword(true);
    try {
      const response = await fetch('/api/profile/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ currentPassword: errorData.error || 'Failed to update password' });
        return;
      }

      setMessage('✓ Password updated successfully!');
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setErrors({ currentPassword: error instanceof Error ? error.message : 'Failed to update password' });
    } finally {
      setLoadingPassword(false);
    }
  };

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
        {message && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: message.includes('✓') ? 'var(--status-safe-bg)' : 'var(--status-danger-bg)',
              color: message.includes('✓') ? 'var(--status-safe)' : 'var(--status-danger)',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {message}
          </div>
        )}

        <div className={styles.cardsGrid}>
          {/* Change Name and Email */}
          <Card title="Personal Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Input
                  label="Name"
                  type="text"
                  value={nameFormData.name}
                  onChange={handleNameChange}
                  placeholder="Enter your name"
                  error={errors.name}
                />
                <Button type="submit" variant="primary" loading={loadingName}>
                  Update Name
                </Button>
              </form>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <Input
                    label="Email"
                    type="email"
                    value={emailFormData.email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    error={errors.email}
                  />
                  <Button type="submit" variant="primary" loading={loadingEmail}>
                    Update Email
                  </Button>
                </form>
              </div>
            </div>
          </Card>

          {/* Change Password */}
          <Card title="Change Password">
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                error={errors.currentPassword}
              />
              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={passwordFormData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter a new password (min 8 characters)"
                error={errors.newPassword}
              />
              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={passwordFormData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                error={errors.confirmPassword}
              />
              <Button type="submit" variant="primary" loading={loadingPassword}>
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
