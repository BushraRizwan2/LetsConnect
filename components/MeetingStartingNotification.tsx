
import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { VideoCameraIcon, UsersIcon, XIcon } from './icons';

interface MeetingStartingNotificationProps {
    meeting: Meeting;
    onJoin: (meeting: Meeting) => void;
    onDismiss: (meetingId: string) => void;
}

export const MeetingStartingNotification: React.FC<MeetingStartingNotificationProps> = ({ meeting, onJoin, onDismiss }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const calculateElapsed = () => {
            const now = new Date().getTime();
            const start = new Date(meeting.startTime).getTime();
            setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
        };

        calculateElapsed(); // Initial calculation
        const interval = setInterval(calculateElapsed, 1000);
        return () => clearInterval(interval);
    }, [meeting.startTime]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    
    // For this demo, let's assume a random number of people have joined.
    const joinedCount = Math.min(meeting.participants.length, Math.floor(Math.random() * meeting.participants.length / 2) + 1);

    return (
        <div className="fixed bottom-5 right-5 w-full max-w-sm bg-secondary rounded-xl shadow-2xl p-4 border border-slate-600 z-[80] animate-slide-in-right">
            <div className="flex items-start">
                <div className="w-10 h-10 bg-highlight rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <VideoCameraIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-primary truncate">{meeting.title}</h4>
                    <p className="text-sm text-text-secondary">Meeting has started</p>
                    <div className="flex items-center space-x-4 text-xs text-text-secondary mt-2">
                        <div className="flex items-center space-x-1">
                            <UsersIcon className="w-4 h-4" />
                            <span>{joinedCount} joined</span>
                        </div>
                        <span>•</span>
                        <span>{formatDuration(elapsedSeconds)} ago</span>
                    </div>
                </div>
                 <button onClick={() => onDismiss(meeting.id)} className="p-1 -mr-1 -mt-1 text-text-secondary hover:text-white flex-shrink-0">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="mt-4 flex space-x-3">
                <button 
                    onClick={() => onDismiss(meeting.id)} 
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary rounded-lg border border-slate-600 hover:bg-slate-700"
                >
                    Dismiss
                </button>
                <button 
                    onClick={() => onJoin(meeting)} 
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-highlight"
                >
                    Join Meeting
                </button>
            </div>
        </div>
    );
};
