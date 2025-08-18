
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CallState, User, Message, MeetingParticipant, UserStatus, BackgroundEffect, TranscriptInfo } from '../types';
import { MeetingParticipantTile } from './MeetingParticipantTile';
import { useAppContext } from '../context/AppContext';
import { generateMeetingNotes, translateText } from '../services/geminiService';
import { virtualBackgrounds } from '../data/virtualBackgrounds';
import { languages } from '../data/languages';
import MessageInputBar from './MessageInputBar';
import { TranscriptViewerModal } from './TranscriptViewerModal';
import { MediaViewer } from './MediaViewer';
import { 
    ChatBubbleLeftRightIcon, HandRaisedIcon, FaceSmileIcon,
    ClipboardDocumentListIcon, VideoCameraIcon, 
    VideoCameraSlashIcon, MicrophoneOnIcon, MicrophoneOffIcon, ArrowUpTrayIcon, SendIcon, 
    XIcon, UserPlusIcon, UsersIcon, MagnifyingGlassIcon,
    SparklesIcon, RecordCircleIcon, GlobeAltIcon, PaperclipIcon, PhotoIcon, DocumentTextIcon, UserCircleIcon, LocationMarkerIcon, ChevronLeftIcon, ChevronRightIcon,
    CameraIcon, ChevronDownIcon, PlayIcon, PauseIcon, ClipboardDocumentListIcon as TranscriptIcon, DotsHorizontalIcon
} from './icons';

interface MeetingScreenProps {
    callState: CallState;
    onEndCall: (durationInSeconds: number) => void;
    onOpenAddPeoplePicker: (chatId: string, participants: User[]) => void;
    onOpenFilePicker: (chatId: string, accept?: string) => void;
    onOpenCameraPicker: (chatId: string) => void;
    onOpenForwardPicker: (sourceChatId: string, messageIds: string[]) => void;
}

type TranscriptEntry = {
    speakerId: string;
    speakerName: string;
    text: string;
    translatedText?: string;
    timestamp: string;
};

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

const getPhotoUrlFromMessage = (message: Message): string => {
    if (message.fileInfo?.type.startsWith('image/')) return message.fileInfo.url;
    if (message.type === 'image') return message.content;
    return '';
};

const isImageMessage = (msg: Message): boolean => {
    if (!msg) return false;
    return msg.type === 'image' || (msg.type === 'file' && !!msg.fileInfo?.type.startsWith('image/'));
};

