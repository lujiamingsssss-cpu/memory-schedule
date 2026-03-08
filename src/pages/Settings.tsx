import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../lib/store';
import type { TaskMode, PageType, BackgroundTheme } from '../types';
import { User as UserIcon, Settings as SettingsIcon, Layout, Upload, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BACKGROUND_OPTIONS: { value: BackgroundTheme; label: string; group: string }[] = [
  { value: 'default', label: 'Default Theme', group: 'Standard' },
  { value: 'your_name_sky', label: 'Your Name Sky', group: 'Cinematic' },
  { value: 'weathering_rain', label: 'Weathering With You Rain', group: 'Cinematic' },
  { value: '5cm_sakura', label: '5 Centimeters Per Second Sakura', group: 'Cinematic' },
  { value: 'garden_rain', label: 'Garden of Words Rain Garden', group: 'Cinematic' },
  { value: 'suzume_sunset', label: 'Suzume Sunset Field', group: 'Cinematic' },
];

export function Settings() {
  const { user, updateUser, settings, updateSettings } = useStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [taskMode, setTaskMode] = useState<TaskMode>(settings.task_mode);
  const [backgrounds, setBackgrounds] = useState<Record<PageType, BackgroundTheme>>(settings.backgrounds);
  const [customBackgrounds, setCustomBackgrounds] = useState<Partial<Record<PageType, string>>>(settings.custom_backgrounds || {});
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  const saveSettings = useCallback(() => {
    updateUser({
      username,
      avatar_url: avatarUrl,
    });
    updateSettings({
      task_mode: taskMode,
      backgrounds,
      custom_backgrounds: customBackgrounds,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, [username, avatarUrl, taskMode, backgrounds, customBackgrounds, updateUser, updateSettings]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveSettings();
    }, 1000);

    return () => clearTimeout(timer);
  }, [username, avatarUrl, taskMode, backgrounds, customBackgrounds, saveSettings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (page: PageType, theme: BackgroundTheme) => {
    setBackgrounds(prev => ({ ...prev, [page]: theme }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl mx-auto relative"
    >
      <header className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-3xl font-light tracking-tight text-white/90">Settings</h1>
      </header>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-xl shadow-lg backdrop-blur-md z-50 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Settings saved automatically
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-10">
        
        {/* Profile Settings */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium text-white/90 flex items-center gap-2 border-b border-white/10 pb-4">
            <UserIcon className="w-5 h-5 text-purple-400" />
            Profile Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">Avatar</label>
              <div className="flex items-center gap-4">
                <img 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  className="w-16 h-16 rounded-full border-2 border-white/20 object-cover shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsPreviewOpen(true)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200';
                  }}
                />
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition-all text-white/90"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
                  <p className="text-xs text-white/40 mt-2">Supports JPG, PNG. Click image to preview.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Modes */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium text-white/90 flex items-center gap-2 border-b border-white/10 pb-4">
            <Layout className="w-5 h-5 text-blue-400" />
            System Modes
          </h2>
          
          <div className="space-y-8">
            {/* Task Mode */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">Learning Task Mode</label>
              <p className="text-xs text-white/40 mb-2">Choose how you want to track your learning progress by default.</p>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 max-w-md">
                <button
                  onClick={() => setTaskMode('page')}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${taskMode === 'page' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                >
                  Page Mode
                </button>
                <button
                  onClick={() => setTaskMode('date')}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${taskMode === 'date' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                >
                  Date Mode
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Background Settings */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium text-white/90 flex items-center gap-2 border-b border-white/10 pb-4">
            <ImageIcon className="w-5 h-5 text-pink-400" />
            Background Settings
          </h2>
          <p className="text-sm text-white/60">Customize the animated background for each page.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['auth', 'dashboard', 'log', 'settings'] as PageType[]).map((page) => (
              <div key={page} className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <label className="block text-sm font-medium text-white/80 capitalize">
                  {page === 'auth' ? 'Login / Register' : page === 'log' ? 'Learning Log' : page}
                </label>
                <select
                  value={backgrounds[page]}
                  onChange={(e) => handleBackgroundChange(page, e.target.value as BackgroundTheme)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  disabled={!!customBackgrounds[page]}
                >
                  {Array.from(new Set(BACKGROUND_OPTIONS.map(o => o.group))).map(group => (
                    <optgroup key={group} label={group} className="bg-[#1a1c2c] text-white/50">
                      {BACKGROUND_OPTIONS.filter(o => o.group === group).map(option => (
                        <option key={option.value} value={option.value} className="text-white">
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    id={`bg-upload-${page}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCustomBackgrounds(prev => ({ ...prev, [page]: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor={`bg-upload-${page}`}
                    className="cursor-pointer text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    {customBackgrounds[page] ? 'Change Image' : 'Upload Image'}
                  </label>
                  {customBackgrounds[page] && (
                    <button
                      onClick={() => {
                        setCustomBackgrounds(prev => {
                          const next = { ...prev };
                          delete next[page];
                          return next;
                        });
                      }}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Avatar Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl w-full aspect-square cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={avatarUrl} 
                alt="Avatar Preview Large" 
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/800/800';
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


