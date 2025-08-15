import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserStatus, Chat, Message, Meeting, CallInfo, RecurrenceFrequency } from '../types';
import { 
    CogIcon, PencilIcon, DotsHorizontalIcon, StarIcon, BellIcon, BellOffIcon, EyeOffIcon, TrashIcon, BanIcon, 
    ShareIcon, EnvelopeOpenIcon, ArrowRightOnRectangleIcon, XIcon, PhoneArrowDownLeftIcon, PhoneArrowUpRightIcon, 
    PhoneXMarkIcon, VideoCameraIcon, ChevronDownIcon, UsersIcon, CameraIcon, PhoneIcon, CheckIcon, UserPlusIcon, 
    PlusIcon, FolderIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, PencilSquareIcon, DocumentTextIcon, UserGroupIcon, IdentificationIcon,
    CalendarDaysIcon, MegaphoneIcon, ComputerDesktopIcon, RecordCircleIcon, ChevronRightIcon, RefreshIcon
} from './icons';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}

const formatTimestamp = (timestamp: string, timezone?: string): string => {
    if (!timestamp) return '';
    const messageDate = new Date(timestamp);
    const now = new Date();

    const ymdFormatter = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone });
    
    const todayStr = ymdFormatter.format(now);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = ymdFormatter.format(yesterday);
    
    const messageDateStr = ymdFormatter.format(messageDate);

    if (messageDateStr === todayStr) {
        return messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: timezone }).toLowerCase();
    }
    
    if (messageDateStr === yesterdayStr) {
        return 'Yesterday';
    }
    
    const currentYear = new Date().getFullYear();
    if (messageDate.getFullYear() === currentYear) {
         return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: timezone });
    }

    return messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', timeZone: timezone });
};

const formatCallDuration = (sec: number): string => {
    if (sec <= 0) return '';
    if (sec < 60) return `(${sec}s)`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (s === 0) return `(${m}m)`;
    return `(${m}m ${s}s)`;
};

const formatDurationVerbose = (sec: number): string => {
    if (sec <= 0) return '0 secs';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0) parts.push(`${minutes} mins`);
    if (seconds > 0) parts.push(`${seconds} secs`);

    return parts.join(' ');
};

const getStatusColorClass = (status: UserStatus, type: 'bg' | 'ring'): string => {
    switch (status) {
        case UserStatus.Online: return `${type}-online`;
        case UserStatus.Busy: return `${type}-busy`;
        case UserStatus.Away: return `${type}-yellow-500`;
        case UserStatus.DoNotDisturb: return `${type}-red-600`;
        case UserStatus.Offline: 
            return type === 'ring' ? `${type}-transparent` : `${type}-offline`;
        default: return `${type}-transparent`;
    }
};

const getLastMessagePreview = (message?: Message): string => {
    if (!message) return '';
    switch (message.type) {
        case 'text':
            return message.content;
        case 'image':
            return '📷 Photo';
        case 'file':
            return `📄 ${message.fileInfo?.name || 'File'}`;
        case 'contact':
            return `👤 Contact: ${message.contactInfo?.name || ''}`;
        case 'location':
            return '📍 Location';
        case 'audio':
            return '🎤 Voice Note';
        case 'call':
            return `📞 ${message.content}`;
        default:
            return 'New message';
    }
};

const StatusIndicator: React.FC<{ status: UserStatus }> = ({ status }) => {
    const color = getStatusColorClass(status, 'bg');
    return <span className={`h-2.5 w-2.5 rounded-full ${color}`} />;
};

