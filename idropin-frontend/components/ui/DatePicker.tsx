'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = '选择日期', showTime = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [time, setTime] = useState({ hours: 0, minutes: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setTime({ hours: value.getHours(), minutes: value.getMinutes() });
      setCurrentMonth(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (day: Date) => {
    const newDate = setMinutes(setHours(day, time.hours), time.minutes);
    setSelectedDate(newDate);
    onChange(newDate);
    if (!showTime) setIsOpen(false);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: string) => {
    let num = parseInt(val);
    if (isNaN(num)) num = 0;
    
    let newTime = { ...time };
    if (type === 'hours') {
      num = Math.max(0, Math.min(23, num));
      newTime.hours = num;
    } else {
      num = Math.max(0, Math.min(59, num));
      newTime.minutes = num;
    }
    setTime(newTime);

    if (selectedDate) {
      const newDate = setMinutes(setHours(selectedDate, newTime.hours), newTime.minutes);
      setSelectedDate(newDate);
      onChange(newDate);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Calculate padding days for start of month
  const startDay = startOfMonth(currentMonth).getDay(); // 0 is Sunday
  const paddingDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null); // Adjust for Monday start if needed

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="flex items-center w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="w-4 h-4 text-slate-500 mr-2" />
        <span className={`text-sm ${selectedDate ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
          {selectedDate ? format(selectedDate, showTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 w-[320px] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              {format(currentMonth, 'yyyy年 MM月', { locale: zhCN })}
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['一', '二', '三', '四', '五', '六', '日'].map(d => (
              <div key={d} className="text-xs text-slate-400 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrent = isToday(day);
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : isCurrent 
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {showTime && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span>时间</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={String(time.hours).padStart(2, '0')}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={String(time.minutes).padStart(2, '0')}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
             <button 
               onClick={() => { setSelectedDate(null); onChange(null); setIsOpen(false); }}
               className="text-xs text-red-500 hover:text-red-600 mr-auto"
             >
               清除
             </button>
             <button 
               onClick={() => setIsOpen(false)}
               className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
             >
               确定
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
