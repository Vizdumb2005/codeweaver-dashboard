/**
 * SettingsForm – demo page wiring together form submission feedback.
 *
 * Demonstrates:
 *   ✓ Loading  — button spinner + disabled form while submitting
 *   ✓ Success  — green success toast + label checkmarks + button flash
 *   ✓ Error    — field-level inline errors + red shake + error toast
 */

import React, { useCallback, useRef, useState } from 'react';
import { FormGroup } from '../components/ui/FormGroup';
import { FormInput } from '../components/ui/FormInput';
import { useFormFeedback } from '../hooks/useFormFeedback';
import { useToast } from '../hooks/useToast';
import { useDashboardStore } from '../store/store';
import { usePermission } from '../hooks/useAuth';
import '../styles/form-feedback.scss';


const FIELDS = ['displayName', 'email', 'apiKey', 'webhook'] as const;
type Field = typeof FIELDS[number];

// ── Validators ────────────────────────────────────────────────────────────────

function validate(name: Field, value: string): string {
  switch (name) {
    case 'displayName':
      if (!value.trim()) return 'Display name is required.';
      if (value.trim().length < 2) return 'Must be at least 2 characters.';
      return '';
    case 'email': {
      if (!value.trim()) return 'Email address is required.';
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(value)) return 'Enter a valid email address.';
      return '';
    }
    case 'apiKey':
      if (value && value.length < 20) return 'API key must be ≥ 20 characters.';
      return '';
    case 'webhook':
      if (value && !/^https?:\/\/.+/.test(value)) return 'Webhook must start with http:// or https://.';
      return '';
    default:
      return '';
  }
}

// ── Simulated API call ────────────────────────────────────────────────────────

