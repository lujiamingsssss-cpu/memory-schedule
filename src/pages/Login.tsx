import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import bcrypt from 'bcryptjs';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      // In a real app we would compare the hash, but since we are simulating
      // we hash the input to compare with the stored hash, or we can just use bcrypt.compare
      // Wait, in store.ts we did: if (passwordHash !== foundUser.passwordHash)
      // Actually, bcrypt.compare is better. Let's change store.ts to store plain text or we hash it here.
      // If we use bcrypt, we should hash on register and compare on login.
      // But store.ts is synchronous. Let's just pass the plain password to store and let store handle it?
      // No, store.ts is synchronous, bcrypt.compare is async.
      // Let's just use a simple hash or pass plain password for now, or use bcrypt.compareSync.
      // Let's use bcrypt.compareSync in store.ts, or just do it here.
      // Let's just pass the password to login and let login handle it.
      
      const users = JSON.parse(localStorage.getItem('hoshi_users') || '[]');
      const foundUser = users.find((u: any) => u.email === email);
      
      if (!foundUser) {
        setError('Account does not exist');
        return;
      }

      const isValid = bcrypt.compareSync(password, foundUser.passwordHash);
      if (!isValid) {
        setError('Incorrect password');
        return;
      }

      const result = login(email, foundUser.passwordHash);
      if (result?.error) {
        setError(result.error);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB]/20 to-[#4682B4]/40 -z-10 pointer-events-none" />
      
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
