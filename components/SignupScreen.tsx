

import React, { useState, useEffect, useRef } from 'react';
import { LetsConnectLogoIcon, SparklesIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from './icons';
import { countries } from '../data/countries';

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onSwitchToSignIn: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onSwitchToSignIn }) => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Details state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === '+1' && c.name === 'United States') || countries[0]);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [verificationTarget, setVerificationTarget] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const phone = `${selectedCountry.code}${formData.get('phone') as string}`;

    if (verificationMethod === 'email') {
        setVerificationTarget(email);
    } else {
        setVerificationTarget(phone);
    }
    
    // In a real app, you would call your backend to send the OTP.
    console.log(`Sending OTP to ${verificationTarget}`);
    setResendCooldown(30);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length === 6) {
        // In a real app, you'd verify the OTP with your backend.
        console.log("OTP Verified:", otp.join(''));
        onSignupSuccess();
    } else {
        setFormMessage("Please enter the complete 6-digit code.");
    }
  };
  
  const handleResendOtp = () => {
    if (resendCooldown === 0) {
        console.log(`Resending OTP to ${verificationTarget}`);
        setResendCooldown(30);
        setFormMessage(`A new code has been sent to ${verificationTarget}.`);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);

    if (element.nextSibling && element.value) {
        (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && e.currentTarget.previousSibling) {
        (e.currentTarget.previousSibling as HTMLInputElement).focus();
    } else if (e.key === 'ArrowLeft' && e.currentTarget.previousSibling) {
        (e.currentTarget.previousSibling as HTMLInputElement).focus();
    } else if (e.key === 'ArrowRight' && e.currentTarget.nextSibling) {
        (e.currentTarget.nextSibling as HTMLInputElement).focus();
    }
  };

  const renderDetailsStep = () => (
    <>
      <div className="flex justify-center items-center space-x-3">
        <LetsConnectLogoIcon className="w-16 h-16 text-accent" />
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">Let's Connect</h1>
      </div>
      <p className="text-text-secondary">Create a new account.</p>
      <form className="space-y-4" onSubmit={handleSignUp}>
          <input id="name-signup" name="name" type="text" autoComplete="name" required placeholder="Full Name"
                  className="w-full px-4 py-3 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" />
          
          <input id="email-signup" name="email" type="email" autoComplete="email" required placeholder="Email address"
                  className="w-full px-4 py-3 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" />

          <div className="flex space-x-2">
              <div className="relative">
                  <button type="button" onClick={() => setIsCountryDropdownOpen(p => !p)} className="flex items-center h-full px-3 bg-secondary border border-slate-600 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight">
                      <span>{selectedCountry.flag}</span>
                      <span className="ml-2 text-sm">{selectedCountry.code}</span>
                  </button>
                  {isCountryDropdownOpen && (
                      <ul className="absolute bottom-full mb-2 w-56 bg-primary border border-slate-600 rounded-lg z-10 max-h-48 overflow-y-auto">
                          {countries.map(country => (
                              <li key={country.name} onClick={() => { setSelectedCountry(country); setIsCountryDropdownOpen(false); }} className="flex items-center p-2 hover:bg-secondary cursor-pointer">
                                  <span className="w-6">{country.flag}</span>
                                  <span className="ml-2 text-sm">{country.name} ({country.code})</span>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
              <input id="phone-signup" name="phone" type="tel" autoComplete="tel" required placeholder="Phone Number"
                      className="flex-1 w-full px-4 py-3 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" />
          </div>
          
          <div className="relative">
              <input id="password-signup" name="password" type={showPassword ? 'text' : 'password'} required placeholder="Password"
                      className="w-full px-4 py-3 pr-10 bg-secondary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors" />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-secondary hover:text-text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
          </div>

          <fieldset className="text-sm text-text-secondary">
            <legend className="sr-only">Verification method</legend>
            <div className="flex justify-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="verification" value="email" checked={verificationMethod === 'email'} onChange={() => setVerificationMethod('email')} className="form-radio bg-secondary text-accent border-slate-500 focus:ring-highlight"/>
                Verify with Email
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="verification" value="phone" checked={verificationMethod === 'phone'} onChange={() => setVerificationMethod('phone')} className="form-radio bg-secondary text-accent border-slate-500 focus:ring-highlight"/>
                Verify with Phone
              </label>
            </div>
          </fieldset>

          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight transition-colors duration-200">
              Create Account
          </button>
      </form>
        <p className="text-sm text-text-secondary">
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} className="font-medium text-accent hover:text-highlight">Sign in</button>
      </p>
      <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary pt-4">
          <SparklesIcon className="w-5 h-5 text-accent" />
          <span>Powered by CodeAutomation AI</span>
      </div>
    </>
  );
  
  const renderOtpStep = () => (
      <>
          <div className="flex justify-center items-center space-x-3">
            <ShieldCheckIcon className="w-12 h-12 text-highlight" />
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Confirm Your Account</h1>
          </div>
            <p className="text-text-secondary">Please enter the 6-digit code sent to<br/><strong className="text-text-primary">{verificationTarget}</strong>.</p>
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="flex justify-center space-x-2">
                  {otp.map((data, index) => (
                      <input
                          key={index}
                          type="text"
                          value={data}
                          onChange={e => handleOtpChange(e.target, index)}
                          onKeyDown={e => handleOtpKeyDown(e, index)}
                          onFocus={e => e.target.select()}
                          maxLength={1}
                          className="w-12 h-14 text-center text-2xl font-semibold bg-secondary border border-slate-600 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors"
                      />
                  ))}
              </div>
              {formMessage && <p className="text-sm text-green-400">{formMessage}</p>}
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight transition-colors duration-200">
                  Verify Account
              </button>
          </form>
          <div className="text-sm text-text-secondary">
              Didn't receive the code?{' '}
              <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="font-medium text-accent hover:text-highlight disabled:text-text-secondary disabled:cursor-not-allowed">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
          </div>
      </>
  );

  return (
    <div className="flex items-center justify-center h-full bg-secondary overflow-y-auto">
        <div className="w-full max-w-md p-4 sm:p-8 space-y-6 bg-primary rounded-2xl shadow-2xl text-center my-auto">
            {step === 'details' ? renderDetailsStep() : renderOtpStep()}
        </div>
    </div>
  );
};

export default SignupScreen;