import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';
import { ThreeBackground } from '../components/ThreeBackground';

export function Register() {
  console.log('[Register Rendering] Initializing register page...');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { user, register } = useStore();
  const navigate = useNavigate();

  if (user) {
    console.log('[Register] User already logged in, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log("Register button clicked");
    console.log("Email:", email);

    if (email && password && username) {
      let signupError = null;
      let data = null;
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('YOUR_PROJECT_ID') && !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const result = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              username: username,
            }
          }
        });
        data = result.data;
        signupError = result.error;
      } else {
        signupError = { message: 'Failed to fetch' };
      }

      if (signupError) {
        if (signupError.message !== 'Failed to fetch') {
          console.error(signupError.message);
          setError(signupError.message);
          return;
        }
      }

      console.log("Signup success:", data);
      
      let loginError = null;
      let loginData = null;
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('YOUR_PROJECT_ID') && !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const result = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        loginData = result.data;
        loginError = result.error;
      } else {
        loginError = { message: 'Failed to fetch' };
      }

      if (loginError) {
        if (loginError.message !== 'Failed to fetch') {
          console.error(loginError.message);
          setError(loginError.message);
          return;
        }
      }

      // Update local store so the app recognizes the user
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      const result = register(email, username, hash);
      
      if (!result.success) {
        setError(result.error || 'Registration failed');
        return;
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
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">Join Us</h1>
          <p className="text-white/60 text-sm">Start your learning journey</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80 pl-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="Traveler"
                required
              />
            </div>
          </div>

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
            <label className="text-sm font-medium text-white/80 pl-1">Password</label>
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
            Create Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-white/50 text-sm mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