const NewEventMenuItem: React.FC<{
    icon: React.FC<{ className?: string }>;
    text: string;
    onClick: () => void;
}> = ({ icon: Icon, text, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-text-primary hover:bg-secondary"
    >
        <Icon className="w-5 h-5 mr-3 text-text-secondary" />
        <span>{text}</span>
    </button>
);

const NewEventMenu: React.FC<{
    onNewEvent: () => void;
}> = React.memo(({ onNewEvent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(p => !p)}
                className="flex items-center bg-accent rounded-md text-sm font-semibold text-white hover:bg-highlight transition-colors"
            >
                <span className="flex items-center space-x-2 px-3 py-1.5">
                  <CalendarDaysIcon className="w-5 h-5"/>
                  <span>New event</span>
                </span>
                <span className="self-stretch w-px bg-white/20"></span>
                <span className="px-1.5 py-1.5">
                  <ChevronDownIcon className="w-4 h-4" />
                </span>
            </button>
            {isOpen && (
                <div
                    className="absolute top-full right-0 mt-2 w-64 bg-primary rounded-lg shadow-2xl border border-slate-600 p-1 z-50 animate-fade-in-fast"
                >
                    <NewEventMenuItem icon={CalendarDaysIcon} text="Event" onClick={() => handleAction(onNewEvent)} />
                    <NewEventMenuItem icon={DocumentTextIcon} text="Channel meeting" onClick={() => handleAction(() => alert('New channel meeting not implemented'))} />
                    <div className="h-px bg-slate-600 my-1 mx-1" />
                    <p className="px-3 py-2 text-sm text-text-secondary">Organization templates</p>
                    <NewEventMenuItem icon={UsersIcon} text="Webinar" onClick={() => handleAction(() => alert('Webinar not implemented'))} />
                    <NewEventMenuItem icon={MegaphoneIcon} text="Town hall" onClick={() => handleAction(() => alert('Town hall not implemented'))} />
                    <NewEventMenuItem icon={ComputerDesktopIcon} text="Virtual appointment" onClick={() => handleAction(() => alert('Virtual appointment not implemented'))} />
                    <NewEventMenuItem icon={RecordCircleIcon} text="Live Event" onClick={() => handleAction(() => alert('Live event not implemented'))} />
                </div>
            )}
        </div>
    );
});


