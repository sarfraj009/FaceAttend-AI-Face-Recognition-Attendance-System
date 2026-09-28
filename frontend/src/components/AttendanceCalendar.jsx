import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export default function AttendanceCalendar({ records = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map records by date string YYYY-MM-DD
  const recordMap = {};
  records.forEach((r) => {
    if (r.date) {
      if (!recordMap[r.date]) {
        recordMap[r.date] = [];
      }
      recordMap[r.date].push(r);
    }
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // Blank days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, dateStr: null });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    days.push({ day: d, dateStr });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-white">Monthly Attendance Activity</h4>
          <p className="text-xs text-slate-400">Green indicates Present, Red indicates Absent</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-cyan-400">
            {monthNames[month]} {year}
          </span>
          <div className="flex gap-1 ml-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-400 mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((item, idx) => {
          if (!item.day) {
            return <div key={`empty-${idx}`} className="h-14 rounded-xl bg-slate-950/30 border border-transparent" />;
          }

          const dayRecords = recordMap[item.dateStr] || [];
          const hasPresent = dayRecords.some((r) => r.status === 'Present');
          const hasAbsent = dayRecords.some((r) => r.status === 'Absent');

          let statusClass = 'border-slate-800 bg-slate-950/60 text-slate-300';
          if (hasPresent) {
            statusClass = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/10';
          } else if (hasAbsent) {
            statusClass = 'border-rose-500/40 bg-rose-500/10 text-rose-300 shadow-sm shadow-rose-500/10';
          }

          const isToday =
            item.dateStr === new Date().toISOString().split('T')[0];

          return (
            <div
              key={item.dateStr}
              className={`relative h-14 rounded-xl border p-1.5 flex flex-col justify-between transition-all hover:scale-105 ${statusClass} ${
                isToday ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{item.day}</span>
                {hasPresent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {hasAbsent && !hasPresent && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
              </div>
              <div className="text-[10px] truncate text-slate-400">
                {dayRecords.length > 0 ? (
                  <span className="font-medium text-white">{dayRecords[0].subject || 'Class'}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border border-cyan-400 inline-block" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
