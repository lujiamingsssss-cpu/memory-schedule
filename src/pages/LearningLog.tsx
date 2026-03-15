import { useState, useMemo, useEffect } from 'react';
import { useStore, REVIEW_INTERVALS } from '../lib/store';
import { calculateStreak } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, differenceInDays, isAfter, startOfDay } from 'date-fns';
import { Flame, Calendar as CalendarIcon, BarChart3, ChevronLeft, ChevronRight, Book, Calendar, X, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function LearningLog() {
  const { settings, updateSettings, tasks, reviews, getDailyStats, addTask, toggleTaskCompletion, deleteTask, toggleReviewCompletion, deleteReview } = useStore();
  
  const dailyStats = getDailyStats();
  const streak = calculateStreak(dailyStats);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Reset selected task when plan changes
  useEffect(() => {
    setSelectedTaskId(null);
  }, [settings.current_plan_id]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const chartData = useMemo(() => {
    // Last 14 days
    const last14Days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return format(d, 'yyyy-MM-dd');
    });

    const labels = last14Days.map(dateStr => format(parseISO(dateStr), 'MMM dd'));
    const data = last14Days.map(dateStr => {
      const stat = dailyStats.find(s => s.date === dateStr);
      return stat ? stat.activity_score : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Activity Score',
          data,
          borderColor: '#818cf8',
          backgroundColor: 'rgba(129, 140, 248, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#1e1b4b',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [dailyStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#818cf8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: {
            size: 12,
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.1)',
          drawBorder: false,
          borderDash: [3, 3],
        },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: {
            size: 12,
          },
          stepSize: 1,
        },
        beginAtZero: true,
      }
    }
  };

  const getCalendarColor = (score: number) => {
    if (score === 0) return 'bg-white/5 border-white/5';
    if (score <= 2) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200';
    if (score <= 5) return 'bg-emerald-500/40 border-emerald-500/50 text-emerald-100';
    if (score <= 10) return 'bg-emerald-500/60 border-emerald-500/70 text-white';
    return 'bg-emerald-500/80 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  };

  // Combine tasks and reviews for recent list
  const getWorkloadColor = (workload: number) => {
    if (workload === 0) return 'transparent';
    if (workload <= 2.5) return '#4CAF50';
    if (workload <= 4) return '#42A5F5';
    if (workload <= 5) return '#FFA726';
    return '#EF5350';
  };

  const getWorkloadLevel = (workload: number) => {
    if (workload === 0) return 'None';
    if (workload <= 2.5) return 'Light';
    if (workload <= 4) return 'Normal';
    if (workload <= 5) return 'Heavy';
    return 'Severe';
  };

  const recentRecords = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed).map(t => ({
      id: `task-${t.id}`,
      title: t.title || (t.type === 'page' ? `Pages ${t.start_page} - ${t.end_page}` : `${t.start_date} - ${t.end_date}`),
      type: 'Task',
      date: t.learn_date,
      pages: t.type === 'page' ? (t.end_page! - t.start_page! + 1) : 0,
      days: t.type === 'date' && t.start_date && t.end_date ? (t.is_half_day ? 0.5 : (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1)) : 0,
    }));

    const completedReviews = reviews.filter(r => r.completed).map(r => {
      const t = tasks.find(task => task.id === r.task_id);
      if (!t) return null;
      return {
        id: `review-${r.id}`,
        title: t.title || (t.type === 'page' ? `Pages ${t.start_page} - ${t.end_page}` : (t.is_half_day ? `${t.start_date} (Half Day)` : `${t.start_date} - ${t.end_date}`)),
        type: `Review (Day ${REVIEW_INTERVALS[r.review_stage - 1] + 1})`,
        date: r.review_date,
        pages: t.type === 'page' ? (t.end_page! - t.start_page! + 1) : 0,
        days: t.type === 'date' && t.start_date && t.end_date ? (t.is_half_day ? 0.5 : (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1)) : 0,
      };
    }).filter(Boolean) as any[];

    return [...completedTasks, ...completedReviews]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [tasks, reviews]);

  // Automatically select the first task when tasks load
  useEffect(() => {
    if (recentRecords.length > 0 && !selectedTaskId) {
      setSelectedTaskId(recentRecords[0].id);
    } else if (recentRecords.length === 0) {
      setSelectedTaskId(null);
    }
  }, [recentRecords, selectedTaskId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Streak Header */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-8 shadow-2xl flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <h2 className="text-orange-200 font-medium tracking-wide uppercase text-sm mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Current Streak
          </h2>
          <div className="text-6xl font-light tracking-tighter text-white">
            {streak} <span className="text-2xl text-white/50 font-normal">days</span>
          </div>
        </div>
      </div>

      {/* View Toggle & Content */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-medium text-white/90">Activity Overview</h3>
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => updateSettings({ log_view_mode: 'calendar' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${settings.log_view_mode === 'calendar' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => updateSettings({ log_view_mode: 'chart' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${settings.log_view_mode === 'chart' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Chart
            </button>
          </div>
        </div>

        {settings.log_view_mode === 'calendar' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
              <span className="font-medium text-lg tracking-wide">{format(currentMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-white/40 py-2 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for start of month */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-xl bg-white/5 opacity-50" />
              ))}
              
              {/* Days */}
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const stat = dailyStats.find(s => s.date === dateStr);
                const score = stat ? stat.activity_score : 0;
                const isTodayDate = isSameDay(day, new Date());
                
                const dayTasks = tasks.filter(t => t.learn_date === dateStr);
                const dayReviews = reviews.filter(r => r.review_date === dateStr);
                
                let plannedPages = 0;
                let plannedDays = 0;
                
                dayTasks.forEach(t => {
                  if (t.task_type === 'page') plannedPages += (t.end_page! - t.start_page! + 1);
                  if (t.task_type === 'date' && t.start_date && t.end_date) plannedDays += (t.is_half_day ? 0.5 : (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1));
                });
                
                dayReviews.forEach(r => {
                  const t = tasks.find(task => task.id === r.task_id);
                  if (t) {
                    if (t.task_type === 'page') plannedPages += (t.end_page! - t.start_page! + 1);
                    if (t.task_type === 'date' && t.start_date && t.end_date) plannedDays += (t.is_half_day ? 0.5 : (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1));
                  }
                });
                
                const workload = dayTasks.length + dayReviews.length;
                const workloadColor = getWorkloadColor(workload);
                
                const tooltip = `Date: ${dateStr}\nDaily Tasks: ${dayTasks.length}\nReview Tasks: ${dayReviews.length}\nTotal Workload: ${workload}\nWorkload Level: ${getWorkloadLevel(workload)}\nPlanned Pages: ${plannedPages}\nPlanned Days: ${plannedDays}`;
                
                const totalTasks = dayTasks.length + dayReviews.length;
                const completedTasks = dayTasks.filter(t => t.completed).length + dayReviews.filter(r => r.completed).length;
                const unfinishedTasks = totalTasks - completedTasks;
                const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
                
                const today = startOfDay(new Date());
                const isFutureDate = isAfter(day, today);
                
                return (
                  <div 
                    key={day.toISOString()} 
                    title={tooltip}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-xl flex flex-col p-1 sm:p-1.5 text-sm transition-all relative group border cursor-pointer hover:scale-105 overflow-hidden
                      ${getCalendarColor(score)}
                      ${isTodayDate ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#1a1c2c]' : ''}
                    `}
                  >
                    <span className={`absolute top-1 left-1.5 font-medium z-10 text-[10px] sm:text-xs ${score === 0 ? 'text-white/40' : 'text-white/90'}`}>{format(day, 'd')}</span>
                    
                    {totalTasks > 0 && (
                      <div className="w-full h-full flex flex-col pt-3 sm:pt-4">
                        {/* Progress Bar - Top 2/3 */}
                        <div className="flex-[2] flex items-center justify-center w-full">
                          <div className="flex w-full gap-[2px] px-0.5 h-2.5 sm:h-3.5">
                            {Array.from({ length: 10 }).map((_, i) => {
                              const isFilled = i < Math.round(completionRate * 10);
                              let barColor = 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]';
                              if (completionRate <= 0.3) barColor = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]';
                              else if (completionRate <= 0.5) barColor = 'bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.5)]';
                              else if (completionRate <= 0.7) barColor = 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]';
                              
                              return (
                                <div key={i} className={`flex-1 rounded-[2px] ${isFilled ? barColor : 'bg-black/30'}`} />
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Status Indicator - Bottom 1/3 */}
                        <div className="flex-[1] flex items-center justify-center pb-1">
                          {isFutureDate ? (
                            <div className="text-[10px] sm:text-xs font-bold text-blue-300 flex items-center gap-1">
                              <span className="text-[10px] sm:text-[12px]">📅</span>{totalTasks}
                            </div>
                          ) : unfinishedTasks > 0 ? (
                            <div className="text-[10px] sm:text-xs font-bold text-red-400 flex items-center gap-1 drop-shadow-md">
                              <span className="text-[10px] sm:text-[12px]">🔴</span>{unfinishedTasks}
                            </div>
                          ) : (
                            <div className="text-[10px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1 drop-shadow-md">
                              <span className="text-[10px] sm:text-[12px]">✅</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Recent Logs List & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-medium text-white/90 mb-6">Recent Records</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {recentRecords.length === 0 ? (
              <div className="text-center py-8 text-white/40 italic">
                No learning records yet. Start your journey today!
              </div>
            ) : (
              recentRecords.map(record => (
                <div 
                  key={record.id} 
                  onClick={() => setSelectedTaskId(record.id)}
                  className={`border rounded-xl p-4 flex items-center justify-between transition-colors cursor-pointer ${
                    record.id === selectedTaskId 
                      ? 'bg-indigo-500/20 border-indigo-500/50' 
                      : 'bg-black/20 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-white/90 text-lg">{record.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/70 uppercase tracking-wider">
                        {record.type}
                      </span>
                    </div>
                    <div className="text-sm text-white/50 flex items-center gap-3">
                      <span>{record.date ? format(parseISO(record.date), 'MMMM d, yyyy') : 'Unknown Date'}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="flex items-center gap-1">
                        {record.pages > 0 && <><Book className="w-3 h-3" /> {record.pages} pages</>}
                        {record.pages > 0 && record.days > 0 && <span className="w-1 h-1 rounded-full bg-white/20 mx-1" />}
                        {record.days > 0 && <><Calendar className="w-3 h-3" /> {record.days} days</>}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Details Area */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-medium text-white/90 mb-6">Task Details</h3>
          {selectedTaskId ? (
            <div className="space-y-4">
              {(() => {
                const selectedTask = recentRecords.find(r => r.id === selectedTaskId);
                if (!selectedTask) return <p className="text-white/40 italic">Task not found.</p>;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectedTask.id}
                  >
                    <h4 className="text-2xl font-medium text-white/90 mb-2">{selectedTask.title}</h4>
                    <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
                      {selectedTask.type}
                    </div>
                    
                    <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4 text-white/80">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <CalendarIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Completion Date</div>
                          <div className="font-medium">{selectedTask.date ? format(parseISO(selectedTask.date), 'MMMM d, yyyy') : 'Unknown Date'}</div>
                        </div>
                      </div>
                      
                      {selectedTask.pages > 0 && (
                        <div className="flex items-center gap-4 text-white/80">
                          <div className="p-3 bg-white/5 rounded-xl">
                            <Book className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Pages Read</div>
                            <div className="font-medium">{selectedTask.pages} pages</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedTask.days > 0 && (
                        <div className="flex items-center gap-4 text-white/80">
                          <div className="p-3 bg-white/5 rounded-xl">
                            <Calendar className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Duration</div>
                            <div className="font-medium">{selectedTask.days} days</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40 flex flex-col items-center justify-center h-[300px]">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Book className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg">Select a task</p>
              <p className="text-sm opacity-70 mt-1">Click on any record from the list to view its details</p>
            </div>
          )}
        </div>
      </div>
      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailsModal 
            date={selectedDate} 
            onClose={() => setSelectedDate(null)} 
            tasks={tasks}
            reviews={reviews}
            addTask={addTask}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
            toggleReviewCompletion={toggleReviewCompletion}
            deleteReview={deleteReview}
            settings={settings}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sub-component for Day Details Modal
function DayDetailsModal({ 
  date, onClose, tasks, reviews, addTask, toggleTaskCompletion, deleteTask, toggleReviewCompletion, deleteReview, settings 
}: any) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);

  const dayTasks = tasks.filter((t: any) => t.learn_date === date);
  const dayReviews = reviews.filter((r: any) => r.review_date === date);

  let plannedPages = 0;
  let plannedDays = 0;
  
  dayTasks.forEach((t: any) => {
    if (t.type === 'page') plannedPages += (t.end_page! - t.start_page! + 1);
    if (t.type === 'date' && t.start_date && t.end_date) plannedDays += (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1);
  });
  
  dayReviews.forEach((r: any) => {
    const t = tasks.find((task: any) => task.id === r.task_id);
    if (t) {
      if (t.type === 'page') plannedPages += (t.end_page! - t.start_page! + 1);
      if (t.type === 'date' && t.start_date && t.end_date) plannedDays += (differenceInDays(parseISO(t.end_date), parseISO(t.start_date)) + 1);
    }
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.task_mode === 'page') {
      if (!startPage || !endPage) return;
      await addTask({
        type: 'page',
        start_page: parseFloat(startPage),
        end_page: parseFloat(endPage),
        title: `Pages ${startPage} - ${endPage}`,
        learn_date: date,
      });
      setStartPage('');
      setEndPage('');
    } else {
      if (!startDate || !endDate) return;
      await addTask({
        type: 'date',
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        title: isHalfDay ? `${startDate} (Half Day)` : `${startDate} - ${endDate}`,
        learn_date: date,
      });
      setStartDate('');
      setEndDate('');
      setIsHalfDay(false);
    }
    setIsAddingTask(false);
  };

  const renderTaskContent = (task: any) => {
    if (task.title) return task.title;
    if (task.type === 'page') {
      return `Pages ${task.start_page} - ${task.end_page}`;
    }
    return task.is_half_day ? `${task.start_date} (Half Day)` : `${task.start_date} to ${task.end_date}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-medium text-white/90 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              {format(parseISO(date), 'MMMM d, yyyy')}
            </h3>
            {(plannedPages > 0 || plannedDays > 0) && (
              <div className="flex gap-3 mt-2 text-sm text-white/50">
                {plannedPages > 0 && <span className="flex items-center gap-1"><Book className="w-4 h-4" /> {plannedPages} Pages Planned</span>}
                {plannedDays > 0 && <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {plannedDays} Days Planned</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tasks Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider">Learning Tasks</h4>
              <button 
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add Task
              </button>
            </div>

            {isAddingTask && (
              <form onSubmit={handleAddTask} className="mb-4 bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                {settings.task_mode === 'page' ? (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Start Page</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={startPage}
                        onChange={(e) => setStartPage(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">End Page</label>
                      <input
                        type="number"
                        min={startPage || "1"}
                        step="0.5"
                        value={endPage}
                        onChange={(e) => setEndPage(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-white/50 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (isHalfDay) setEndDate(e.target.value);
                          }}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-[14px] py-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-colors"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-white/50 mb-1">End Date</label>
                        <input
                          type="date"
                          min={startDate}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          disabled={isHalfDay}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-[14px] py-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modalHalfDay"
                        checked={isHalfDay}
                        onChange={(e) => {
                          setIsHalfDay(e.target.checked);
                          if (e.target.checked && startDate) {
                            setEndDate(startDate);
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500/50"
                      />
                      <label htmlFor="modalHalfDay" className="text-xs text-white/70 cursor-pointer">
                        Half Day Task (0.5 Days)
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingTask(false)} className="text-xs px-3 py-1.5 text-white/50 hover:text-white">Cancel</button>
                  <button type="submit" className="text-xs px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors">Save</button>
                </div>
              </form>
            )}

            {dayTasks.length === 0 ? (
              <p className="text-sm text-white/30 italic">No tasks for this day.</p>
            ) : (
              <div className="space-y-2">
                {dayTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 group">
                    <div className="flex items-center gap-3">
                      <button onClick={async () => await toggleTaskCompletion(task.id)} className="text-white/50 hover:text-indigo-400 transition-colors">
                        {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={`text-sm ${task.completed ? 'text-white/40 line-through' : 'text-white/90'}`}>
                        {renderTaskContent(task)}
                      </span>
                    </div>
                    <button onClick={async () => await deleteTask(task.id)} className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviews Section */}
          <section>
            <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Reviews</h4>
            {dayReviews.length === 0 ? (
              <p className="text-sm text-white/30 italic">No reviews scheduled for this day.</p>
            ) : (
              <div className="space-y-2">
                {dayReviews.map((review: any) => {
                  const task = tasks.find((t: any) => t.id === review.task_id);
                  return (
                    <div key={review.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 group">
                      <div className="flex items-center gap-3">
                        <button onClick={async () => await toggleReviewCompletion(review.id)} className="text-white/50 hover:text-purple-400 transition-colors">
                          {review.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex flex-col">
                          <span className={`text-sm ${review.completed ? 'text-white/40 line-through' : 'text-white/90'}`}>
                            {task ? renderTaskContent(task) : 'Unknown Task'}
                          </span>
                          <span className="text-xs text-purple-400/70">Stage {review.review_stage} (Day {REVIEW_INTERVALS[review.review_stage - 1] + 1})</span>
                        </div>
                      </div>
                      <button onClick={async () => await deleteReview(review.id)} className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}