async function fakeSubmit(data: Record<string, string>): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      // Simulate server-side error for demo: reject if email contains "fail"
      if (data.email.includes('fail')) {
        reject(new Error('Server rejected the request. Please try again.'));
      } else {
        resolve();
      }
    }, 1800),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const SettingsForm: React.FC = () => {
  const canEditSettings = usePermission('edit:settings');
  const { toast } = useToast();
  const feedback = useFormFeedback(FIELDS);
  const user = useDashboardStore((state) => state.user);

  const [values, setValues] = useState<Record<Field, string>>({
    displayName: user?.username || '',
    email: '',
    apiKey: '',
    webhook: '',
  });

  // Track button flash-success state
  const [btnSuccess, setBtnSuccess] = useState(false);
  const loadingToastId = useRef<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (field: Field) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [field]: val }));

    // Real-time validation after the field has been touched
    if (feedback.fields[field].touched) {
      const err = validate(field, val);
      if (err) feedback.setError(field, err);
      else feedback.setValid(field);
    }
  };

  const handleBlur = (field: Field) => (
    e: React.FocusEvent<HTMLInputElement>,
  ) => {
    feedback.touchField(field);
    const err = validate(field, e.target.value);
    if (err) feedback.setError(field, err);
    else if (e.target.value) feedback.setValid(field);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (feedback.isSubmitting) return;

      // Validate all fields
      let hasAnyError = false;
      for (const field of FIELDS) {
        const err = validate(field, values[field]);
        if (err) {
          feedback.setError(field, err);
          hasAnyError = true;
        } else if (values[field]) {
          feedback.setValid(field);
        }
      }

      if (hasAnyError) {
        toast.error('Please fix the highlighted fields before saving.', {
          description: 'One or more fields contain invalid values.',
        });
        return;
      }

      // ── Loading phase ────────────────────────────────────────────────────
      feedback.setSubmitting(true);
      loadingToastId.current = toast.loading('Saving settings…');

      try {
        await fakeSubmit(values);

        // ── Success phase ──────────────────────────────────────────────────
        feedback.setSubmitState('success');
        setBtnSuccess(true);

        toast.success('Settings saved!', {
          id: loadingToastId.current,
          description: 'Your changes have been applied successfully.',
        });

        // Mark all touched fields as valid
        for (const field of FIELDS) {
          if (values[field]) feedback.setValid(field);
        }

        // Reset button flash after 2 s
        setTimeout(() => setBtnSuccess(false), 2000);
      } catch (err) {
        // ── Error phase ────────────────────────────────────────────────────
        feedback.setSubmitState('error');
        toast.error('Failed to save settings.', {
          id: loadingToastId.current,
          description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        });
      } finally {
        feedback.setSubmitting(false);
      }
    },
    [values, feedback, toast],
  );

  const handleReset = useCallback(() => {
    setValues({ displayName: '', email: '', apiKey: '', webhook: '' });
    feedback.clearAll();
    setBtnSuccess(false);
  }, [feedback]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const inputClass = (field: Field) =>
    [
      'form-input',
      feedback.fields[field].error ? 'is-error' : '',
      feedback.fields[field].valid ? 'is-valid' : '',
    ]
      .filter(Boolean)
      .join(' ');

  const btnClass = [
    'btn btn-primary',
    feedback.isSubmitting ? 'btn-submitting' : '',
    btnSuccess ? 'btn-success-flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = feedback.isSubmitting;

  return (
    <div className="page-shell">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 6 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Manage your account settings and integrations.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Account settings form"
        style={{ maxWidth: 560 }}
      >
        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <div className="settings-card">
            <div className="card-title">
              <svg className="jp-icon text-orange" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3>Profile</h3>
            </div>

            <div className="settings-grid">
              <FormGroup
                label="Display Name"
                htmlFor="displayName"
                error={feedback.fields.displayName.error}
                valid={feedback.fields.displayName.valid}
                hint="This is how your name appears across the dashboard."
              >
                <input
                  id="displayName"
                  className={inputClass('displayName')}
                  type="text"
                  value={values.displayName}
                  onChange={handleChange('displayName')}
                  onBlur={handleBlur('displayName')}
                  disabled={isDisabled}
                  placeholder="e.g. Kakashi Hatake"
                  aria-describedby={feedback.fields.displayName.error ? 'displayName-error' : undefined}
                  aria-invalid={!!feedback.fields.displayName.error}
                  autoComplete="name"
                />
              </FormGroup>

              <FormGroup
                label="Email Address"
                htmlFor="email"
                error={feedback.fields.email.error}
                valid={feedback.fields.email.valid}
                hint='Use "fail@..." to simulate a server error.'
              >
                <input
                  id="email"
                  className={inputClass('email')}
                  type="email"
                  value={values.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  disabled={isDisabled}
                  placeholder="you@example.com"
                  aria-describedby={feedback.fields.email.error ? 'email-error' : undefined}
                  aria-invalid={!!feedback.fields.email.error}
                  autoComplete="email"
                />
              </FormGroup>
            </div>
          </div>
        </div>

        {/* ── Integrations card ─────────────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 28 }}>
          <div className="settings-card">
            <div className="card-title">
              <svg className="jp-icon text-orange" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1" y="4" width="7" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="4" width="7" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <line x1="8" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <h3>Integrations</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormGroup
                label="API Key"
                htmlFor="apiKey"
                error={feedback.fields.apiKey.error}
                valid={feedback.fields.apiKey.valid}
                hint="Optional. Leave blank to use the default key."
              >
                <FormInput
                  id="apiKey"
                  type="password"
                  className={inputClass('apiKey')}
                  value={values.apiKey}
                  onChange={handleChange('apiKey') as React.ChangeEventHandler<HTMLInputElement>}
                  onBlur={handleBlur('apiKey') as React.FocusEventHandler<HTMLInputElement>}
                  disabled={isDisabled}
                  placeholder="sk-••••••••••••••••••••••"
                  aria-describedby={feedback.fields.apiKey.error ? 'apiKey-error' : undefined}
                  aria-invalid={!!feedback.fields.apiKey.error}
                />
              </FormGroup>

              <FormGroup
                label="Webhook URL"
                htmlFor="webhook"
                error={feedback.fields.webhook.error}
                valid={feedback.fields.webhook.valid}
                hint="Optional. Must start with https://"
              >
                <input
                  id="webhook"
                  className={inputClass('webhook')}
                  type="url"
                  value={values.webhook}
                  onChange={handleChange('webhook')}
                  onBlur={handleBlur('webhook')}
                  disabled={isDisabled}
                  placeholder="https://hooks.example.com/…"
                  aria-describedby={feedback.fields.webhook.error ? 'webhook-error' : undefined}
                  aria-invalid={!!feedback.fields.webhook.error}
                />
              </FormGroup>
            </div>
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        {canEditSettings ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className={btnClass}
              type="submit"
              disabled={isDisabled}
              aria-busy={feedback.isSubmitting}
              aria-label={feedback.isSubmitting ? 'Saving…' : btnSuccess ? 'Saved!' : 'Save settings'}
            >
              {btnSuccess ? (
                <>
                  <svg style={{ width: 15, height: 15 }} viewBox="0 0 15 15" fill="none" aria-hidden="true">
                    <path d="M2 8 L6 12 L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Saved
                </>
              ) : feedback.isSubmitting ? (
                'Saving…'
              ) : (
                'Save Settings'
              )}
            </button>

            <button
              className="btn btn-outline"
              type="button"
              onClick={handleReset}
              disabled={isDisabled}
            >
              Reset
            </button>

            {/* State indicator text */}
            {feedback.submitState === 'error' && !feedback.isSubmitting && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(252,165,165,0.9)' }}>
                Save failed — check your input.
              </span>
            )}
          </div>
        ) : (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🔒</span>
            <span>You have read-only permissions for settings. Mutating swarm configuration is restricted to Admin roles.</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsForm;
