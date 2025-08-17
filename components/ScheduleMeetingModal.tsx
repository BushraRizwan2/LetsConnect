

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Meeting, RecurrenceFrequency, MeetingParticipant, User, UserStatus } from '../types';
import { XIcon, TrashIcon, VideoCameraIcon, LocationMarkerIcon, ForwardIcon, LinkIcon, ClipboardDocumentIcon, ChatBubbleLeftRightIcon, UserCircleIcon, CheckIcon, UserPlusIcon } from './icons';
import { timezones } from '../data/timezones';
import { PeoplePickerModal } from './PeoplePickerModal';

interface ScheduleMeetingModalProps {
    meeting?: Meeting;
    initialDate?: Date;
    onClose: (meeting: Meeting | null, isNew: boolean) => void;
    onJoin: (meeting: Meeting) => void;
    onOpenChat?: (chatId: string) => void;
}

const ActionButton: React.FC<{icon: React.FC<{className?: string}>, label: string, onClick: () => void, disabled?: boolean}> = ({icon: Icon, label, onClick, disabled}) => (
    <button onClick={onClick} disabled={disabled} className="flex items-center w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed">
        <Icon className="w-6 h-6 mr-3 text-text-secondary"/>
        <span className="font-semibold">{label}</span>
    </button>
);


