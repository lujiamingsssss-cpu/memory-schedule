import { useState } from 'react';
import { useStore } from '../lib/store';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Book, Calendar, Plus, Flame, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard() {
  console.log('[Dashboard Rendering] Initializing dashboard...');
  const { user, settings, tasks, addTask, completeTask, reviews, completeReview } = useStore();
  
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (settings.task_mode === 'page') {
      if (!startPage || !endPage) return;
      addTask({
        task_type: 'page',
        start_page: parseFloat(startPage),
        end_page: parseFloat(endPage),
        learn_date: today,
      });
      setStartPage('');
      setEndPage('');
    } else {
      if (!startDate || !endDate) return;
      addTask({
        task_type: 'date',
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        learn_date: today,
      });
      setStartDate('');
      setEndDate('');
      setIsHalfDay(false);
    }
  };

  const todayTasks = tasks.filter(t => t.learn_date === today);
  const todayReviews = reviews.filter(r => r.review_date === today);

  // Calculate today's achievements
  let todayPages = 0;
  let todayDays = 0;

  [...todayTasks.filter(t => t.completed), ...todayReviews.filter(r => r.completed).map(r => tasks.find(t => t.id === r.task_id)).filter(Boolean)].forEach(t => {
    if (!t) return;
    if (t.task_type === 'page' && t.start_page !== undefined && t.end_page !== undefined) {
      todayPages += (t.end_page - t.start_page + 1);
    } else if (t.task_type === 'date' && t.start_date && t.end_date) {
      if (t.is_half_day) {
        todayDays += 0.5;
      } else {
        todayDays += (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1);
      }
    }
  });

  const renderTaskContent = (task: any) => {
    if (task.task_type === 'page') {
      return `Pages ${task.start_page} - ${task.end_page}`;
    } else {
      const start = task.start_date ? format(parseISO(task.start_date), 'MMM d, yyyy') : 'Unknown';
      const end = task.end_date ? format(parseISO(task.end_date), 'MMM d, yyyy') : 'Unknown';
      return task.is_half_day ? `${start} (Half Day)` : `${start} - ${end}`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="space-y-2">
        <h1 className="text-4xl font-light tracking-tight text-white/90">
          Welcome back, <span className="font-medium text-white">{user?.username}</span>
        </h1>
        <p className="text-white/60 font-serif italic text-lg">
          "The sky is clear today. Let's make some progress."
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Card */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            New Learning Task
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {settings.task_mode === 'page' ? (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/70 mb-1">Start Page</label>
                  <div className="relative">
                    <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={startPage}
                      onChange={(e) => setStartPage(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/70 mb-1">End Page</label>
                  <div className="relative">
                    <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="number"
                      min={startPage || "1"}
                      step="0.5"
                      value={endPage}
                      onChange={(e) => setEndPage(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/70 mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (isHalfDay) setEndDate(e.target.value);
                        }}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white/70 mb-1">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="date"
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={isHalfDay}
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="halfDay"
                    checked={isHalfDay}
                    onChange={(e) => {
                      setIsHalfDay(e.target.checked);
                      if (e.target.checked && startDate) {
                        setEndDate(startDate);
                      }
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <label htmlFor="halfDay" className="text-sm text-white/70 cursor-pointer">
                    Half Day Task (0.5 Days)
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
            >
              Add Task
            </button>
          </form>

          {/* Today's Tasks List */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium text-white/90">Today's Tasks</h3>
            {todayTasks.length === 0 ? (
              <p className="text-white/40 text-sm italic">No tasks for today.</p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-4">
                    <span className={`text-white/90 ${task.completed ? 'line-through opacity-50' : ''}`}>
                      {renderTaskContent(task)}
                    </span>
                    <button 
                      onClick={() => !task.completed && completeTask(task.id)}
                      disabled={task.completed}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${task.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      {task.completed ? 'Completed' : 'Complete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Reviews List */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium text-white/90">Today's Reviews</h3>
            {todayReviews.length === 0 ? (
              <p className="text-white/40 text-sm italic">No reviews scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {todayReviews.map(review => {
                  const task = tasks.find(t => t.id === review.task_id);
                  if (!task) return null;
                  return (
                    <div key={review.id} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-4">
                      <span className={`text-white/90 ${review.completed ? 'line-through opacity-50' : ''}`}>
                        {renderTaskContent(task)}
                      </span>
                      <button 
                        onClick={() => !review.completed && completeReview(review.id)}
                        disabled={review.completed}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${review.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
                      >
                        {review.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        {review.completed ? 'Reviewed' : 'Review'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Today's Achievements */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-fit">
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Today's Achievements
          </h2>
          
          <div className="space-y-4">
            <div className="bg-black/20 border border-white/5 rounded-xl p-6 text-center">
              <div className="text-4xl font-light tracking-tighter text-white mb-1">
                {todayPages}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-widest">Total Pages</div>
            </div>
            
            <div className="bg-black/20 border border-white/5 rounded-xl p-6 text-center">
              <div className="text-4xl font-light tracking-tighter text-white mb-1">
                {todayDays}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-widest">Total Days</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

