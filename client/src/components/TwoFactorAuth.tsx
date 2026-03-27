import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Copy, Key, Shield } from 'lucide-react';
import { monitoredApi } from '../utils/monitoredApi';

interface TwoFactorAuthProps {
  onClose: () => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onClose }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const response = await monitoredApi.post('/security/2fa/enable', {});

      if (response.data.success) {
        setSecret(response.data.data.secret);
        setQrCodeData(response.data.data.qrCodeData);
        setBackupCodes(response.data.data.backupCodes);
        setStep('verify');
      } else {
        toast.error('Не удалось включить 2FA');
      }
    } catch (error) {
      console.error('Enable 2FA error:', error);
      toast.error('Не удалось включить 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await monitoredApi.post('/security/2fa/verify', {
        code: verificationCode,
      });

      if (response.data.success) {
        setStep('complete');
        toast.success('2FA успешно включена');
      } else {
        toast.error('Неверный код подтверждения');
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      toast.error('Не удалось подтвердить 2FA');
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
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'stogram-2fa-backup-codes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#24323d] dark:bg-[#17212b]">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#3390ec]" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
        </div>

        {step === 'setup' && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <div className="rounded-2xl bg-blue-50 p-4 dark:bg-[#17263a]">
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">What you'll need:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>An authenticator app such as Google Authenticator or Authy</li>
                <li>Your smartphone or tablet</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 transition hover:bg-slate-50 dark:border-[#364450] dark:hover:bg-[#202b36]"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleEnable2FA()}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#3390ec] px-4 py-2 text-white transition hover:bg-[#2b7fd1] disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="mb-4 text-slate-600 dark:text-slate-300">
                Scan this QR code with your authenticator app:
              </p>
              <div className="inline-block rounded-2xl bg-white p-4 shadow-sm dark:bg-[#111922]">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="2FA QR Code" className="h-48 w-48" />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#202b36]">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading QR Code...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Or enter this key manually:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={secret}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-[#364450] dark:bg-[#202b36] dark:text-white"
                />
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="rounded-xl bg-slate-100 px-3 py-2 transition hover:bg-slate-200 dark:bg-[#202b36] dark:hover:bg-[#2a3947]"
                >
                  {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Enter verification code:
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-center font-mono text-2xl tracking-widest dark:border-[#364450] dark:bg-[#202b36] dark:text-white"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 transition hover:bg-slate-50 dark:border-[#364450] dark:hover:bg-[#202b36]"
              >
                Back
              </button>
              <button
                onClick={() => void handleVerify()}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 rounded-xl bg-[#3390ec] px-4 py-2 text-white transition hover:bg-[#2b7fd1] disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                2FA Enabled Successfully!
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <div className="rounded-2xl bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Key className="h-4 w-4" />
                Save Your Backup Codes
              </h4>
              <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                Store these codes in a safe place. You can use them to access your account if you lose your phone.
              </p>
              <div className="mb-3 space-y-1 rounded-xl bg-white p-3 font-mono text-sm dark:bg-[#111922] dark:text-white">
                {backupCodes.map((code, index) => (
                  <div key={index}>{code}</div>
                ))}
              </div>
              <button
                onClick={downloadBackupCodes}
                className="w-full rounded-xl bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600"
              >
                Download Backup Codes
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-[#3390ec] px-4 py-2 text-white transition hover:bg-[#2b7fd1]"
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
