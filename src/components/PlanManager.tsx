import { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { ChevronDown, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PlanManager() {
  const { plans, settings, createPlan, renamePlan, deletePlan, switchPlan } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const currentPlan = plans.find(p => p.id === settings.current_plan_id);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setIsRenaming(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure there's always at least one plan
  useEffect(() => {
    if (plans.length === 0) {
      createPlan('My First Plan');
    } else if (!settings.current_plan_id && plans.length > 0) {
      switchPlan(plans[0].id);
    }
  }, [plans, settings.current_plan_id, createPlan, switchPlan]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlanName.trim()) {
      createPlan(newPlanName.trim());
      setNewPlanName('');
      setIsCreating(false);
    }
  };

  const handleRename = (e: React.FormEvent, planId: string) => {
    e.preventDefault();
    if (newPlanName.trim()) {
      renamePlan(planId, newPlanName.trim());
      setNewPlanName('');
      setIsRenaming(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-300 backdrop-blur-md shadow-lg"
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Current Plan</span>
          <span className="text-sm font-medium text-white truncate max-w-[150px]">
            {currentPlan?.plan_name || 'Select Plan'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
              {plans.map(plan => (
                <div key={plan.id} className="group relative flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition-colors">
                  {isRenaming === plan.id ? (
                    <form onSubmit={(e) => handleRename(e, plan.id)} className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                        autoFocus
                        onBlur={() => setIsRenaming(null)}
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          switchPlan(plan.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        {settings.current_plan_id === plan.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className="text-sm text-white/90 truncate">{plan.plan_name}</span>
                      </button>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setIsRenaming(plan.id);
                            setNewPlanName(plan.plan_name);
                          }}
                          className="p-1.5 text-white/50 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {plans.length > 1 && (
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="p-1.5 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-white/10 bg-white/5">
              {isCreating ? (
                <form onSubmit={handleCreate} className="flex items-center gap-2 p-2">
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="Plan name..."
                    className="flex-1 bg-black/50 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button type="submit" className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setNewPlanName('');
                  }}
                  className="w-full flex items-center gap-2 p-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Plan
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