const MeetingDetailsView: React.FC<{
    meeting: Meeting;
    onEdit: () => void;
    onJoin: () => void;
    onClose: () => void;
    onOpenAddPeoplePicker: (chatId: string, currentParticipants: User[]) => void;
    onOpenChat?: (chatId: string) => void;
}> = ({ meeting, onEdit, onJoin, onClose, onOpenAddPeoplePicker, onOpenChat }) => {
    const { user, getContactById, copyToClipboard, cancelMeeting } = useAppContext();
    const [copied, setCopied] = useState(false);
    const organizer = getContactById(meeting.organizerId);
    const isOrganizer = user.id === meeting.organizerId;
    const isCancelled = !!meeting.isCancelled;
    
    const meetingUrl = `https://teams.live.com/meet/${meeting.id}?${new Date().getTime()}`;

    const handleCopyLink = () => {
        copyToClipboard(meetingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    
    const handleOpenChat = () => {
        if (onOpenChat) {
            onOpenChat(meeting.chatId);
        }
    }
    
    const handleAddParticipantClick = () => {
        const currentParticipants = meeting.participants.map(p => getContactById(p.email) || ({
            id: p.email,
            name: p.name || p.email.split('@')[0],
            email: p.email,
            status: UserStatus.Offline,
            avatar: ''
        })).filter((u): u is User => !!u);
        onOpenAddPeoplePicker(meeting.chatId, currentParticipants);
    };

    const handleCancelMeeting = () => {
        if (window.confirm('Are you sure you want to cancel this meeting? This will notify participants and cannot be undone.')) {
            cancelMeeting(meeting.id);
            onClose();
        }
    };

    const formatMeetingTime = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: user.settings?.timezone
        };
        const endOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: user.settings?.timezone
        };
        const startStr = startDate.toLocaleString([], options);
        const endStr = endDate.toLocaleTimeString([], endOptions);

        return `${startStr} – ${endStr}`;
    };

    const DetailRow: React.FC<{icon: React.FC<{className?: string}>, children: React.ReactNode, action?: React.ReactNode}> = ({ icon: Icon, children, action }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
                <Icon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                <div className="text-sm text-text-primary truncate">
                    {children}
                </div>
            </div>
            {action && (
                <div className="flex-shrink-0 ml-2">
                    {action}
                </div>
            )}
        </div>
    );
    
    return (
        <div className="relative flex flex-col bg-primary">
            {isCancelled && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-red-800 text-white font-bold py-2 px-6 rounded-lg transform -rotate-12 shadow-lg">
                        CANCELLED
                    </div>
                </div>
            )}
            <div className="p-4 flex justify-between items-center border-b border-slate-700">
                <p className="text-sm font-semibold text-text-secondary">Meeting Details</p>
                <div className="flex items-center space-x-2">
                    <button onClick={onClose} className="p-1 text-text-secondary hover:text-white" title="Close">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className={`p-4 space-y-4 border-b border-slate-700 ${isCancelled ? 'opacity-50' : ''}`}>
                <h2 className="text-2xl font-bold">{meeting.title}</h2>
                <p className="text-sm text-text-secondary">{formatMeetingTime(meeting.startTime, meeting.endTime)}</p>
                <div className="flex space-x-2">
                    <button onClick={onJoin} disabled={isCancelled} className="px-6 py-2 text-sm font-semibold bg-accent text-white rounded-md hover:bg-highlight disabled:bg-slate-500 disabled:cursor-not-allowed">Join</button>
                    {isOrganizer && (
                         <button onClick={onEdit} disabled={isCancelled} className="px-4 py-2 text-sm font-semibold bg-slate-700 border border-slate-500 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Edit</button>
                    )}
                </div>
            </div>
            
            <div className={`p-4 space-y-3 ${isCancelled ? 'opacity-50' : ''}`}>
                <DetailRow icon={LocationMarkerIcon}>
                    <p>{meeting.location || 'Virtual (by default)'}</p>
                </DetailRow>
                <DetailRow icon={LinkIcon} action={
                    <button onClick={handleCopyLink} disabled={isCancelled} className="p-1 text-text-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title="Copy link">
                        {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                    </button>
                }>
                    <p className="truncate">{meetingUrl}</p>
                </DetailRow>
                {organizer && (
                    <DetailRow icon={UserCircleIcon}>
                       <p> <span className="text-text-secondary">Organizer:</span> {organizer.name}</p>
                    </DetailRow>
                )}
            </div>

            <div className="p-4 space-y-2 border-t border-slate-700">
                <ActionButton icon={ChatBubbleLeftRightIcon} label="Chat with participants" onClick={handleOpenChat} disabled={isCancelled}/>
                <ActionButton icon={UserPlusIcon} label="Add participant" onClick={handleAddParticipantClick} disabled={isCancelled}/>
                {isOrganizer && (
                    <div className="text-center pt-2">
                        <button onClick={handleCancelMeeting} disabled={isCancelled} className="inline-flex items-center p-2 space-x-2 text-sm text-red-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            <TrashIcon className="w-5 h-5"/>
                            <span>Cancel</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ meeting, initialDate, onClose, onJoin, onOpenChat }) => {
    const { user, scheduleMeeting, updateMeeting, cancelMeeting } = useAppContext();
    const isEditing = !!meeting;
    const [view, setView] = useState<'details' | 'form'>(isEditing ? 'details' : 'form');
    const isOrganizer = isEditing ? user.id === meeting.organizerId : true;

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [title, setTitle] = useState(meeting?.title || '');
    
    const toLocalISOString = (date: Date): string => {
        const tzoffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    };

    const [startTime, setStartTime] = useState(meeting ? toLocalISOString(new Date(meeting.startTime)) : toLocalISOString(initialDate || new Date()));
    const [endTime, setEndTime] = useState(meeting ? toLocalISOString(new Date(meeting.endTime)) : toLocalISOString(new Date((initialDate || new Date()).getTime() + 60 * 60 * 1000)));
    const [participants, setParticipants] = useState<MeetingParticipant[]>(meeting?.participants || [{ email: user.email, name: user.name, status: 'accepted' }]);
    const [description, setDescription] = useState(meeting?.description || '');
    const [location, setLocation] = useState(meeting?.location || '');
    const [recurrence, setRecurrence] = useState(meeting?.recurrence || RecurrenceFrequency.None);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState(meeting?.recurrenceEndDate ? meeting.recurrenceEndDate.split('T')[0] : '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing && meeting) {
            setView('details');
            setTitle(meeting.title);
            setStartTime(toLocalISOString(new Date(meeting.startTime)));
            setEndTime(toLocalISOString(new Date(meeting.endTime)));
            setParticipants(meeting.participants);
            setDescription(meeting.description || '');
            setLocation(meeting.location || '');
            setRecurrence(meeting.recurrence);
            setRecurrenceEndDate(meeting.recurrenceEndDate ? meeting.recurrenceEndDate.split('T')[0] : '');
        } else {
            setView('form');
             if (initialDate) {
                const start = initialDate;
                const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
                setStartTime(toLocalISOString(start));
                setEndTime(toLocalISOString(end));
            }
        }
    }, [meeting, initialDate, isEditing, user.settings?.timezone]);
    
    const handleCancelMeeting = () => {
        if (isEditing && meeting) {
            if (window.confirm('Are you sure you want to cancel this meeting? This will notify participants and cannot be undone.')) {
                cancelMeeting(meeting.id);
                onClose(null, false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim() || participants.length === 0 || !startTime || !endTime) {
            setError('Title, participants, and start/end times are required.');
            return;
        }
        if (new Date(startTime) >= new Date(endTime)) {
            setError('End time must be after start time.');
            return;
        }
        
        const meetingData = {
            title,
            description,
            location,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            participants,
            recurrence,
            recurrenceEndDate: recurrence !== RecurrenceFrequency.None && recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59Z`).toISOString() : undefined,
        };

        if (isEditing && meeting) {
            const updatedMeeting = updateMeeting({ meetingId: meeting.id, updatedDetails: meetingData });
            onClose(updatedMeeting || null, false);
        } else {
            const newMeeting = scheduleMeeting(meetingData);
            onClose(newMeeting, true);
        }
    };

    if (isEditing && view === 'details' && meeting) {
        return (
             <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => onClose(null, false)}>
                <div className="bg-primary rounded-xl shadow-2xl w-full max-w-sm relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <MeetingDetailsView 
                        meeting={meeting} 
                        onEdit={() => setView('form')} 
                        onJoin={() => onJoin(meeting)}
                        onClose={() => onClose(null, false)}
                        onOpenAddPeoplePicker={() => {}} // This should be handled by Layout now
                        onOpenChat={onOpenChat}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => onClose(null, false)}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg p-6 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {isPickerOpen && (
                    <PeoplePickerModal
                        isOpen={isPickerOpen}
                        onClose={() => setIsPickerOpen(false)}
                        excludedEmails={participants.map(p => p.email)}
                        onAdd={(newlyAdded) => {
                            const newParticipants = newlyAdded.map(email => ({ email, status: 'pending' as const }));
                            setParticipants(current => [...current, ...newParticipants]);
                            setIsPickerOpen(false);
                        }}
                    />
                )}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{isEditing ? 'Edit Meeting' : 'Schedule a Meeting'}</h3>
                     <button onClick={() => onClose(null, false)} className="p-1 text-text-secondary hover:text-white z-10">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg text-center mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Meeting Title"
                        className="w-full px-4 py-3 text-lg font-semibold bg-primary border-b-2 border-slate-600 focus:border-highlight text-text-primary placeholder-text-secondary focus:outline-none transition-colors"
                        required
                    />

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
                                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 bg-primary border border-slate-600 rounded-lg text-text-primary [color-scheme:dark]" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
                                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 bg-primary border border-slate-600 rounded-lg text-text-primary [color-scheme:dark]" />
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Participants ({participants.length})</label>
                            <div className="p-2 bg-primary border border-slate-600 rounded-lg flex flex-wrap gap-2">
                                {participants.map(p => (
                                    <div key={p.email} className="bg-slate-700 rounded-full flex items-center pl-3 pr-1 py-1 text-sm font-medium">
                                        <span>{p.name || p.email}</span>
                                        {p.email !== user.email && (
                                            <button type="button" onClick={() => setParticipants(current => current.filter(cp => cp.email !== p.email))} className="ml-2 text-text-secondary hover:text-white">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setIsPickerOpen(true)} className="text-sm font-semibold text-highlight hover:underline p-1">
                                    + Add
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Location (Optional)</label>
                            <div className="relative">
                                <LocationMarkerIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                <input 
                                    type="text" 
                                    value={location} 
                                    onChange={e => setLocation(e.target.value)} 
                                    placeholder="Add a location or link"
                                    className="w-full p-2 pl-10 bg-primary border border-slate-600 rounded-lg"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Recurrence</label>
                                <select value={recurrence} onChange={e => setRecurrence(e.target.value as RecurrenceFrequency)} className="w-full p-2 bg-primary border border-slate-600 rounded-lg">
                                    {Object.values(RecurrenceFrequency).map(freq => <option key={freq} value={freq}>{freq}</option>)}
                                </select>
                            </div>
                            {recurrence !== RecurrenceFrequency.None && (
                                <div>
                                    <label htmlFor="recurrence-end" className="block text-sm font-medium text-text-secondary mb-1">Ends on</label>
                                    <input
                                        id="recurrence-end"
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={e => setRecurrenceEndDate(e.target.value)}
                                        className="w-full p-2 bg-primary border border-slate-600 rounded-lg text-text-primary [color-scheme:dark]"
                                        min={startTime.split('T')[0]}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a description for your meeting"
                                className="w-full p-2 bg-primary border border-slate-600 rounded-lg h-24 resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-auto pt-4 flex-shrink-0 flex items-center justify-end space-x-2">
                         {isEditing && (
                            <button type="button" onClick={handleCancelMeeting} className="px-4 py-2 text-sm font-semibold text-red-500">
                                Cancel Meeting
                            </button>
                        )}
                        <button type="submit" className="px-6 py-2 text-sm font-semibold bg-accent text-white rounded-md hover:bg-highlight">
                            {isEditing ? 'Update' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