const ComposeMenuItem: React.FC<{
    icon: React.FC<{ className?: string }>;
    text: string;
    onClick: () => void;
}> = ({ icon: Icon, text, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-text-primary hover:bg-secondary"
    >
        <Icon className="w-5 h-5 mr-3 text-text-secondary" />
        <span>{text}</span>
    </button>
);

const ComposeMenu: React.FC<{
    onNewMessage: () => void;
    onNewTeam: () => void;
}> = React.memo(({ onNewMessage, onNewTeam }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const menuItems = [
        { icon: PencilSquareIcon, text: 'New message', action: onNewMessage },
        { icon: DocumentTextIcon, text: 'New channel', action: () => alert('New channel not implemented') },
        { icon: IdentificationIcon, text: 'New storyline post', action: () => alert('New storyline post not implemented') },
        { separator: true },
        { icon: UsersIcon, text: 'Join team', action: () => alert('Join team not implemented') },
        { icon: UserGroupIcon, text: 'New team', action: onNewTeam },
        { separator: true },
        { icon: FolderIcon, text: 'New section', action: () => alert('New section not implemented') },
    ];


    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(p => !p)}
                title="New message"
                className="p-2 text-white bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
            >
                <PencilSquareIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div
                    className="absolute top-full right-0 mt-2 w-60 bg-primary rounded-lg shadow-2xl border border-slate-600 p-2 z-50 animate-fade-in-fast"
                >
                    {menuItems.map((item, index) =>
                        item.separator ? (
                            <div key={`sep-${index}`} className="h-px bg-slate-600 my-1 mx-1" />
                        ) : (
                            <ComposeMenuItem
                                key={item.text}
                                icon={item.icon}
                                text={item.text}
                                onClick={() => {
                                    item.action();
                                    setIsOpen(false);
                                }}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    );
});


const UserProfile: React.FC<{onOpenProfilePictureModal: () => void}> = React.memo(({ onOpenProfilePictureModal }) => {
    const { user, updateUserStatus, updateUserName, updateUserCustomStatus } = useAppContext();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(user.name);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const userProfileRef = useRef<HTMLDivElement>(null);

    const handleNameSave = () => {
        if (name.trim()) {
            updateUserName(name.trim());
        }
        setIsEditingName(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userProfileRef.current && !userProfileRef.current.contains(event.target as Node)) {
                setIsStatusMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const StatusMenu = () => (
        <div className="absolute top-full mt-2 left-0 w-64 bg-primary rounded-lg shadow-2xl border border-slate-600 z-50 p-3">
            <h4 className="text-text-primary font-semibold mb-2">Set a status</h4>
            <input
                type="text"
                placeholder="What's on your mind?"
                defaultValue={user.customStatusMessage}
                onBlur={(e) => updateUserCustomStatus(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                className="w-full bg-secondary px-2 py-1.5 rounded-md text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors"
            />
            <ul className="space-y-1">
                {Object.values(UserStatus).map(statusValue => (
                    <li key={statusValue}>
                        <button
                            onClick={() => {
                                updateUserStatus(statusValue);
                                setIsStatusMenuOpen(false);
                            }}
                            className="w-full flex items-center p-2 rounded-md hover:bg-secondary"
                        >
                            <StatusIndicator status={statusValue} />
                            <span className="text-sm ml-3">{statusValue}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="p-4 flex items-center justify-between border-b border-slate-600">
            <div ref={userProfileRef} className="flex items-center space-x-3">
                <button onClick={onOpenProfilePictureModal} className="relative group flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-highlight rounded-full">
                    <img
                        className={`h-12 w-12 rounded-full ring-2 ring-offset-2 ring-offset-primary transition-colors object-cover ${getStatusColorClass(user.status, 'ring')}`}
                        src={getAvatarUrl(user.name, user.avatar)}
                        alt={user.name}
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CameraIcon className="w-6 h-6 text-white" />
                    </div>
                </button>
                <div>
                    {isEditingName ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            className="bg-secondary text-text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-highlight rounded px-1 -ml-1 transition-colors"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                           <h2 className="font-semibold text-text-primary">{user.name}</h2>
                            <button onClick={() => setIsEditingName(true)} className="text-text-secondary hover:text-white">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <button onClick={() => setIsStatusMenuOpen(p => !p)} className="text-left w-full">
                            <p className="text-sm font-semibold text-text-secondary capitalize flex items-center gap-2">
                               {user.status}
                            </p>
                             <p className="text-xs text-text-secondary truncate w-40 pr-2">
                                {user.customStatusMessage || 'Set a status message'}
                            </p>
                        </button>
                        {isStatusMenuOpen && <StatusMenu />}
                    </div>
                </div>
            </div>
        </div>
    );
});

const MenuItem: React.FC<{icon: React.FC<{className?: string}>, text: string, onClick: () => void, isDestructive?: boolean}> = React.memo(({icon: Icon, text, onClick, isDestructive}) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={`flex items-center w-full text-left px-3 py-2 text-sm rounded-md ${isDestructive ? 'text-red-500 hover:bg-secondary' : 'text-text-primary hover:bg-secondary'}`}
    >
        <Icon className="w-5 h-5 mr-3"/>
        {text}
    </button>
));

const ChatListItem: React.FC<{ chat: Chat; isActive: boolean; onClick: () => void; onInitiateShareContact: (contact: User) => void; }> = React.memo(({ chat, isActive, onClick, onInitiateShareContact }) => {
    const { getContactById, user, toggleFavorite, toggleMuteChat, hideChat, deleteChat, toggleBlockContact, markChatAsRead, archiveChat, leaveGroup } = useAppContext();
    const lastMessage = chat.messages[chat.messages.length - 1];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapperRef = useRef<HTMLDivElement>(null);

    let title = '';
    let avatarUrl = '';
    let status: UserStatus | undefined;

    const partnerId = chat.type === 'private' ? chat.participants.find(p => p !== user.id) : undefined;
    const partner = partnerId ? getContactById(partnerId) : undefined;
    
    if (chat.type === 'private') {
        if (partner) {
            title = partner.name;
            avatarUrl = getAvatarUrl(partner.name, partner.avatar);
            status = partner.status;
        }
    } else {
        title = chat.name || 'Group Chat';
        avatarUrl = getAvatarUrl(title, chat.avatar);
    }
    
    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuWrapperRef.current && !menuWrapperRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);
    
    const isUnread = lastMessage && !lastMessage.read && lastMessage.senderId !== user.id;

    const secondaryTextClasses = ['text-sm', 'truncate'];
    if (isUnread) {
        secondaryTextClasses.push('font-bold', 'text-text-primary');
    } else if (isActive) {
        secondaryTextClasses.push('text-text-primary');
    } else {
        secondaryTextClasses.push('text-text-secondary');
    }

    const lastMessagePreview = useMemo(() => {
        if (!lastMessage) return '';

        if (chat.type === 'group' && lastMessage.type === 'call' && lastMessage.content === 'Meeting ended' && lastMessage.callInfo?.duration) {
            return `Meeting ended - ${formatDurationVerbose(lastMessage.callInfo.duration)}`;
        }

        const senderPrefix = chat.type === 'group' && lastMessage.senderId !== user.id 
            ? `${getContactById(lastMessage.senderId)?.name.split(' ')[0]}: ` 
            : '';
        
        return senderPrefix + getLastMessagePreview(lastMessage);
    }, [chat, lastMessage, getContactById, user.id]);

    return (
        <li
            onClick={() => {
                onClick();
                markChatAsRead(chat.id, true);
            }}
            className={`flex items-center p-3 space-x-3 cursor-pointer rounded-lg mx-2 group relative transition-colors ${isActive ? 'bg-slate-600' : 'hover:bg-secondary'}`}
        >
            <div className="relative flex-shrink-0">
                <img
                    className={`h-12 w-12 rounded-full ring-2 ring-offset-2 transition-colors object-cover
                        ${isActive ? 'ring-offset-slate-600' : 'ring-offset-primary'}
                        ${chat.type === 'private' && status ? getStatusColorClass(status, 'ring') : 'ring-transparent'}`}
                    src={avatarUrl}
                    alt={title}
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-text-primary truncate">{title}</p>
                    {lastMessage && (
                        <p className="text-xs text-text-secondary flex-shrink-0 ml-2">
                            {formatTimestamp(lastMessage.timestamp, user.settings?.timezone)}
                        </p>
                    )}
                </div>
                <div className="flex justify-between items-start">
                    <p className={secondaryTextClasses.join(' ')}>
                        <span className="inline-block max-w-full">
                            {lastMessagePreview}
                        </span>
                    </p>
                    {isUnread && (
                        <span className="w-2.5 h-2.5 bg-highlight rounded-full flex-shrink-0 mt-1.5 ml-2"></span>
                    )}
                </div>
            </div>
             <div ref={menuWrapperRef} className="relative z-10 opacity-0 group-hover:opacity-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(p => !p);
                    }}
                    className="p-1 text-text-secondary hover:text-white transition-colors"
                >
                    <DotsHorizontalIcon className="w-5 h-5"/>
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-primary rounded-lg shadow-2xl border border-slate-600 w-56 py-1 z-50 animate-fade-in-fast">
                        <MenuItem icon={StarIcon} text={chat.isFavorite ? "Unfavorite" : "Favorite"} onClick={() => { toggleFavorite(chat.id); setIsMenuOpen(false); }} />
                        <MenuItem icon={EnvelopeOpenIcon} text={isUnread ? "Mark as Read" : "Mark as Unread"} onClick={() => { markChatAsRead(chat.id, !!isUnread); setIsMenuOpen(false); }} />
                        <MenuItem icon={chat.isMuted ? BellOffIcon : BellIcon} text={chat.isMuted ? "Unmute" : "Mute"} onClick={() => { toggleMuteChat(chat.id); setIsMenuOpen(false); }} />
                        <MenuItem icon={EyeOffIcon} text="Hide Conversation" onClick={() => { hideChat(chat.id); setIsMenuOpen(false); }} />
                        <MenuItem icon={FolderIcon} text={chat.isArchived ? "Unarchive" : "Archive"} onClick={() => { archiveChat(chat.id); setIsMenuOpen(false); }} />
                        
                        {chat.type === 'private' ? (
                            <MenuItem icon={TrashIcon} text="Delete Conversation" isDestructive onClick={() => { deleteChat(chat.id); setIsMenuOpen(false); }} />
                        ) : (
                            <MenuItem icon={ArrowRightOnRectangleIcon} text="Leave Conversation" isDestructive onClick={() => { leaveGroup(chat.id); setIsMenuOpen(false); }} />
                        )}

                        {partner && (
                            <>
                               <div className="h-px bg-slate-600 my-1"></div>
                               <MenuItem icon={BanIcon} text={partner.isBlocked ? "Unblock Contact" : "Block Contact"} onClick={() => { toggleBlockContact(partner.id); setIsMenuOpen(false); }} isDestructive={!partner.isBlocked} />
                               <MenuItem icon={ShareIcon} text="Share Contact" onClick={() => { onInitiateShareContact(partner); setIsMenuOpen(false); }} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
});

const ContactListItem: React.FC<{ 
    contact: User, 
    onClick: () => void,
    onStartCall: (userId: string, callType: 'audio' | 'video') => void;
    onInitiateShareContact: (contact: User) => void;
}> = React.memo(({ contact, onClick, onStartCall, onInitiateShareContact }) => {
    const { toggleBlockContact } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuWrapperRef.current && !menuWrapperRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    return (
        <li onClick={() => onClick()} className="flex items-center p-3 mx-2 space-x-3 cursor-pointer rounded-lg hover:bg-secondary transition-colors group relative">
            <div className="relative flex-shrink-0">
                <img
                    className={`h-12 w-12 rounded-full ring-2 ring-offset-2 ring-offset-primary object-cover ${getStatusColorClass(contact.status, 'ring')}`}
                    src={getAvatarUrl(contact.name, contact.avatar)}
                    alt={contact.name}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{contact.name}</p>
                <p className="text-sm text-text-secondary">{contact.status}</p>
            </div>
            <div ref={menuWrapperRef} className="relative z-10 opacity-0 group-hover:opacity-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(p => !p);
                    }}
                    className="p-1 text-text-secondary hover:text-white transition-colors"
                >
                    <DotsHorizontalIcon className="w-5 h-5"/>
                </button>
                 {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-primary rounded-lg shadow-2xl border border-slate-600 w-56 py-1 z-50 animate-fade-in-fast">
                       <MenuItem icon={PhoneIcon} text="Audio Call" onClick={() => { onStartCall(contact.id, 'audio'); setIsMenuOpen(false); }} />
                       <MenuItem icon={VideoCameraIcon} text="Video Call" onClick={() => { onStartCall(contact.id, 'video'); setIsMenuOpen(false); }} />
                       <MenuItem icon={ShareIcon} text="Share Contact" onClick={() => { onInitiateShareContact(contact); setIsMenuOpen(false); }} />
                       <div className="h-px bg-slate-600 my-1"></div>
                       <MenuItem icon={BanIcon} text={contact.isBlocked ? "Unblock Contact" : "Block Contact"} isDestructive onClick={() => { toggleBlockContact(contact.id); setIsMenuOpen(false); }} />
                       <MenuItem icon={TrashIcon} text="Remove Contact" isDestructive onClick={() => { alert('Remove not implemented'); setIsMenuOpen(false); }} />
                    </div>
                )}
            </div>
        </li>
    );
});

const CallLogItem: React.FC<{ message: Message; onStartCall: (partnerId: string, callType: 'audio' | 'video') => void; }> = React.memo(({ message, onStartCall }) => {
    const { getContactById, user, deleteMessage, activeChatId } = useAppContext();
    const partnerId = message.senderId === user.id
        ? message.callInfo!.type === 'outgoing' ? activeChatId : 'system' // This logic seems flawed. Partner should be determined from chat.
        : message.senderId;

    const chat = useAppContext().chats.find(c => c.messages.some(m => m.id === message.id));
    if (!chat) return null;
    
    const truePartnerId = chat.participants.find(p => p !== user.id);
    if (!truePartnerId) return null;

    const partner = getContactById(truePartnerId);
    if (!partner) return null;

    const { callInfo, timestamp } = message;
    if (!callInfo) return null;

    let icon: React.ReactNode;
    let description = '';

    switch (callInfo.type) {
        case 'incoming':
            icon = <PhoneArrowDownLeftIcon className="w-5 h-5 text-green-500" />;
            description = `Incoming call ${formatCallDuration(callInfo.duration)}`;
            break;
        case 'outgoing':
            icon = <PhoneArrowUpRightIcon className="w-5 h-5 text-text-secondary" />;
            description = `Outgoing call ${formatCallDuration(callInfo.duration)}`;
            break;
        case 'missed':
             icon = <PhoneXMarkIcon className="w-5 h-5 text-red-500" />;
             description = `Missed call`;
            break;
    }
    
    return (
        <li className="flex items-center p-3 mx-2 space-x-3 cursor-pointer rounded-lg hover:bg-secondary group">
            <div className="relative flex-shrink-0">
                <img src={getAvatarUrl(partner.name, partner.avatar)} alt={partner.name} className="h-12 w-12 rounded-full" />
            </div>
             <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{partner.name}</p>
                <div className="flex items-center space-x-1 text-sm text-text-secondary">
                    {icon}
                    <span>{description}</span>
                </div>
            </div>
            <div className="text-sm text-text-secondary">{formatTimestamp(timestamp, user.settings?.timezone)}</div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => onStartCall(partner.id, 'audio')} className="p-2 text-text-secondary hover:text-white hover:bg-slate-700 rounded-full">
                    <PhoneIcon className="w-5 h-5" />
                </button>
                <button onClick={() => deleteMessage(chat.id, message.id, false)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-slate-700 rounded-full">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </li>
    );
});


const ListHeader: React.FC<{ 
    title: string, 
    onCompose?: () => void,
    onNewEvent?: () => void,
}> = ({ title, onCompose, onNewEvent }) => (
    <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-slate-700">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onCompose && <ComposeMenu onNewMessage={onCompose} onNewTeam={()=>{}}/>}
        {onNewEvent && <NewEventMenu onNewEvent={onNewEvent} />}
    </div>
);

interface SidebarProps {
    activeContent: 'chats' | 'calls' | 'contacts' | 'calendar';
    onInitiateShareContact: (contact: User) => void;
    onOpenProfilePictureModal: () => void;
    onOpenAddContact: () => void;
    onOpenNewChat: () => void;
    onOpenAddTeamChat: () => void;
    onStartCall: (userId: string, chatId: string, callType: 'audio' | 'video') => void;
    onOpenScheduleMeeting: (meeting?: Meeting, date?: Date) => void;
    onJoinMeeting: (meeting: Meeting) => void;
    onMeetingClick: (meeting: Meeting) => void;
    onMeetNow: () => void;
    onJoinWithId: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const { 
        onInitiateShareContact,
        onOpenProfilePictureModal,
        onOpenAddContact,
        onOpenNewChat,
        onStartCall,
        onOpenScheduleMeeting,
        onJoinMeeting,
        onMeetingClick,
        onMeetNow,
        onJoinWithId,
    } = props;
    const { chats, contacts, user, activeChatId, setActiveChatId, getOrCreatePrivateChat, getContactById } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const handleStartCall = (userId: string, callType: 'audio' | 'video') => {
        const chatId = getOrCreatePrivateChat(userId);
        props.onStartCall(userId, chatId, callType);
    };

    const handleContactClick = (userId: string) => {
        const chatId = getOrCreatePrivateChat(userId);
        setActiveChatId(chatId);
    };

    const renderContent = () => {
        switch (props.activeContent) {
            case 'chats': {
                 const sortedChats = useMemo(() => {
                    return [...chats]
                        .filter(c => !c.isHidden)
                        .sort((a, b) => {
                            if (a.isFavorite && !b.isFavorite) return -1;
                            if (!a.isFavorite && b.isFavorite) return 1;
                            const lastMsgA = a.messages[a.messages.length - 1];
                            const lastMsgB = b.messages[b.messages.length - 1];
                            if (lastMsgA && lastMsgB) {
                                return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
                            }
                            return 0;
                        });
                }, [chats]);

                const filteredChats = sortedChats.filter(c => {
                    let name = '';
                    if (c.type === 'private') {
                        const partnerId = c.participants.find(p => p !== user.id);
                        name = partnerId ? getContactById(partnerId)?.name || '' : '';
                    } else {
                        name = c.name || 'Group Chat';
                    }
                    return name.toLowerCase().includes(searchTerm.toLowerCase());
                });

                return (
                    <div className="flex-1 flex flex-col min-h-0">
                        <ListHeader title="Chats" onCompose={onOpenNewChat} />
                        <div className="p-2 flex-shrink-0">
                            <input type="text" placeholder="Search chats..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-secondary rounded-md px-3 py-1.5 text-sm" />
                        </div>
                        <ul className="flex-1 overflow-y-auto space-y-1 pb-2">
                            {filteredChats.map(chat => (
                                <ChatListItem
                                    key={chat.id}
                                    chat={chat}
                                    isActive={chat.id === activeChatId}
                                    onClick={() => setActiveChatId(chat.id)}
                                    onInitiateShareContact={onInitiateShareContact}
                                />
                            ))}
                        </ul>
                    </div>
                );
            }
            case 'contacts': {
                const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
                return (
                    <div className="flex-1 flex flex-col min-h-0">
                        <ListHeader title="Contacts" onCompose={onOpenAddContact} />
                         <div className="p-2 flex-shrink-0">
                            <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-secondary rounded-md px-3 py-1.5 text-sm" />
                        </div>
                        <ul className="flex-1 overflow-y-auto space-y-1 pb-2">
                             {filteredContacts.map(contact => (
                                <ContactListItem
                                    key={contact.id}
                                    contact={contact}
                                    onClick={() => handleContactClick(contact.id)}
                                    onStartCall={handleStartCall}
                                    onInitiateShareContact={onInitiateShareContact}
                                />
                             ))}
                        </ul>
                    </div>
                );
            }
            case 'calls': {
                 const callLogs = useMemo(() => chats.flatMap(c => c.messages.filter(m => m.type === 'call' && !m.isDeleted && !(m.deletedFor || []).includes(user.id)))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [chats, user.id]);
                return (
                    <div className="flex-1 flex flex-col min-h-0">
                        <ListHeader title="Calls" />
                         <div className="p-2 flex-shrink-0 flex items-center justify-between">
                            <button onClick={onMeetNow} className="px-4 py-2 bg-accent text-white font-semibold rounded-md text-sm hover:bg-highlight">Meet now</button>
                            <button onClick={onJoinWithId} className="px-4 py-2 bg-secondary border border-slate-600 font-semibold rounded-md text-sm hover:bg-slate-700">Join with ID</button>
                        </div>
                         <ul className="flex-1 overflow-y-auto space-y-1 pb-2">
                            {callLogs.map(log => <CallLogItem key={log.id} message={log} onStartCall={handleStartCall} />)}
                        </ul>
                    </div>
                );
            }
             case 'calendar': {
                 return (
                    <div className="flex-1 flex flex-col min-h-0">
                       <ListHeader title="Calendar" onNewEvent={() => onOpenScheduleMeeting()} />
                        <div className="p-2 flex-shrink-0">
                            <input type="text" placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-secondary rounded-md px-3 py-1.5 text-sm" />
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            <UserProfile onOpenProfilePictureModal={onOpenProfilePictureModal} />
            {renderContent()}
        </div>
    );
};