const MarkdownText: React.FC<{ text: string }> = React.memo(({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
});

// --- START: In-Meeting Chat Renderer Components ---

const MeetingChatBubble: React.FC<{ msg: Message, onViewTranscript: (info: TranscriptInfo) => void, onImageClick: (message: Message) => void }> = React.memo(({ msg, onViewTranscript, onImageClick }) => {
    const { user, getContactById } = useAppContext();
    const sender = getContactById(msg.senderId);
    const isSelf = msg.senderId === user.id;

    const renderContent = () => {
        switch (msg.type) {
            case 'text':
                return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
            case 'image':
            case 'file':
                const photoUrl = getPhotoUrlFromMessage(msg);
                if (photoUrl) {
                    return <img src={photoUrl} alt="Shared content" className="rounded-lg max-w-full max-h-48 object-contain cursor-pointer" onClick={() => onImageClick(msg)} />;
                }
                 if (msg.fileInfo?.type.startsWith('video/')) {
                    return <video controls src={msg.fileInfo.url} className="rounded-lg max-w-full max-h-48" />;
                }
                if (msg.fileInfo) {
                    return <div className="flex items-center space-x-2 bg-slate-800/50 p-2 rounded-md"><DocumentTextIcon className="w-5 h-5 flex-shrink-0" /> <span className="text-sm truncate">{msg.fileInfo.name}</span></div>;
                }
                return null;
            case 'transcript':
                return <button onClick={() => msg.transcriptInfo && onViewTranscript(msg.transcriptInfo)} className="flex items-center space-x-2 bg-slate-800/50 p-2 rounded-md w-full hover:bg-slate-700/50"><TranscriptIcon className="w-5 h-5 flex-shrink-0" /> <span className="text-sm truncate">View Meeting Transcript</span></button>;
            default:
                return <p className="text-sm italic text-text-secondary">Unsupported message type</p>;
        }
    };

    return (
        <div className={`flex items-start gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
             {!isSelf && sender && <img src={getAvatarUrl(sender.name, sender.avatar)} alt={sender.name} className="w-8 h-8 rounded-full" />}
            <div className={`p-3 rounded-lg max-w-xs ${isSelf ? 'bg-accent text-white' : 'bg-secondary'}`}>
                {!isSelf && <p className="font-bold text-sm text-highlight">{sender?.name}</p>}
                {renderContent()}
                <p className="text-xs opacity-70 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
    );
});

const MeetingImageGrid: React.FC<{ messages: Message[], onImageClick: (message: Message) => void }> = React.memo(({ messages, onImageClick }) => {
    const { user, getContactById } = useAppContext();
    const firstMsg = messages[0];
    const sender = getContactById(firstMsg.senderId);
    const isSelf = firstMsg.senderId === user.id;

    const gridClasses: Record<number, string> = {
        2: "grid-cols-2 grid-rows-1",
        3: "grid-cols-2 grid-rows-2",
        4: "grid-cols-2 grid-rows-2",
    };
    
    const gridClass = gridClasses[messages.length] || "grid-cols-2 grid-rows-2";

    return (
        <div className={`flex items-start gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
            {!isSelf && sender && <img src={getAvatarUrl(sender.name, sender.avatar)} alt={sender.name} className="w-8 h-8 rounded-full self-end" />}
            <div className="max-w-xs">
                {!isSelf && <p className="font-bold text-sm text-highlight mb-1">{sender?.name}</p>}
                <div className={`grid gap-1 bg-secondary p-1 rounded-lg ${gridClass}`}>
                    {messages.slice(0, 4).map((msg, index) => {
                         const isLast = index === 3 && messages.length > 4;
                         return (
                            <div
                                key={msg.id}
                                onClick={() => onImageClick(msg)}
                                className={`relative aspect-square rounded overflow-hidden cursor-pointer group 
                                    ${messages.length === 3 && index === 0 ? 'row-span-2' : ''}
                                `}
                            >
                                <img src={getPhotoUrlFromMessage(msg)} alt="grouped image" className="w-full h-full object-cover" />
                                 {isLast && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <p className="text-white text-xl font-bold">+{messages.length - 3}</p>
                                    </div>
                                )}
                            </div>
                         );
                    })}
                </div>
                 <p className="text-xs opacity-70 text-right mt-1">{new Date(messages[messages.length-1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
    );
});

const MeetingChatPanel: React.FC<{ 
    chatId: string, 
    onClose: () => void, 
    onOpenFilePicker: (chatId: string, accept?: string) => void,
    onOpenCameraPicker: (chatId: string) => void,
    onViewTranscript: (info: TranscriptInfo) => void;
    onImageClick: (message: Message) => void;
}> = React.memo(({ chatId, onClose, onOpenFilePicker, onOpenCameraPicker, onViewTranscript, onImageClick }) => {
    const { chats, user } = useAppContext();
    const chat = chats.find(c => c.id === chatId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const shouldScrollRef = useRef(true);

    // Effect to track scroll position
    useEffect(() => {
        const scrollEl = scrollContainerRef.current;
        if (!scrollEl) return;

        const handleScroll = () => {
            const threshold = 5;
            const atBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < threshold;
            shouldScrollRef.current = atBottom;
        };

        scrollEl.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollEl.removeEventListener('scroll', handleScroll);
    }, []);

    // Effect to scroll on new messages
    useEffect(() => {
        if (shouldScrollRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [chat?.messages.length]);
    
    // Effect to scroll when panel is opened (chatId is a good proxy for this)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        shouldScrollRef.current = true;
    }, [chatId]);
    
    const processedMessages = useMemo(() => {
        if (!chat) return [];
        const filtered = chat.messages.filter(msg => !(msg.deletedFor || []).includes(user.id) && !msg.isDeleted);
        const renderableItems: (Message | { type: 'image_grid'; id: string; messages: Message[] })[] = [];
        let i = 0;
        while (i < filtered.length) {
          const currentMsg = filtered[i];
          if (isImageMessage(currentMsg)) {
            const imageGroup: Message[] = [];
            const senderId = currentMsg.senderId;
            const timeDiff = 2 * 60 * 1000; // 2 minutes
            let j = i;
            let lastTimestamp = new Date(currentMsg.timestamp).getTime();

            while (j < filtered.length && isImageMessage(filtered[j]) && filtered[j].senderId === senderId && (new Date(filtered[j].timestamp).getTime() - lastTimestamp) < timeDiff) {
              imageGroup.push(filtered[j]);
              lastTimestamp = new Date(filtered[j].timestamp).getTime();
              j++;
            }
            if (imageGroup.length > 1) {
              renderableItems.push({ type: 'image_grid', id: imageGroup[0].id, messages: imageGroup });
              i = j;
              continue;
            }
          }
          renderableItems.push(currentMsg);
          i++;
        }
        return renderableItems;
    }, [chat, user.id]);

    return (
        <aside className="w-full sm:w-80 md:w-96 bg-primary h-full border-l border-slate-700 flex flex-col flex-shrink-0 animate-slide-in-right">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-slate-700">
                <h3 className="font-bold">Meeting chat</h3>
                <button onClick={onClose} className="p-1 text-text-secondary hover:text-white"><XIcon className="w-5 h-5" /></button>
            </header>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-4">
                    {processedMessages.map(item => {
                        if ('messages' in item) {
                             return <MeetingImageGrid key={item.id} messages={item.messages} onImageClick={onImageClick} />
                        }
                        if (item.senderId === 'system') {
                            return <div key={item.id} className="text-center text-xs text-text-secondary py-2">{item.content}</div>
                        }
                        return <MeetingChatBubble key={item.id} msg={item} onViewTranscript={onViewTranscript} onImageClick={onImageClick} />;
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-2 border-t border-slate-700">
                <MessageInputBar
                    chatId={chatId}
                    onOpenFilePicker={(accept) => onOpenFilePicker(chatId, accept)}
                    onOpenCamera={() => onOpenCameraPicker(chatId)}
                    onOpenContactPicker={() => alert('Feature not available in meetings')}
                    onOpenLocationPicker={() => alert('Feature not available in meetings')}
                    replyTo={null}
                    onCancelReply={() => {}}
                />
            </div>
        </aside>
    );
});

// --- END: In-Meeting Chat Renderer Components ---

const MeetingPeoplePanel: React.FC<{ 
    meetingParticipants: MeetingParticipant[],
    activeParticipants: User[],
    onClose: () => void,
    onAddPeople: () => void,
    handleMuteParticipant: (participantId: string) => void;
}> = React.memo(({ meetingParticipants, activeParticipants, onClose, onAddPeople, handleMuteParticipant }) => {
    const { user, contacts } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    
    const { inMeeting, invited } = useMemo(() => {
        const activeEmails = activeParticipants.map(p => p.email);
        const inMeetingUsers = activeParticipants;

        const invitedUsers = meetingParticipants
            .filter(mp => !activeEmails.includes(mp.email))
            .map(mp => {
                const contact = contacts.find(c => c.email === mp.email) || { 
                    id: mp.email, 
                    name: mp.name || mp.email.split('@')[0], 
                    avatar: '', 
                    email: mp.email, 
                    status: UserStatus.Offline, 
                    isMuted: true, 
                    isCameraOn: false 
                };
                return { ...contact, meetingStatus: mp.status };
            });

        return { inMeeting: inMeetingUsers, invited: invitedUsers };
    }, [activeParticipants, meetingParticipants, contacts]);

    const filteredInMeeting = inMeeting.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredInvited = invited.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const ParticipantRow: React.FC<{p: User, isYou?: boolean, onMute: (participantId: string) => void}> = ({ p, isYou = false, onMute }) => (
        <li key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
            <div className="flex items-center space-x-3">
                <img src={getAvatarUrl(p.name, p.avatar)} alt={p.name} className="w-10 h-10 rounded-full" />
                <span className="font-semibold">{p.name} {isYou ? '(You)' : ''}</span>
            </div>
            <div className="flex items-center space-x-3 text-text-secondary">
                <button
                    onClick={() => onMute(p.id)}
                    disabled={isYou}
                    className="p-1 rounded-full hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isYou ? 'Your microphone status' : `Mute ${p.name}`}
                >
                    {p.isMuted ? <MicrophoneOffIcon className="w-5 h-5 text-red-400" /> : <MicrophoneOnIcon className="w-5 h-5" />}
                </button>
            </div>
        </li>
    );

    const InvitedRow: React.FC<{p: User & { meetingStatus: 'accepted' | 'declined' | 'pending' }}> = ({p}) => (
        <li key={p.id} className="flex items-center justify-between p-2 rounded-lg">
            <div className="flex items-center space-x-3">
                <img src={getAvatarUrl(p.name, p.avatar)} alt={p.name} className="w-10 h-10 rounded-full opacity-60" />
                <div className="flex flex-col">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs text-text-secondary capitalize">{p.meetingStatus}</span>
                </div>
            </div>
            <button 
                onClick={() => alert(`A reminder has been sent to ${p.name}.`)}
                className="text-xs font-semibold px-3 py-1.5 border border-slate-600 rounded-md hover:bg-secondary">
                Request to join
            </button>
        </li>
    );

    return (
        <aside className="w-full sm:w-80 md:w-96 bg-primary h-full border-l border-slate-700 flex flex-col flex-shrink-0 animate-slide-in-right">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-slate-700">
                <h3 className="font-bold">People ({inMeeting.length + invited.length})</h3>
                <button onClick={onClose} className="p-1 text-text-secondary hover:text-white"><XIcon className="w-5 h-5" /></button>
            </header>
            <div className="flex-shrink-0 p-4 border-b border-slate-700">
                 <button onClick={onAddPeople} className="w-full flex items-center justify-center p-2 mb-2 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600">
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    Add people
                 </button>
                <div className="relative">
                     <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2"/>
                     <input 
                        type="text"
                        placeholder="Search people"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-2">
                    <h4 className="font-semibold text-text-secondary text-sm px-2 py-1">In this meeting ({filteredInMeeting.length})</h4>
                    <ul className="space-y-1">
                        {filteredInMeeting.map(p => <ParticipantRow key={p.id} p={p} isYou={p.id === user.id} onMute={handleMuteParticipant} />)}
                    </ul>
                </div>
                {filteredInvited.length > 0 && (
                    <div className="p-2">
                         <h4 className="font-semibold text-text-secondary text-sm px-2 py-1 mt-2">Invited ({filteredInvited.length})</h4>
                        <ul className="space-y-1">
                            {filteredInvited.map(p => <InvitedRow key={p.id} p={p} />)}
                        </ul>
                    </div>
                )}
            </div>
        </aside>
    );
});

const TimerDisplay: React.FC<{ startTime: number }> = React.memo(({ startTime }) => {
    const [duration, setDuration] = useState(() => Math.floor((Date.now() - startTime) / 1000));

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);
    
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return h !== '00' ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    return (
        <div className="text-sm font-mono p-2 bg-secondary rounded-md text-text-primary">
            {formatDuration(duration)}
        </div>
    );
});

interface MeetingControlBarProps {
    startTime: number;
    participantCount: number;
    onToggleMic: () => void; isMicOn: boolean;
    onToggleCamera: () => void; isCameraOn: boolean;
    onToggleScreenShare: () => void; isScreenSharing: boolean;
    onTogglePanel: (panel: 'chat' | 'people' | 'effects') => void; 
    activePanel: 'chat' | 'people' | 'effects' | null;
    onToggleRaiseHand: () => void; isHandRaised: boolean;
    onToggleRecording: () => void; isRecording: boolean;
    onToggleCaptions: () => void; areCaptionsEnabled: boolean;
    onToggleTranslation: () => void; isTranslationEnabled: boolean;
    onShowEmojis: () => void;
    onLeave: () => void;
}

const MeetingControlBar: React.FC<MeetingControlBarProps> = React.memo((props) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setIsMoreMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const ControlButton: React.FC<{ icon: React.FC<{className?:string}>, label: string, onClick?: () => void, isActive?: boolean, isDestructive?: boolean, hasIndicator?: boolean, disabled?: boolean, notificationCount?: number, className?: string }> = 
    ({ icon: Icon, label, onClick, isActive, isDestructive, hasIndicator = true, disabled = false, notificationCount, className }) => {
        let bgClass = 'bg-secondary';
        if (isDestructive) bgClass = 'bg-red-600';
        else if (isActive) bgClass = 'bg-slate-700';

        return (
            <div className={`flex flex-col items-center justify-center text-center ${className}`}>
                <button onClick={onClick} disabled={disabled} className={`relative w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${bgClass} hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <Icon className={`w-6 h-6 ${isActive && !isDestructive ? 'text-highlight' : 'text-text-primary'}`} />
                    {hasIndicator && isActive && !isDestructive && (
                         <div className="absolute -bottom-1 w-4 h-1 bg-highlight rounded-full"></div>
                    )}
                    {notificationCount && notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{notificationCount}</span>
                    )}
                </button>
                <span className={`text-xs mt-2 ${isActive && !isDestructive ? 'text-highlight' : 'text-text-primary'}`}>{label}</span>
            </div>
        );
    };

    const MoreMenuItem: React.FC<{icon: React.FC<{className?:string}>, label:string, onClick: ()=>void, isActive?:boolean, disabled?:boolean}> = ({ icon: Icon, label, onClick, isActive, disabled }) => (
      <button onClick={onClick} disabled={disabled} className="flex items-center w-full text-left p-3 hover:bg-secondary disabled:opacity-50">
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-highlight' : 'text-text-secondary'}`} />
        <span className={`font-semibold ${isActive ? 'text-highlight' : ''}`}>{label}</span>
      </button>
    )

    return (
        <header className="w-full bg-primary p-2 flex items-center justify-between border-b border-slate-700 flex-shrink-0 z-20 shadow-md h-auto md:h-24 flex-wrap md:flex-nowrap gap-2">
            <TimerDisplay startTime={props.startTime} />

            <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
                    <ControlButton icon={ChatBubbleLeftRightIcon} label="Chat" onClick={() => props.onTogglePanel('chat')} isActive={props.activePanel === 'chat'} />
                    <ControlButton icon={UsersIcon} label="People" onClick={() => props.onTogglePanel('people')} isActive={props.activePanel === 'people'} notificationCount={props.participantCount} />
                    <ControlButton icon={HandRaisedIcon} label="Raise" onClick={props.onToggleRaiseHand} isActive={props.isHandRaised} />
                    <div className="w-px h-10 bg-slate-600" />
                    <ControlButton icon={ArrowUpTrayIcon} label="Share" onClick={props.onToggleScreenShare} isActive={props.isScreenSharing} />
                    <ControlButton
                        icon={RecordCircleIcon}
                        label={props.isRecording ? 'Stop' : 'Record'}
                        onClick={props.onToggleRecording}
                        isActive={props.isRecording}
                        isDestructive={props.isRecording}
                    />
                    <ControlButton icon={SparklesIcon} label="Effects" onClick={() => props.onTogglePanel('effects')} isActive={props.activePanel === 'effects'} hasIndicator={false} disabled={!props.isCameraOn} />
                    <div className="w-px h-10 bg-slate-600" />
                    <ControlButton icon={ClipboardDocumentListIcon} label="Captions" onClick={props.onToggleCaptions} isActive={props.areCaptionsEnabled} />
                    <ControlButton icon={GlobeAltIcon} label="Translate" onClick={props.onToggleTranslation} isActive={props.isTranslationEnabled} />
                </div>

                <div ref={moreMenuRef} className="relative sm:hidden">
                  <ControlButton icon={DotsHorizontalIcon} label="More" onClick={() => setIsMoreMenuOpen(p => !p)} isActive={isMoreMenuOpen} hasIndicator={false} />
                  {isMoreMenuOpen && (
                    <div className="absolute bottom-full mb-2 right-0 w-60 bg-primary border border-slate-600 rounded-lg shadow-xl z-50 p-1">
                      <MoreMenuItem icon={ChatBubbleLeftRightIcon} label="Chat" onClick={() => {props.onTogglePanel('chat'); setIsMoreMenuOpen(false);}} isActive={props.activePanel === 'chat'} />
                      <MoreMenuItem icon={UsersIcon} label="People" onClick={() => {props.onTogglePanel('people'); setIsMoreMenuOpen(false);}} isActive={props.activePanel === 'people'} />
                      <MoreMenuItem icon={HandRaisedIcon} label="Raise Hand" onClick={() => {props.onToggleRaiseHand(); setIsMoreMenuOpen(false);}} isActive={props.isHandRaised} />
                      <MoreMenuItem icon={ArrowUpTrayIcon} label="Share Screen" onClick={() => {props.onToggleScreenShare(); setIsMoreMenuOpen(false);}} isActive={props.isScreenSharing} />
                      <div className="h-px bg-slate-700 my-1"/>
                      <MoreMenuItem icon={RecordCircleIcon} label="Record" onClick={() => {props.onToggleRecording(); setIsMoreMenuOpen(false);}} isActive={props.isRecording} />
                      <MoreMenuItem icon={SparklesIcon} label="Effects" onClick={() => {props.onTogglePanel('effects'); setIsMoreMenuOpen(false);}} disabled={!props.isCameraOn} />
                      <MoreMenuItem icon={ClipboardDocumentListIcon} label="Captions" onClick={() => {props.onToggleCaptions(); setIsMoreMenuOpen(false);}} isActive={props.areCaptionsEnabled} />
                      <MoreMenuItem icon={GlobeAltIcon} label="Translate" onClick={() => {props.onToggleTranslation(); setIsMoreMenuOpen(false);}} isActive={props.isTranslationEnabled} />
                    </div>
                  )}
                </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                <ControlButton icon={props.isMicOn ? MicrophoneOnIcon : MicrophoneOffIcon} label="Mic" onClick={props.onToggleMic} isActive={!props.isMicOn} isDestructive={!props.isMicOn} hasIndicator={false}/>
                <ControlButton icon={props.isCameraOn ? VideoCameraIcon : VideoCameraSlashIcon} label="Camera" onClick={props.onToggleCamera} isActive={!props.isCameraOn} isDestructive={!props.isCameraOn} hasIndicator={false}/>
                 <button onClick={props.onLeave} className="flex items-center h-12 px-4 sm:px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500">
                    <span className="hidden sm:inline">Leave</span>
                    <span className="sm:hidden"><XIcon className="w-6 h-6"/></span>
                 </button>
            </div>
        </header>
    );
});


const EffectsPanel: React.FC<{
    currentEffect: BackgroundEffect;
    currentWallpaper?: string;
    onChange: (effect: BackgroundEffect, url?: string) => void;
    onClose: () => void;
}> = React.memo(({ currentEffect, currentWallpaper, onChange, onClose }) => {
    return (
        <aside className="w-full sm:w-80 md:w-96 bg-primary h-full border-l border-slate-700 flex flex-col flex-shrink-0 animate-slide-in-right">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-slate-700">
                <h3 className="font-bold">Background Effects</h3>
                <button onClick={onClose} className="p-1 text-text-secondary hover:text-white"><XIcon className="w-5 h-5" /></button>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-2 text-center">
                    <button onClick={() => onChange('none')} className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-secondary ${currentEffect === 'none' ? 'ring-2 ring-highlight' : 'bg-secondary'}`}>
                        <XIcon className="w-8 h-8"/>
                        <span className="text-xs mt-1">None</span>
                    </button>
                    <button onClick={() => onChange('blur')} className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-secondary ${currentEffect === 'blur' ? 'ring-2 ring-highlight' : 'bg-secondary'}`}>
                        <span className="text-3xl font-bold backdrop-blur-sm">A</span>
                        <span className="text-xs mt-1">Blur</span>
                    </button>
                </div>
                 <h4 className="font-semibold text-sm pt-2">Virtual Backgrounds</h4>
                <div className="grid grid-cols-2 gap-2">
                    {virtualBackgrounds.map(bg => (
                        <button key={bg.id} onClick={() => onChange('wallpaper', bg.url)} className={`aspect-square rounded-lg overflow-hidden hover:opacity-80 ${currentWallpaper === bg.url ? 'ring-2 ring-highlight' : ''}`}>
                            <img src={bg.url} alt={bg.name} className="w-full h-full object-cover"/>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
});


// Main Component
export const MeetingScreen: React.FC<MeetingScreenProps> = ({ callState, onEndCall, onOpenAddPeoplePicker, onOpenFilePicker, onOpenCameraPicker, onOpenForwardPicker }) => {
    const { user, updateUser, sendMessage, areCaptionsEnabled, setAreCaptionsEnabled, chats, getContactById, deleteMessage } = useAppContext();
    const { meeting, participants, initialSettings } = callState;

    const [startTime] = useState(Date.now());
    
    // Local device state
    const [isMicOn, setIsMicOn] = useState(initialSettings.isMicOn);
    const [isCameraOn, setIsCameraOn] = useState(initialSettings.isCameraOn);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [backgroundEffect, setBackgroundEffect] = useState(initialSettings.backgroundEffect);
    const [wallpaperUrl, setWallpaperUrl] = useState(initialSettings.wallpaperUrl);

    // Recording and transcription state
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    
    // Captioning and Translation state
    const speechRecognitionRef = useRef<any>(null); // Using any for browser-specific API
    const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
    const [targetLanguage] = useState(user.settings?.translationLanguage || 'Urdu');
    const finalTranscriptRef = useRef<TranscriptEntry[]>([]);
    const [liveCaption, setLiveCaption] = useState<{ text: string; translatedText?: string } | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [debouncedLiveText, setDebouncedLiveText] = useState('');
    const captionClearTimeoutRef = useRef<number | null>(null);

    // UI State
    const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'people' | 'effects' | null>(null);
    const [activeParticipants, setActiveParticipants] = useState<User[]>([...participants]);
    const [viewingTranscript, setViewingTranscript] = useState<TranscriptInfo | null>(null);
    const [mediaToView, setMediaToView] = useState<{ messages: Message[]; startIndex: number } | null>(null);

    // Media Streams
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const screenVideoRef = useRef<HTMLVideoElement>(null);

    const activeStream = isScreenSharing ? screenStreamRef.current : localStream;

    useEffect(() => {
        const chat = chats.find(c => c.id === meeting.chatId);
        if (chat) {
            const chatParticipantIds = new Set(chat.participants);
            const activeParticipantIds = new Set(activeParticipants.map(p => p.id));
            
            const newParticipantIds = [...chatParticipantIds].filter(id => !activeParticipantIds.has(id));
            
            if (newParticipantIds.length > 0) {
                const newUsers = newParticipantIds.map(id => getContactById(id)).filter((u): u is User => !!u);
                setActiveParticipants(prev => [...prev, ...newUsers.map(u => ({...u, isMuted: true, isCameraOn: false, isHandRaised: false}))]);
            }
        }
    }, [chats, meeting.chatId, activeParticipants, getContactById]);

    const handleMuteParticipant = useCallback((participantId: string) => {
        if (participantId === user.id) return;
        setActiveParticipants(prev => prev.map(p => 
            p.id === participantId ? { ...p, isMuted: true } : p
        ));
    }, [user.id]);
    
    const currentUserInCall = useMemo(() => ({
        ...user,
        isCameraOn,
        isMuted: !isMicOn,
        isHandRaised,
    }), [user, isCameraOn, isMicOn, isHandRaised]);

    // Combine current user with other participants for the grid
    const allDisplayParticipants = useMemo(() => {
        const others = activeParticipants.filter(p => p.id !== user.id);
        const participantMap = new Map<string, User>();
        participantMap.set(currentUserInCall.id, currentUserInCall);
        others.forEach(p => participantMap.set(p.id, p));
        return Array.from(participantMap.values());
    }, [activeParticipants, currentUserInCall, user.id]);


    useEffect(() => {
        let streamInstance: MediaStream | null = null;
        const setupMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                    video: { width: 1280, height: 720 }
                });
                streamInstance = stream;
                stream.getAudioTracks().forEach(track => track.enabled = initialSettings.isMicOn);
                stream.getVideoTracks().forEach(track => track.enabled = initialSettings.isCameraOn);
                setLocalStream(stream);
            } catch (error) {
                console.error("Error accessing media devices:", error);
                alert("Could not access camera/microphone. Please check permissions.");
                setIsMicOn(false);
                setIsCameraOn(false);
            }
        };

        setupMedia();
        
        return () => {
            streamInstance?.getTracks().forEach(track => track.stop());
            screenStreamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, [initialSettings]);
    
    const sendTranscript = useCallback(() => {
        if (finalTranscriptRef.current.length > 0) {
            sendMessage({
                chatId: meeting.chatId, 
                message: {
                    senderId: user.id,
                    content: 'Meeting Transcript',
                    type: 'transcript',
                    transcriptInfo: { title: meeting.title, entries: finalTranscriptRef.current }
                }
            });
        }
        finalTranscriptRef.current = [];
    }, [sendMessage, meeting.chatId, meeting.title, user.id]);

    const handleLeave = useCallback(() => {
        if(isRecording) {
            mediaRecorderRef.current?.stop();
        }
        if(areCaptionsEnabled) {
             speechRecognitionRef.current?.stop();
             // Manually call sendTranscript here to ensure it fires before unmount
             sendTranscript();
        }
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onEndCall(duration);
    }, [startTime, onEndCall, isRecording, areCaptionsEnabled, sendTranscript]);

    // Toggles
    const handleToggleMic = useCallback(() => {
        setIsMicOn(prev => {
            const newState = !prev;
            localStream?.getAudioTracks().forEach(track => { track.enabled = newState; });
            return newState;
        });
    }, [localStream]);

    const handleToggleCamera = useCallback(() => {
        setIsCameraOn(prev => {
            const newState = !prev;
            localStream?.getVideoTracks().forEach(track => { track.enabled = newState; });
            if (!newState) { // If turning camera off, also close effects panel
                setActiveSidePanel(current => current === 'effects' ? null : current);
            }
            return newState;
        });
    }, [localStream]);

    const handleToggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            screenStreamRef.current?.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setIsScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                stream.getTracks().forEach(track => {
                    track.onended = () => {
                        setIsScreenSharing(false);
                        screenStreamRef.current = null;
                    };
                });
                screenStreamRef.current = stream;
                if(screenVideoRef.current) {
                    screenVideoRef.current.srcObject = stream;
                }
                setIsScreenSharing(true);
            } catch (error) {
                console.error("Error starting screen share:", error);
            }
        }
    }, [isScreenSharing]);

    useEffect(() => {
        if(screenVideoRef.current && screenStreamRef.current) {
            screenVideoRef.current.srcObject = screenStreamRef.current;
        }
    }, [isScreenSharing]);

    const handleTogglePanel = useCallback((panel: 'chat' | 'people' | 'effects') => {
        if (panel === 'effects' && !isCameraOn) return;
        setActiveSidePanel(prev => (prev === panel ? null : panel));
    }, [isCameraOn]);

    const handleToggleRaiseHand = useCallback(() => setIsHandRaised(p => !p), []);
    
    const onToggleRecording = useCallback(() => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            const streamToRecord = activeStream;
            if (!streamToRecord) {
                alert("No active stream to record.");
                return;
            }
            
            try {
                const options = { mimeType: 'video/webm; codecs=vp9' };
                mediaRecorderRef.current = new MediaRecorder(streamToRecord, options);
                recordedChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                const stopHandler = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const url = e.target?.result as string;
                        sendMessage({
                            chatId: meeting.chatId,
                            message: {
                                senderId: user.id,
                                content: 'Shared a meeting recording.',
                                type: 'file',
                                fileInfo: {
                                    name: `recording-${new Date().toISOString()}.webm`,
                                    size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
                                    url,
                                    type: 'video/webm',
                                },
                            }
                        });
                    };
                    reader.readAsDataURL(blob);
                    recordedChunksRef.current = [];
                };
                mediaRecorderRef.current.addEventListener('stop', stopHandler);

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error("Failed to start recording:", e);
                alert("Could not start recording. Your browser might not support the required video format (video/webm; codecs=vp9).");
            }
        }
    }, [isRecording, activeStream, sendMessage, meeting.chatId, user.id]);

     // Caption and Translation Logic
    const onToggleCaptions = useCallback(() => {
        setAreCaptionsEnabled(p => !p);
    }, [setAreCaptionsEnabled]);

    useEffect(() => {
        if (!areCaptionsEnabled) {
            speechRecognitionRef.current?.stop();
            sendTranscript();
            setLiveCaption(null);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser doesn't support the Speech Recognition API.");
            setAreCaptionsEnabled(false);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            if (captionClearTimeoutRef.current) clearTimeout(captionClearTimeoutRef.current);

            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            const currentText = (finalTranscript + interimTranscript).trim();
            if (currentText) {
                setLiveCaption(prev => ({ text: currentText, translatedText: prev?.text === currentText ? prev.translatedText : undefined }));
            }

            if(finalTranscript) {
                const finalSegment = finalTranscript.trim();
                if (finalSegment) {
                    const newEntry: TranscriptEntry = {
                        speakerId: user.id,
                        speakerName: user.name,
                        text: finalSegment,
                        timestamp: new Date().toISOString()
                    };
                    finalTranscriptRef.current.push(newEntry);
                }
            }

            captionClearTimeoutRef.current = window.setTimeout(() => {
                setLiveCaption(null);
            }, 5000); // Clear after 5 seconds of silence
        };
        
        recognition.onerror = (event: any) => {
             if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error('Speech recognition error', event.error);
            }
        };
        
        recognition.onend = () => {
            if (speechRecognitionRef.current) {
                recognition.start();
            }
        }
        
        recognition.start();
        speechRecognitionRef.current = recognition;

        return () => {
            recognition.stop();
            speechRecognitionRef.current = null;
            if (captionClearTimeoutRef.current) clearTimeout(captionClearTimeoutRef.current);
        }
    }, [areCaptionsEnabled, setAreCaptionsEnabled, user.id, user.name, sendTranscript]);

    const onToggleTranslation = useCallback(() => setIsTranslationEnabled(p => !p), []);

    // Debounce live caption text for translation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (liveCaption?.text) {
                setDebouncedLiveText(liveCaption.text);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [liveCaption?.text]);

    // Effect for translation
    useEffect(() => {
        if (debouncedLiveText && isTranslationEnabled) {
            let isStale = false;
            setIsTranslating(true);
            translateText(debouncedLiveText, targetLanguage).then(translation => {
                if (!isStale) {
                    setLiveCaption(prev => (prev?.text === debouncedLiveText ? { ...prev, translatedText: translation } : prev));
                    setIsTranslating(false);
                    const lastEntry = finalTranscriptRef.current[finalTranscriptRef.current.length - 1];
                    if (lastEntry && lastEntry.text === debouncedLiveText.trim()) {
                        lastEntry.translatedText = translation;
                    }
                }
            });
            return () => { isStale = true; };
        } else if (liveCaption) {
            setLiveCaption(prev => prev ? { ...prev, translatedText: undefined } : null);
        }
    }, [debouncedLiveText, isTranslationEnabled, targetLanguage]);
    
    // --- Media Viewer Logic ---
    const chat = chats.find(c => c.id === meeting.chatId);
    const imageMessages = useMemo(() => chat ? chat.messages.filter(isImageMessage) : [], [chat]);

    const handleImageClick = useCallback((clickedMessage: Message) => {
        const startIndex = imageMessages.findIndex(m => m.id === clickedMessage.id);
        if (startIndex !== -1) {
            setMediaToView({ messages: imageMessages, startIndex });
        }
    }, [imageMessages]);

    const handleDeleteMessageFromViewer = useCallback((messageId: string, forEveryone: boolean) => {
        deleteMessage({ chatId: meeting.chatId, messageId, forEveryone });
        setMediaToView(prev => {
            if (!prev) return null;
            const newMessages = prev.messages.filter(m => m.id !== messageId);
            if (newMessages.length === 0) return null;
            const newIndex = Math.min(prev.startIndex, newMessages.length - 1);
            return { messages: newMessages, startIndex: newIndex };
        });
    }, [deleteMessage, meeting.chatId]);

    const handleForwardMessageFromViewer = useCallback((messageId: string) => {
        onOpenForwardPicker(meeting.chatId, [messageId]);
        setMediaToView(null);
    }, [onOpenForwardPicker, meeting.chatId]);

    return (
        <div className="absolute inset-0 z-40 w-screen h-screen bg-black text-white flex flex-col">
            <MeetingControlBar
                startTime={startTime}
                participantCount={allDisplayParticipants.length}
                isMicOn={isMicOn} onToggleMic={handleToggleMic}
                isCameraOn={isCameraOn} onToggleCamera={handleToggleCamera}
                isScreenSharing={isScreenSharing} onToggleScreenShare={handleToggleScreenShare}
                activePanel={activeSidePanel} onTogglePanel={handleTogglePanel}
                isHandRaised={isHandRaised} onToggleRaiseHand={handleToggleRaiseHand}
                isRecording={isRecording} onToggleRecording={onToggleRecording}
                areCaptionsEnabled={areCaptionsEnabled} onToggleCaptions={onToggleCaptions}
                isTranslationEnabled={isTranslationEnabled} onToggleTranslation={onToggleTranslation}
                onShowEmojis={() => {}}
                onLeave={handleLeave}
            />
            {viewingTranscript && (
                <TranscriptViewerModal transcriptInfo={viewingTranscript} onClose={() => setViewingTranscript(null)} />
            )}
            {mediaToView && (
                <MediaViewer
                    messages={mediaToView.messages}
                    initialIndex={mediaToView.startIndex}
                    onClose={() => setMediaToView(null)}
                    onDelete={handleDeleteMessageFromViewer}
                    onForward={handleForwardMessageFromViewer}
                />
            )}
            <main className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 relative p-4 md:p-6 overflow-y-auto">
                    {isScreenSharing ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                            <video ref={screenVideoRef} autoPlay className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className={`grid gap-2 md:gap-4 w-full h-full`} style={{gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`}}>
                             {allDisplayParticipants.map(p => (
                                <MeetingParticipantTile
                                    key={p.id}
                                    participant={p}
                                    stream={p.id === user.id ? activeStream : null}
                                    isCameraOn={p.id === user.id ? isCameraOn : p.isCameraOn!}
                                    isMicOn={p.id === user.id ? isMicOn : !p.isMuted}
                                    isHandRaised={p.id === user.id ? isHandRaised : p.isHandRaised!}
                                    backgroundEffect={p.id === user.id ? backgroundEffect : 'none'}
                                    wallpaperUrl={p.id === user.id ? wallpaperUrl : undefined}
                                />
                             ))}
                        </div>
                    )}
                     {areCaptionsEnabled && liveCaption && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 bg-black/60 rounded-lg text-center text-lg z-20 backdrop-blur-sm">
                            <p><span className="text-blue-400 font-bold">{user.name}</span>: {liveCaption.text}</p>
                            {isTranslationEnabled && (
                                <p className="text-base text-gray-300 mt-1">
                                    {isTranslating && !liveCaption.translatedText ? '...' : (liveCaption.translatedText ? <MarkdownText text={liveCaption.translatedText} /> : '')}
                                </p>
                            )}
                        </div>
                     )}
                </div>
                
                {activeSidePanel === 'chat' && (
                    <MeetingChatPanel 
                        chatId={meeting.chatId} 
                        onClose={() => setActiveSidePanel(null)} 
                        onOpenFilePicker={onOpenFilePicker}
                        onOpenCameraPicker={onOpenCameraPicker}
                        onViewTranscript={setViewingTranscript}
                        onImageClick={handleImageClick}
                    />
                )}
                {activeSidePanel === 'people' && (
                    <MeetingPeoplePanel 
                        meetingParticipants={meeting.participants} 
                        activeParticipants={allDisplayParticipants}
                        onClose={() => setActiveSidePanel(null)}
                        onAddPeople={() => onOpenAddPeoplePicker(meeting.chatId, activeParticipants)}
                        handleMuteParticipant={handleMuteParticipant}
                    />
                )}
                 {activeSidePanel === 'effects' && (
                    <EffectsPanel 
                        currentEffect={backgroundEffect}
                        currentWallpaper={wallpaperUrl}
                        onChange={(effect, url) => { setBackgroundEffect(effect); setWallpaperUrl(url); }}
                        onClose={() => setActiveSidePanel(null)}
                    />
                 )}
            </main>
        </div>
    );
};
