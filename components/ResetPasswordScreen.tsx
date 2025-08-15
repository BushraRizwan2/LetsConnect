import React, { useState } from 'react';
import { LetsConnectLogoIcon, SparklesIcon } from './icons';

interface ResetPasswordScreenProps {
  onSwitchToSignIn: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onSwitchToSignIn }) => {
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage("If an account exists for this email, a reset link has been sent.");
  };

  return (
    <div className="flex items-center justify-center h-full bg-secondary">
        <div className="w-full max-w-md p-4 sm:p-8 space-y-6 bg-primary rounded-2xl shadow-2xl text-center">
          <div className="flex justify-center items-center space-x-3">
              <LetsConnectLogoIcon className="w-16 h-16 text-accent" />
              <h1 className="text-4xl font-bold text-text-primary tracking-tight">Let's Connect</h1>
          </div>
          <p className="text-text-secondary">Reset your password.</p>
              <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div>
                  <input id="email-forgot" name="email" type="email" required placeholder="Enter your email"
                          className="w-full px-4 py-3 bg-primary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" />
              </div>
              {formMessage && <p className="text-sm text-green-400">{formMessage}</p>}
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight transition-colors duration-200">
                  Send Reset Link
              </button>
          </form>
          <p className="text-sm text-text-secondary">
              Remembered your password?{' '}
              <button onClick={onSwitchToSignIn} className="font-medium text-accent hover:text-highlight">Sign in</button>
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary pt-4">
              <SparklesIcon className="w-5 h-5 text-accent" />
              <span>Powered by CodeAutomation AI</span>
          </div>
        </div>
    </div>
  );
};

export default ResetPasswordScreen;