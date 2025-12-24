'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setValidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password');
        return;
      }

      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-3)' }}>
        <Card style={{ width: '100%', maxWidth: '450px' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text)', margin: '0 0 var(--space-1) 0' }}>
              Invalid Reset Link
            </h1>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>

          <Link href="/forgot-password" style={{ display: 'block', color: 'var(--accent)', textDecoration: 'none', fontSize: 'var(--font-size-sm)', fontWeight: '500', textAlign: 'center' }}>
            Request a new reset link
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-3)' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text)', margin: '0 0 var(--space-1) 0' }}>
            Create New Password
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: '0' }}>
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {error && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger)',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--status-safe-bg)',
                color: 'var(--status-safe)',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {message}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            helperText="At least 8 characters"
            required
            disabled={loading || !!message}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading || !!message}
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!!message} style={{ marginTop: 'var(--space-2)' }}>
            Reset Password
          </Button>
        </form>

        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
          <Link href="/login" style={{ display: 'block', color: 'var(--text-muted)', textDecoration: 'none', fontSize: 'var(--font-size-xs)', textAlign: 'center' }}>
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
