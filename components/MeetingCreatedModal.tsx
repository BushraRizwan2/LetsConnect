

import React, { useState } from 'react';
import { Meeting, RecurrenceFrequency } from '../types';
import { useAppContext } from '../context/AppContext';
import { XIcon, ClipboardDocumentIcon, CheckIcon } from './icons';

interface MeetingCreatedModalProps {
    meeting: Meeting;
    onClose: () => void;
}

export const MeetingCreatedModal: React.FC<MeetingCreatedModalProps> = ({ meeting, onClose }) => {
    const { user, copyToClipboard } = useAppContext();
    const [copied, setCopied] = useState(false);

    const organizerName = user.name;
    const meetingUrl = `https://lets.connect/meet/${meeting.id}`;

    const formatRecurrence = (freq: RecurrenceFrequency, date: Date, tz?: string) => {
        if (freq === RecurrenceFrequency.None) return '';
        const dayName = date.toLocaleDateString('default', { weekday: 'long', timeZone: tz });
        const shortDate = date.toLocaleDateString('default', { month: '2-digit', day: '2-digit', timeZone: tz });
        switch(freq) {
            case RecurrenceFrequency.Daily: return `Occurs every day starting ${shortDate}`;
            case RecurrenceFrequency.Weekly: return `Occurs every ${dayName} starting ${shortDate}`;
            case RecurrenceFrequency.Monthly: return `Occurs monthly on day ${date.getDate()} starting ${shortDate}`;
            default: return '';
        }
    };
    
    const formatTimeWithTimezone = (date: Date, tz?: string) => {
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: tz
        };
        const tzOptions: Intl.DateTimeFormatOptions = {
            timeZoneName: 'short',
            timeZone: tz
        }

        const timeStr = date.toLocaleTimeString('en-US', timeOptions);
        const tzStr = new Intl.DateTimeFormat('en-US', tzOptions).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
        
        return { timeStr, tzStr };
    };

    const startDate = new Date(meeting.startTime);
    const endDate = new Date(meeting.endTime);
    
    const { timeStr: startTimeStr, tzStr } = formatTimeWithTimezone(startDate, user.settings?.timezone);
    const { timeStr: endTimeStr } = formatTimeWithTimezone(endDate, user.settings?.timezone);
    const timeRange = `${startTimeStr} - ${endTimeStr} (${tzStr})`;

    const dateString = startDate.toLocaleDateString('default', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        timeZone: user.settings?.timezone 
    });

    const recurrenceString = formatRecurrence(meeting.recurrence, startDate, user.settings?.timezone);

    const invitationText = `${organizerName} invited you to a Let's Connect Meeting${meeting.recurrence !== RecurrenceFrequency.None ? ' series' : ''}:

${meeting.title}
${dateString}
${timeRange}
${recurrenceString ? `${recurrenceString}\n` : ''}
Meeting link: ${meetingUrl}
`;

    const handleCopy = () => {
        copyToClipboard(invitationText.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute top-4 right-4 p-1 text-text-secondary hover:text-white z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Meeting created</h2>
                    <p className="text-text-secondary">Share the meeting invitation with others</p>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Invitation preview:</label>
                        <div className="bg-secondary p-4 rounded-lg border border-slate-600 space-y-3 text-sm">
                            <p><span className="font-bold">{organizerName}</span> invited you to a Let's Connect Meeting{meeting.recurrence !== RecurrenceFrequency.None ? ' series' : ''}:</p>
                            <div className="pl-4 border-l-2 border-slate-500 space-y-3">
                                <p className="font-bold text-base text-text-primary">{meeting.title}</p>
                                <div>
                                    <p>{dateString}</p>
                                    <p>{timeRange}</p>
                                    {recurrenceString && <p className="text-text-secondary">{recurrenceString}</p>}
                                </div>
                                <p>Meeting link: <a href="#" onClick={(e) => e.preventDefault()} className="text-highlight hover:underline">Join Let's Connect Meeting</a></p>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end pt-2">
                        <button onClick={handleCopy} className="flex items-center justify-center px-4 py-2 bg-accent hover:bg-highlight text-white font-semibold rounded-lg transition-colors">
                            {copied ? <CheckIcon className="w-5 h-5 mr-2" /> : <ClipboardDocumentIcon className="w-5 h-5 mr-2" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};