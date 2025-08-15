
import React, { useState } from 'react';
import { AppContextProvider } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import Layout from './components/Layout';

type AuthScreen = 'signin' | 'signup' | 'reset';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const renderAuthScreen = () => {
    switch(authScreen) {
      case 'signin':
        return <LoginScreen 
          onLogin={handleLogin} 
          onSwitchToSignUp={() => setAuthScreen('signup')}
          onSwitchToForgotPassword={() => setAuthScreen('reset')}
        />;
      case 'signup':
        return <SignupScreen
          onSignupSuccess={handleLogin}
          onSwitchToSignIn={() => setAuthScreen('signin')}
        />;
      case 'reset':
        return <ResetPasswordScreen
          onSwitchToSignIn={() => setAuthScreen('signin')}
        />;
      default:
        return <LoginScreen 
          onLogin={handleLogin} 
          onSwitchToSignUp={() => setAuthScreen('signup')}
          onSwitchToForgotPassword={() => setAuthScreen('reset')}
        />;
    }
  }

  return (
    <div className="bg-secondary text-text-primary h-screen w-screen overflow-hidden">
      {isAuthenticated ? (
        <AppContextProvider onLogout={handleLogout}>
          <Layout />
        </AppContextProvider>
      ) : (
        renderAuthScreen()
      )}
    </div>
  );
};

export default App;