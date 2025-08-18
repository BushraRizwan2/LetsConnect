import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Meeting, RecurrenceFrequency } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, VideoCameraIcon, ChevronDownIcon, RefreshIcon } from './icons';

type CalendarViewMode = 'day' | 'week' | 'work-week' | '2-week';

const HOUR_HEIGHT = 80; // Increased hourly distance
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

const useAdvancedCalendar = (currentDate: Date, setCurrentDate: (updater: Date | ((d: Date) => Date)) => void, viewMode: CalendarViewMode, timezone?: string) => {
    const displayedDays = useMemo(() => {
        const getStartOfWeek = (date: Date) => {
            const d = new Date(date);
            const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
            const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
            return new Date(d.setUTCDate(diff));
        };

        // Get the current date parts in the user's timezone to establish a correct "today"
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(currentDate);
        const year = parseInt(parts.find(p => p.type === 'year')?.value || '1970', 10);
        const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
        const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);

        // A date object representing midnight UTC on the user's current day
        const dateAtMidnightUTC = new Date(Date.UTC(year, month - 1, day));

        switch (viewMode) {
            case 'day':
                return [dateAtMidnightUTC];
            case 'work-week': {
                const start = getStartOfWeek(dateAtMidnightUTC);
                return Array.from({ length: 5 }).map((_, i) => {
                    const d = new Date(start);
                    d.setUTCDate(d.getUTCDate() + i);
                    return d;
                });
            }
            case '2-week': {
                const start = getStartOfWeek(dateAtMidnightUTC);
                return Array.from({ length: 14 }).map((_, i) => {
                    const d = new Date(start);
                    d.setUTCDate(d.getUTCDate() + i);
                    return d;
                });
            }
            case 'week':
            default: {
                const start = getStartOfWeek(dateAtMidnightUTC);
                return Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date(start);
                    d.setUTCDate(d.getUTCDate() + i);
                    return d;
                });
            }
        }
    }, [currentDate, viewMode, timezone]);

    const navigate = useCallback((direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            let increment = 0;
            if (viewMode === 'day') increment = 1;
            if (viewMode === 'work-week') increment = 7;
            if (viewMode === 'week') increment = 7;
            if (viewMode === '2-week') increment = 14;

            newDate.setDate(newDate.getDate() + (direction === 'next' ? increment : -increment));
            return newDate;
        });
    }, [viewMode, setCurrentDate]);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, [setCurrentDate]);
    
    const headerTitle = useMemo(() => {
        const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric', day: 'numeric', timeZone: timezone };
        if (viewMode === 'day') {
            return currentDate.toLocaleDateString('default', options);
        }
        const start = displayedDays[0];
        const end = displayedDays[displayedDays.length - 1];
        
        const startMonth = start.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        const endMonth = end.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        
        if (start.getUTCFullYear() !== end.getUTCFullYear()) {
            return `${startMonth} ${start.getUTCDate()}, ${start.getUTCFullYear()} - ${endMonth} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
        }
        if (startMonth !== endMonth) {
            return `${startMonth} ${start.getUTCDate()} - ${endMonth} ${end.getUTCDate()}, ${start.getUTCFullYear()}`;
        }
        return `${startMonth} ${start.getUTCDate()} - ${end.getUTCDate()}, ${start.getUTCFullYear()}`;

    }, [currentDate, viewMode, displayedDays, timezone]);

    return { displayedDays, navigate, goToToday, headerTitle };
};

const MeetingCard: React.FC<{
    meeting: Meeting;
    top: number;
    height: number;
    timezone?: string;
    onJoin: (meeting: Meeting) => void;
    onEdit: (meeting: Meeting) => void;
}> = ({ meeting, top, height, timezone, onJoin, onEdit }) => {
    const { getContactById } = useAppContext();

    const startTime = new Date(meeting.startTime);
    const organizer = getContactById(meeting.organizerId);

    const formatDateTime = (date: Date, tz?: string) => {
        return date.toLocaleString('default', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            timeZone: tz 
        });
    };

    return (
        <div 
            key={meeting.id}
            onClick={(e) => { e.stopPropagation(); onEdit(meeting); }}
            className={`absolute left-1 right-1 p-2 rounded-lg bg-btn-bg border-l-4 border-payroll-btn-text text-left z-10 overflow-hidden flex flex-col ${meeting.isCancelled ? 'opacity-50' : 'hover:bg-slate-600 cursor-pointer'}`}
            style={{ top, height }}
        >
            <div className="overflow-hidden">
                <p className={`font-semibold text-sm text-text-primary ${meeting.isCancelled ? 'line-through' : ''} flex items-center`}>
                    {meeting.recurrence !== RecurrenceFrequency.None && (
                        <RefreshIcon className="w-3 h-3 inline-block mr-1.5 text-text-secondary flex-shrink-0" />
                    )}
                    <span className="truncate">{meeting.title}</span>
                </p>
                
                {height > 25 && (
                    <p className={`text-xs mt-1 truncate ${meeting.isCancelled ? 'text-text-secondary line-through' : 'text-text-secondary'}`}>
                        {formatDateTime(startTime, timezone)}
                    </p>
                )}
                
                {height > 45 && organizer && (
                    <p className={`text-xs mt-1 text-text-secondary truncate ${meeting.isCancelled ? 'line-through' : ''}`}>
                        By: {organizer.name}
                    </p>
                )}
            </div>
        </div>
    );
};


interface CalendarViewProps {
    onScheduleMeeting: (meeting?: Meeting, date?: Date) => void;
    date: Date;
    setDate: (updater: Date | ((d: Date) => Date)) => void;
    onJoinMeeting: (meeting: Meeting) => void;
    onOpenChat: (chatId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onScheduleMeeting, date, setDate, onJoinMeeting, onOpenChat }) => {
    const { user, chats } = useAppContext();
    const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
    const { displayedDays, navigate, goToToday, headerTitle } = useAdvancedCalendar(date, setDate, viewMode, user.settings?.timezone);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
    const viewDropdownRef = useRef<HTMLDivElement>(null);
    
    const [timeIndicatorTop, setTimeIndicatorTop] = useState<number | null>(null);

    const meetings = useMemo(() => {
        const allMeetingsRaw = chats.flatMap(c => c.meetings || []);
        if (allMeetingsRaw.length === 0) return [];
    
        const rangeStart = displayedDays[0];
        const rangeEnd = new Date(displayedDays[displayedDays.length - 1]);
        rangeEnd.setUTCHours(23, 59, 59, 999);
    
        const occurrences: Meeting[] = [];
    
        allMeetingsRaw.forEach(meeting => {
            const originalStart = new Date(meeting.startTime);
            const recurrenceEnd = meeting.recurrenceEndDate ? new Date(meeting.recurrenceEndDate) : null;
            if (recurrenceEnd) {
                recurrenceEnd.setUTCHours(23, 59, 59, 999);
            }
    
            if (meeting.recurrence === RecurrenceFrequency.None) {
                if (originalStart >= rangeStart && originalStart <= rangeEnd) {
                    occurrences.push(meeting);
                }
                return;
            }
    
            const originalEnd = new Date(meeting.endTime);
            const duration = originalEnd.getTime() - originalStart.getTime();
            let current = new Date(originalStart);
            const originalDayOfUTCMonth = originalStart.getUTCDate();
    
            for (let i = 0; i < 730 && current <= rangeEnd; i++) {
                 if (recurrenceEnd && current > recurrenceEnd) {
                    break;
                }
                if (current >= rangeStart) {
                    const newStart = new Date(current);
                    const newEnd = new Date(newStart.getTime() + duration);
                    occurrences.push({
                        ...meeting,
                        id: `${meeting.id}-${current.getTime()}`,
                        startTime: newStart.toISOString(),
                        endTime: newEnd.toISOString(),
                    });
                }
    
                switch (meeting.recurrence) {
                    case RecurrenceFrequency.Daily:
                        current.setUTCDate(current.getUTCDate() + 1);
                        break;
                    case RecurrenceFrequency.Weekly:
                        current.setUTCDate(current.getUTCDate() + 7);
                        break;
                    case RecurrenceFrequency.Monthly:
                        current.setUTCMonth(current.getUTCMonth() + 1, originalDayOfUTCMonth);
                        break;
                }
            }
        });
    
        return occurrences;
    }, [chats, displayedDays]);
    
    const getDateString = useCallback((d: Date) => {
        return new Intl.DateTimeFormat('fr-CA', { // YYYY-MM-DD format
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'UTC', // We compare dates in UTC since our displayedDays are now UTC-based
        }).format(d);
    }, []);

    const isToday = useCallback((d: Date) => {
        const todayInUserTz = new Intl.DateTimeFormat('fr-CA', { timeZone: user.settings?.timezone }).format(new Date());
        const dayInUserTz = new Intl.DateTimeFormat('fr-CA', { timeZone: user.settings?.timezone }).format(d);
        return dayInUserTz === todayInUserTz;
    }, [user.settings?.timezone]);

    const showTimeIndicator = useMemo(() => {
        return displayedDays.some(isToday);
    }, [displayedDays, isToday]);
    
    const updateIndicator = useCallback(() => {
        if (showTimeIndicator) {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: user.settings?.timezone,
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
            });
            const parts = formatter.formatToParts(now);
            const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
            const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

            const topInMinutes = (hour * 60) + minute;
            setTimeIndicatorTop(topInMinutes);
        } else {
            setTimeIndicatorTop(null);
        }
    }, [showTimeIndicator, user.settings?.timezone]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
                setIsViewDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
     useEffect(() => {
        // Scroll to current time only when the visible date range changes to include today.
        const isTodayVisible = displayedDays.some(isToday);
        if (containerRef.current && isTodayVisible && timeIndicatorTop !== null) {
            const scrollPosition = timeIndicatorTop * PIXELS_PER_MINUTE;
            const timeoutId = setTimeout(() => {
                if(containerRef.current) {
                    containerRef.current.scrollTop = scrollPosition - (containerRef.current.clientHeight / 3);
                }
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [isToday, displayedDays, timeIndicatorTop]);

    useEffect(() => {
        updateIndicator();
        const interval = setInterval(updateIndicator, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [updateIndicator]);
    
    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dayIndex = Math.floor(x / (rect.width / displayedDays.length));
        const minutes = y / PIXELS_PER_MINUTE;

        const clickedDate = new Date(displayedDays[dayIndex]);
        clickedDate.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

        onScheduleMeeting(undefined, clickedDate);
    };

    const hourLabels = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => {
            if (i === 0) return '12 AM';
            if (i < 12) return `${i} AM`;
            if (i === 12) return '12 PM';
            return `${i - 12} PM`;
        });
    }, []);
    
    const getMeetingPosition = useCallback((meeting: Meeting, day: Date) => {
        const userTimezone = user.settings?.timezone;

        const getMinutesFromMidnight = (d: Date): number => {
            const formatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: userTimezone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
            });
            const parts = formatter.formatToParts(d);
            const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
            const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
            return hour * 60 + minute;
        };

        const meetingStart = new Date(meeting.startTime);
        const meetingEnd = new Date(meeting.endTime);
        
        const dayString = getDateString(day);
        const startDayString = getDateString(meetingStart);
        const endDayString = getDateString(meetingEnd);
        
        // Don't render if meeting is not on this day at all
        if (dayString < startDayString || dayString > endDayString) {
            return { top: 0, height: 0 };
        }
        
        const top = (dayString === startDayString) ? getMinutesFromMidnight(meetingStart) : 0;
        const endMinutes = (dayString === endDayString) ? getMinutesFromMidnight(meetingEnd) : 24 * 60;

        const height = endMinutes - top;

        return { top, height: Math.max(0, height) };
    }, [user.settings?.timezone, getDateString]);

    const timeIndicatorDayIndex = useMemo(() => {
        return displayedDays.findIndex(isToday);
    }, [displayedDays, isToday]);

    const viewOptions: { key: CalendarViewMode, label: string }[] = [
        { key: 'day', label: 'Day' },
        { key: 'work-week', label: 'Work week' },
        { key: 'week', label: 'Week' },
        { key: '2-week', label: 'Bi-Weekly' }
    ];

    return (
        <div className="flex flex-col h-full bg-primary text-text-primary">
            <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0 bg-primary flex-wrap gap-2 md:gap-4">
                <div className="flex items-center space-x-2 md:space-x-4">
                    <h2 className="text-xl font-bold w-48 truncate">{headerTitle}</h2>
                    <button onClick={() => navigate('prev')} className="p-2 rounded-full hover:bg-slate-700"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => navigate('next')} className="p-2 rounded-full hover:bg-slate-700"><ChevronRightIcon className="w-5 h-5"/></button>
                    <button onClick={goToToday} className="px-4 py-1.5 border border-slate-500 rounded-md text-sm font-semibold hover:bg-slate-700">Today</button>
                </div>
                 <div className="flex items-center space-x-2">
                    <div ref={viewDropdownRef} className="relative z-30">
                        <button onClick={() => setIsViewDropdownOpen(p => !p)} className="flex items-center px-4 py-2 bg-slate-700 rounded-md text-sm font-semibold hover:bg-slate-600">
                           <span>{viewOptions.find(v => v.key === viewMode)?.label}</span>
                           <ChevronDownIcon className="w-4 h-4 ml-2"/>
                        </button>
                        {isViewDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-primary rounded-lg shadow-2xl border border-slate-600 py-1">
                                {viewOptions.map(opt => (
                                    <button key={opt.key} onClick={() => { setViewMode(opt.key); setIsViewDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-secondary text-sm">
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => onScheduleMeeting()} className="flex items-center px-4 py-2 bg-accent rounded-md text-sm font-semibold text-white hover:bg-highlight">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        <span>New Meeting</span>
                    </button>
                </div>
            </header>
             <div ref={containerRef} className="flex-1 overflow-auto">
                 <div className="sticky top-0 z-20 flex bg-primary flex-shrink-0 shadow-lg">
                    <div className="w-16 flex-shrink-0"></div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${displayedDays.length}, minmax(0, 1fr))` }}>
                        {displayedDays.map(day => (
                            <div key={day.toISOString()} className={`text-center py-2 border-l border-slate-700`}>
                                 <p className={`text-xs uppercase font-semibold ${isToday(day) ? 'text-highlight' : 'text-text-secondary'}`}>
                                    {day.toLocaleDateString('default', { weekday: 'short', timeZone: 'UTC' })}
                                </p>
                                <p className={`text-2xl mt-1 ${isToday(day) ? 'font-extrabold text-white bg-highlight rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'font-bold'}`}>
                                    <span>
                                        {day.getUTCDate()}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative flex bg-secondary" style={{ minHeight: '100%' }}>
                    {/* Hour Labels */}
                    <div className="w-16 flex-shrink-0 text-right pr-2">
                         {hourLabels.map((label, i) => (
                            <div key={label} style={{ height: `${HOUR_HEIGHT}px` }} className="text-xs text-text-secondary relative">
                               <span className={`absolute -top-2.5 right-2 ${i === 0 ? 'top-0' : ''}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                     <div className="flex-1 grid grid-cols-1" style={{ gridTemplateRows: `repeat(24, ${HOUR_HEIGHT}px)` }}>
                        {/* Hour lines */}
                        {Array.from({ length: 24 }).map((_, i) => (
                             <div key={i} className="border-t border-slate-600"></div>
                        ))}
                        {/* Day columns wrapper */}
                        <div className="absolute top-0 left-16 right-0 bottom-0 flex">
                            {displayedDays.map((day) => (
                                <div key={day.toISOString()} className={`flex-1 border-l border-slate-600 ${isToday(day) ? 'bg-highlight/10' : ''}`}></div>
                            ))}
                        </div>
                         {/* Today's time indicator */}
                        {timeIndicatorTop !== null && timeIndicatorDayIndex !== -1 && (
                             <div 
                                className="absolute left-16 right-0 h-px bg-highlight z-20" 
                                style={{ top: timeIndicatorTop * PIXELS_PER_MINUTE, transition: 'top 1s linear' }}
                            >
                                <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-highlight rounded-full"></div>
                            </div>
                        )}
                        {/* Meetings grid */}
                         <div ref={gridRef} onClick={handleGridClick} className="absolute top-0 left-16 right-0 bottom-0 flex">
                            {displayedDays.map((day) => {
                                const dayStart = day;
                                const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);

                                const meetingsForDay = (meetings || []).filter(m => {
                                    const meetingStart = new Date(m.startTime);
                                    const meetingEnd = new Date(m.endTime);
                                    return meetingStart < dayEnd && meetingEnd > dayStart;
                                });

                                return (
                                    <div key={day.toISOString()} className="flex-1 relative">
                                        {meetingsForDay.map(meeting => {
                                            const { top, height } = getMeetingPosition(meeting, day);
                                            return (
                                                <MeetingCard 
                                                    key={meeting.id}
                                                    meeting={meeting}
                                                    top={top * PIXELS_PER_MINUTE}
                                                    height={height * PIXELS_PER_MINUTE}
                                                    timezone={user.settings?.timezone}
                                                    onJoin={onJoinMeeting}
                                                    onEdit={onScheduleMeeting}
                                                />
                                            )
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};