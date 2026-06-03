import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useToast } from '@/lib/store/toast-store';
import { X, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, loading } = useAuthStore();
  const { success, error: toastError } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const { error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setErrorMsg(error.message || 'Authentication failed.');
      toastError('Authentication Failed', error.message || 'Please check your credentials.');
    } else {
      success(
        isSignUp ? 'Registration Successful' : 'Welcome Back',
        isSignUp ? 'Please check your email for confirmation link.' : 'You have logged in successfully.'
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glass backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#110e1b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fade-in text-gray-900 dark:text-white">
        {/* Decorative subtle background gradient */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#1a6adf]/10 dark:bg-[#60aaff]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isSignUp ? 'Create an Account' : 'Welcome to Genesis'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isSignUp ? 'Sign up to sync your visual history' : 'Sign in to access your dashboard'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6adf] dark:focus:ring-[#60aaff] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6adf] dark:focus:ring-[#60aaff] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#1a6adf] dark:bg-white text-white dark:text-black hover:bg-[#1a6adf]/90 dark:hover:bg-gray-100 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs font-medium text-[#1a6adf] dark:text-[#60aaff] hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
