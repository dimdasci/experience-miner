import React from 'react';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthFormUI } from '../views/AuthFormUI';

const AuthFormContainer: React.FC = () => {
  const {
    email,
    setEmail,
    otp,
    setOtp,
    step,
    loading,
    error,
    sendCode,
    verifyCode,
    reset
  } = useAuthForm();

  return (
    <AuthFormUI
      email={email}
      otp={otp}
      step={step}
      loading={loading}
      error={error}
      onEmailChange={setEmail}
      onOtpChange={setOtp}
      onSend={sendCode}
      onVerify={verifyCode}
      onReset={reset}
    />
  );
};

export default AuthFormContainer;
