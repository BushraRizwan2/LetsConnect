
import React, { useState } from 'react';
import { LetsConnectLogoIcon, SparklesIcon, EyeIcon, EyeSlashIcon } from './icons';

interface LoginScreenProps {
  onLogin: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center justify-center h-full bg-secondary">
      <div className="w-full max-w-md p-4 sm:p-8 space-y-6 bg-primary rounded-2xl shadow-2xl text-center">
        
        <div className="flex justify-center items-center space-x-3">
          <LetsConnectLogoIcon className="w-16 h-16 text-accent" />
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">Let's Connect</h1>
        </div>
        
        <p className="text-text-secondary">Sign in to continue to your account.</p>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div>
                <input id="email-signin" name="email" type="email" autoComplete="email" required 
                        className="w-full px-4 py-3 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" 
                        placeholder="Email address" defaultValue="alex.ray@example.com" />
            </div>
            <div className="relative">
                <input id="password-signin" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required 
                        className="w-full px-4 py-3 pr-10 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" 
                        placeholder="Password" defaultValue="password123" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-secondary hover:text-text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
              <div className="text-right text-sm">
                <button type="button" onClick={onSwitchToForgotPassword} className="font-medium text-accent hover:text-highlight">
                    Forgot password?
                </button>
            </div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight transition-colors duration-200">
                Sign in
            </button>
        </form>
        <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignUp} className="font-medium text-accent hover:text-highlight">Sign up</button>
        </p>

        <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary pt-4">
            <SparklesIcon className="w-5 h-5 text-accent" />
            <span>Powered by CodeAutomation AI</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;