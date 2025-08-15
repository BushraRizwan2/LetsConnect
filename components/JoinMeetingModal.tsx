
import React, { useState } from 'react';
import { XIcon, HashtagIcon } from './icons';

interface JoinMeetingModalProps {
    onClose: () => void;
    onJoin: (meetingId: string) => void;
}

export const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({ onClose, onJoin }) => {
    const [meetingId, setMeetingId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!meetingId.trim()) {
            setError('Please enter a meeting ID.');
            return;
        }
        // The actual check if meeting exists will be in the parent component
        onJoin(meetingId.trim());
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-text-secondary hover:text-white z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center">
                        <HashtagIcon className="w-12 h-12 text-highlight mx-auto mb-2" />
                        <h3 className="text-xl font-bold">Join with an ID</h3>
                        <p className="text-sm text-text-secondary">Enter the ID of the meeting you want to join.</p>
                    </div>
                    {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg text-center">{error}</p>}
                    <div>
                        <label htmlFor="meeting-id" className="block text-sm font-medium text-text-secondary mb-1">Meeting ID</label>
                        <input
                            id="meeting-id"
                            type="text"
                            value={meetingId}
                            onChange={e => {
                                setMeetingId(e.target.value);
                                setError('');
                            }}
                            placeholder="e.g., meeting-12345"
                            className="w-full px-4 py-3 bg-primary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight transition-colors duration-200">
                        Join Meeting
                    </button>
                </form>
            </div>
        </div>
    );
};
