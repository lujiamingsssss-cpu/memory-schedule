import { differenceInDays, parseISO, startOfDay, isToday, isYesterday } from 'date-fns';
import type { DailyStats } from '../types';

export function calculateStreak(stats: DailyStats[]): number {
  if (!stats || stats.length === 0) return 0;

  // Get unique dates sorted descending
  const uniqueDates = Array.from(new Set(stats.map(s => s.date)))
    .map(dateStr => startOfDay(parseISO(dateStr)))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  let currentDate = startOfDay(new Date());
  
  // Check if the first date is today or yesterday
  const firstDate = uniqueDates[0];
  if (!isToday(firstDate) && !isYesterday(firstDate)) {
    return 0; // Streak broken
  }

  for (let i = 0; i < uniqueDates.length; i++) {
    const date = uniqueDates[i];
    
    if (i === 0) {
      streak = 1;
      currentDate = date;
      continue;
    }

    const diff = differenceInDays(currentDate, date);
    
    if (diff === 1) {
      streak++;
      currentDate = date;
    } else if (diff === 0) {
      // Same day, ignore
      continue;
    } else {
      // Gap > 1 day, streak broken
      break;
    }
  }

  return streak;
}

