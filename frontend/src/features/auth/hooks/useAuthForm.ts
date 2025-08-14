import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export const useAuthForm = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithOTP, verifyOTP } = useAuth();

  const sendCode = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    const { error: err } = await signInWithOTP(email);
    if (err) {
      setError(err.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (!otp || otp.length !== 6) return;
    setLoading(true);
    setError('');
    const { error: err } = await verifyOTP(email, otp);
    if (err) {
      setError(err.message);
      setOtp('');
    }
    setLoading(false);
  };

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
  };

  return { email, setEmail, otp, setOtp, step, loading, error, sendCode, verifyCode, reset };
};
