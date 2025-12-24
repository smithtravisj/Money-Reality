'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
];

const PAYMENT_METHODS = [
  { value: '', label: 'None (default)' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Credit/Debit Card' },
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Other', label: 'Other' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();

  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Threshold')
        ? value === ''
          ? null
          : parseFloat(value)
        : fieldValue,
    }));
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateSettings({
        currency: formData.currency,
        safeThreshold: formData.safeThreshold,
        tightThreshold: formData.tightThreshold,
        warningThreshold: formData.warningThreshold,
        enableWarnings: formData.enableWarnings,
        defaultPaymentMethod: formData.defaultPaymentMethod,
      });

      setMessage('✓ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateSettings({
        safeThreshold: null,
        tightThreshold: null,
        warningThreshold: null,
        enableWarnings: true,
        defaultPaymentMethod: null,
      });

      setFormData({
        ...formData,
        safeThreshold: null,
        tightThreshold: null,
        warningThreshold: null,
        enableWarnings: true,
        defaultPaymentMethod: null,
      });

      setMessage('✓ Settings reset to defaults!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Failed to reset settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container-narrow">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your Money Reality experience</p>
      </div>

      <Card title="Display & Currency">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select
            label="Currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            options={CURRENCIES}
          />

          {message && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: message.includes('✓') ? 'var(--status-safe-bg)' : 'var(--status-danger-bg)',
                color: message.includes('✓') ? 'var(--status-safe)' : 'var(--status-danger)',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {message}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} style={{ marginTop: 'var(--space-3)' }}>
            Save Changes
          </Button>
        </form>
      </Card>

      <Card title="Financial Thresholds" style={{ marginTop: 'var(--space-4)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-control)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: '0 0 var(--space-2) 0' }}>
              Define your balance thresholds to categorize your financial status:
            </p>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: '0', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong style={{ color: 'var(--text)' }}>Safe:</strong> Balance ≥ Safe Threshold</li>
              <li><strong style={{ color: 'var(--text)' }}>Tight:</strong> Balance ≥ Tight Threshold (but below Safe)</li>
              <li><strong style={{ color: 'var(--text)' }}>Danger:</strong> Balance &lt; Tight Threshold</li>
            </ul>
          </div>

          <Input
            label="Safe Threshold ($)"
            type="number"
            name="safeThreshold"
            value={formData.safeThreshold ?? ''}
            onChange={handleChange}
            placeholder="e.g., 1000"
            step="10"
            helperText="Leave empty for default (1000)"
          />

          <Input
            label="Tight Threshold ($)"
            type="number"
            name="tightThreshold"
            value={formData.tightThreshold ?? ''}
            onChange={handleChange}
            placeholder="e.g., 200"
            step="10"
            helperText="Leave empty for default (200)"
          />

          <Button type="submit" variant="primary" size="lg" loading={loading}>
            Save Thresholds
          </Button>
        </form>
      </Card>

      <Card title="Warnings" style={{ marginTop: 'var(--space-4)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="enableWarnings"
                checked={formData.enableWarnings}
                onChange={handleChange}
              />
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>Enable critical balance warnings</span>
            </label>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: 'var(--space-2) 0 0 0' }}>
              Show a banner alert when your balance drops below the warning threshold
            </p>
          </div>

          {formData.enableWarnings && (
            <Input
              label="Warning Threshold ($)"
              type="number"
              name="warningThreshold"
              value={formData.warningThreshold ?? ''}
              onChange={handleChange}
              placeholder="e.g., 500"
              step="10"
              helperText="Balance below this amount triggers a warning banner"
            />
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading}>
            Save Warning Settings
          </Button>
        </form>
      </Card>

      <Card title="Default Payment Method" style={{ marginTop: 'var(--space-4)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select
            label="Preferred Payment Method"
            name="defaultPaymentMethod"
            value={formData.defaultPaymentMethod || ''}
            onChange={handleChange}
            options={PAYMENT_METHODS}
            helperText="Used as default when adding new transactions"
          />

          <Button type="submit" variant="primary" size="lg" loading={loading}>
            Save Payment Method
          </Button>
        </form>
      </Card>

      <Card title="Reset" style={{ marginTop: 'var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-sm)' }}>
            Reset all settings to their default values. This action cannot be undone.
          </p>
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={handleReset}
            loading={loading}
          >
            Reset All Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
