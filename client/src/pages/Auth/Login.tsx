import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const { login, demoLogin } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      success('Welcome back to StockFlow!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMsg(null);
    setDemoSubmitting(true);
    try {
      await demoLogin();
      success('Welcome to StockFlow Demo Organization!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 bg-indigo-600 text-white rounded-2xl items-center justify-center shadow-lg shadow-indigo-600/25 mb-4">
          <Store className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Sign in to StockFlow
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Access your organization inventory management system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-2xl">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              placeholder="you@store.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={submitting}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Evaluator Demo Credentials Card */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Evaluator Demo Account
                </span>
                <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Sample Data
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-configured with realistic inventory, products, stock levels, and alert thresholds.
              </p>
              <div className="text-[11px] bg-white p-2.5 rounded-lg border border-indigo-100 font-mono text-slate-700 space-y-1">
                <div>Email: <span className="text-indigo-600 font-semibold select-all">demo@stockflow.com</span></div>
                <div>Password: <span className="text-indigo-600 font-semibold select-all">DemoUser123!</span></div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full justify-center text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-100/70"
                onClick={handleDemoSignIn}
                isLoading={demoSubmitting}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              >
                Instant Demo Sign In
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an organization account yet?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
