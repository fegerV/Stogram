import React, { useState } from 'react';
import { Shield, Key, Copy, Check } from 'lucide-react';

interface TwoFactorAuthProps {
  onClose: () => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onClose }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecret(data.data.secret);
        setBackupCodes(data.data.backupCodes);
        setStep('verify');
      } else {
        alert('Failed to enable 2FA');
      }
    } catch (error) {
      console.error('Enable 2FA error:', error);
      alert('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        setStep('complete');
      } else {
        alert('Invalid verification code');
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      alert('Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stogram-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
        </div>

        {step === 'setup' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What you'll need:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Your smartphone or tablet</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEnable2FA}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Scan this QR code with your authenticator app:
              </p>
              <div className="bg-white p-4 rounded-lg inline-block">
                {/* QR Code would be rendered here */}
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                  <p className="text-sm text-gray-500">QR Code</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Or enter this key manually:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={secret}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Enter verification code:</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-2 border rounded-lg text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2FA Enabled Successfully!</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Save Your Backup Codes
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Store these codes in a safe place. You can use them to access your account if you lose your phone.
              </p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded font-mono text-sm space-y-1 mb-3">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
              <button
                onClick={downloadBackupCodes}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Download Backup Codes
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
