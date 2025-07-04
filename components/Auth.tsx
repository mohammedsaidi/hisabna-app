
import React, { useState } from 'react';
import { LockIcon } from './Icons';
import { APP_NAME } from '../constants';

interface AuthProps {
  storedPassword: string | null;
  onLogin: () => void;
  onSetPassword: (password: string) => void;
}

const Auth: React.FC<AuthProps> = ({ storedPassword, onLogin, onSetPassword }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === storedPassword) {
      onLogin();
    } else {
      setError('كلمة المرور غير صحيحة.');
    }
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('يجب أن تتكون كلمة المرور من 4 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    onSetPassword(password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-brand-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-light-surface dark:bg-brand-surface rounded-2xl shadow-lg">
        <div className="text-center">
            <LockIcon className="w-16 h-16 mx-auto text-brand-primary" />
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-brand-text-primary mt-4">مرحباً بك في {APP_NAME}</h1>
            <p className="text-light-text-secondary dark:text-brand-text-secondary mt-2">
            {storedPassword ? 'أدخل كلمة المرور للوصول إلى حسابك.' : 'قم بإنشاء كلمة مرور لتأمين بياناتك.'}
            </p>
        </div>

        <form onSubmit={storedPassword ? handleLogin : handleSetPassword} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full px-4 py-3 bg-light-interactive dark:bg-brand-background text-light-text-primary dark:text-white border border-light-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all duration-200"
              required
            />
          </div>

          {!storedPassword && (
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="w-full px-4 py-3 bg-light-interactive dark:bg-brand-background text-light-text-primary dark:text-white border border-light-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all duration-200"
                required
              />
            </div>
          )}

          {error && <p className="text-red-500 dark:text-red-400 text-center text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-brand-surface focus:ring-brand-primary transition-colors duration-200"
            >
              {storedPassword ? 'تسجيل الدخول' : 'إنشاء كلمة مرور'}
            </button>
          </div>
        </form>
         <div className="text-center text-xs text-light-text-secondary/80 dark:text-gray-500 mt-6">
            <p>يتم تخزين جميع بياناتك محليًا على هذا الجهاز فقط.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;