import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { ThreeBackground } from '../components/ThreeBackground';

export function Login() {
  console.log('[Login Rendering] Initializing login page...');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, register } = useStore();
  const navigate = useNavigate();

  if (user) {
    console.log('[Login] User already logged in, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (loginError) {
        console.error(loginError.message);
        setError(loginError.message);
        return;
      }

      // Sync with local store for backward compatibility
      let users = [];
      try {
        const saved = localStorage.getItem('hoshi_users');
        const parsed = saved ? JSON.parse(saved) : [];
        users = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse users', e);
        users = [];
      }
      
      const foundUser = users.find((u: any) => u.email === email);
      
      if (!foundUser) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        register(email, email.split('@')[0], hash);
      } else {
        const hashToUse = foundUser.passwordHash;
        login(email, hashToUse);
      }

      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <ThreeBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <span className="text-2xl font-bold text-white tracking-tighter">H</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-white/60 text-sm">Continue your learning journey</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80 pl-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between pl-1 pr-1">
              <label className="text-sm font-medium text-white/80">Password</label>
              <Link to="/reset-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-white/50 text-sm mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
