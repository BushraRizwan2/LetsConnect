import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { MediaViewer } from './MediaViewer';
import { ReactionDetailsModal } from './ReactionDetailsModal';
import { TranscriptViewerModal } from './TranscriptViewerModal';
import MessageInputBar from './MessageInputBar';
import { BellIcon, BellOffIcon, EyeOffIcon, PhoneIcon, VideoCameraIcon, XIcon, UserPlusIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, PinIcon, ClipboardDocumentIcon, CheckIcon, ShareIcon, TrashIcon, PencilIcon, ReplyIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, DotsHorizontalIcon, PaperclipIcon, FaceSmileIcon, MicrophoneOnIcon, SendIcon, PhotoIcon, DocumentTextIcon, CameraIcon, UserCircleIcon, LocationMarkerIcon, SparklesIcon } from './icons';
import { User, UserStatus, Message, Chat, TranscriptInfo } from '../types';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}

const DateSeparator: React.FC<{ date: Date, timezone?: string }> = React.memo(({ date, timezone }) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    const todayStr = formatter.format(today);
    const yesterdayStr = formatter.format(yesterday);
    const dateStr = formatter.format(date);

    let label = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: timezone });
    if (dateStr === todayStr) {
        label = 'Today';
    } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
    }

    return (
        <div className="flex justify-center my-4">
            <span className="bg-primary px-3 py-1 text-xs text-text-secondary rounded-full">{label}</span>
        </div>
    );
});

const CallLogEntry: React.FC<{ message: Message }> = React.memo(({ message }) => {
    const { callInfo, senderId, timestamp } = message;
    const { user } = useAppContext();
    if (!callInfo) return null;
    
    const isCurrentUserSender = senderId === user.id;

    const formatDuration = (sec: number) => {
        if (sec < 60) return `${sec}s`;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };
    
    const callIcons = {
        outgoing: <PhoneIcon className="w-4 h-4" />,
        incoming: <PhoneIcon className="w-4 h-4 text-green-500" />,
        missed: <PhoneIcon className="w-4 h-4 text-red-400" />,
    };

    let text = '';
    let icon = null;

    switch(callInfo.type) {
        case 'missed':
            text = isCurrentUserSender ? 'Unanswered call' : 'Missed call';
            icon = callIcons.missed;
            break;
        case 'outgoing':
            text = 'Outgoing call';
            icon = callIcons.outgoing;
            break;
        case 'incoming':
            text = 'Incoming call';
            icon = callIcons.incoming;
            break;
    }

    return (
        <div className="flex justify-center items-center my-2 space-x-2 text-sm text-text-secondary">
            {icon}
            <span>{text}</span>
            {callInfo.duration > 0 && <span>·</span>}
            {callInfo.duration > 0 && <span>{formatDuration(callInfo.duration)}</span>}
            <span>·</span>
            <span className="text-xs">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.settings?.timezone })}
            </span>
        </div>
    );
});

const SystemMessageEntry: React.FC<{ message: Message }> = React.memo(({ message }) => (
    <div className="flex justify-center items-center my-2">
        <p className="px-3 py-1 text-xs text-text-secondary bg-primary rounded-full">{message.content}</p>
    </div>
));

const getStatusColorClass = (status: UserStatus, type: 'bg' | 'ring'): string => {
    switch (status) {
        case UserStatus.Online: return `${type}-online`;
        case UserStatus.Busy: return `${type}-busy`;
        case UserStatus.Away: return `${type}-yellow-500`;
        case UserStatus.DoNotDisturb: return `${type}-red-600`;
        case UserStatus.Offline: 
            return type === 'ring' ? `ring-transparent` : 'bg-offline';
        default: return `${type}-transparent`;
    }
};

interface ChatHeaderProps {
    onStartCall: (callType: 'audio' | 'video') => void;
    onOpenAddPeoplePicker: () => void;
    isSearching: boolean;
    onToggleSearch: (isSearching: boolean) => void;
    onBack: () => void;
    onHeaderClick: () => void;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    searchResultsCount: number;
    currentResultIndex: number;
    onNavigateSearch: (direction: 'prev' | 'next') => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = React.memo<ChatHeaderProps>(({ onStartCall, onOpenAddPeoplePicker, onToggleSearch, onBack, onHeaderClick, isSearching, searchTerm, onSearchTermChange, searchResultsCount, currentResultIndex, onNavigateSearch }) => {
    const { activeChatId, chats, getContactById, user, updateContactName, updateChatName } = useAppContext();
    const chat = chats.find(c => c.id === activeChatId);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    let partner: User | undefined;
    let title = '';
    let availabilityStatus: UserStatus | string = '';
    let customStatusMessage: string | undefined;
    let avatarUrl = '';

    if (chat) {
        if (chat.type === 'private') {
            const partnerId = chat.participants.find(p => p !== user.id);
            partner = partnerId ? getContactById(partnerId) : undefined;
            if (partner) {
                title = partner.name;
                availabilityStatus = partner.status;
                customStatusMessage = partner.customStatusMessage;
                avatarUrl = getAvatarUrl(partner.name, partner.avatar);
            }
        } else {
            title = chat.name || 'Group Chat';
            const onlineCount = chat.participants.map(getContactById).filter(p => p?.status === UserStatus.Online).length;
            availabilityStatus = `${chat.participants.length} members, ${onlineCount} online`;
            avatarUrl = getAvatarUrl(title, chat.avatar);
        }
    }

    useEffect(() => {
        if(title) setEditedTitle(title);
        setIsEditing(false);
    }, [title, activeChatId]);


    const handleTitleSave = () => {
        if (editedTitle.trim() && activeChatId) {
            if(chat?.type === 'private' && partner) {
                updateContactName({ contactId: partner.id, name: editedTitle.trim() });
            } else if (chat?.type === 'group') {
                updateChatName({ chatId: activeChatId, name: editedTitle.trim() });
            }
        }
        setIsEditing(false);
    };
    
    if (!chat) return null;

    if (isSearching) {
        return (
            <div className="flex items-center justify-between w-full h-full animate-fade-in-fast">
                <div className="relative flex-grow">
                    <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary absolute left-0 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search in this chat..."
                        value={searchTerm}
                        onChange={e => onSearchTermChange(e.target.value)}
                        autoFocus
                        className="bg-transparent text-text-primary focus:outline-none w-full pl-7 pr-8"
                    />
                </div>
                <div className="flex items-center space-x-2 text-text-secondary flex-shrink-0 ml-2">
                    {searchResultsCount > 0 && (
                        <span className="text-sm">{currentResultIndex + 1} of {searchResultsCount}</span>
                    )}
                    {searchResultsCount === 0 && searchTerm.length > 1 && (
                        <span className="text-sm">No results</span>
                    )}
                    <button onClick={() => onNavigateSearch('prev')} disabled={searchResultsCount === 0} className="p-1 hover:text-white disabled:opacity-50">
                        <ChevronUpIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => onNavigateSearch('next')} disabled={searchResultsCount === 0} className="p-1 hover:text-white disabled:opacity-50">
                        <ChevronDownIcon className="w-5 h-5"/>
                    </button>
                    <div className="w-px h-5 bg-slate-600"></div>
                    <button onClick={() => onToggleSearch(false)} className="p-1 hover:text-white">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between w-full h-full animate-fade-in-fast">
             <button onClick={onHeaderClick} className="flex items-center space-x-2 md:space-x-4 text-left min-w-0">
                <div onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 -ml-2 text-text-secondary hover:text-white md:hidden" aria-label="Back to chat list">
                    <ChevronLeftIcon className="w-6 h-6" />
                </div>
                <img src={avatarUrl} alt={title} className={`w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-offset-primary transition-colors ${
                    chat.type === 'private' && partner?.status ? getStatusColorClass(partner.status, 'ring') : 'ring-transparent'
                }`} />
                <div className="min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            className="text-lg font-bold bg-secondary text-text-primary focus:outline-none focus:bg-slate-600 focus:ring-1 focus:ring-highlight rounded px-1 -ml-1 transition-colors"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-text-primary truncate">{title}</h2>
                            <button className="text-text-secondary hover:text-white flex-shrink-0 cursor-pointer" onClick={(e) => {e.stopPropagation(); setIsEditing(true);}}>
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div>
                      {chat.type === 'group' ? (
                          <p className="text-sm text-text-secondary truncate">{availabilityStatus}</p>
                      ) : customStatusMessage ? (
                          <p className="text-sm text-text-secondary truncate">{customStatusMessage}</p>
                      ) : (
                          <p className="text-sm text-text-secondary capitalize">{availabilityStatus}</p>
                      )}
                    </div>
                </div>
             </button>
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-2 flex-shrink-0">
                 {chat.type === 'group' && (
                    <button onClick={onOpenAddPeoplePicker} className="p-2 text-text-secondary hover:text-white transition-colors" title="Add People">
                        <UserPlusIcon className="w-6 h-6" />
                    </button>
                )}
                <button onClick={() => onStartCall('audio')} className="p-2 text-text-secondary hover:text-white transition-colors" title="Start Audio Call">
                    <PhoneIcon className="w-6 h-6" />
                </button>
                <button onClick={() => onStartCall('video')} className="p-2 text-text-secondary hover:text-white transition-colors" title="Start Video Call">
                    <VideoCameraIcon className="w-6 h-6" />
                </button>
                 <button onClick={() => onToggleSearch(true)} className="p-2 text-text-secondary hover:text-white transition-colors" title="Search in chat">
                    <MagnifyingGlassIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
});

const SelectionToolbar: React.FC<{
    count: number;
    onCancel: () => void;
    onForward: () => void;
    onCopy: () => void;
    onDelete: () => void;
    canCopy: boolean;
}> = React.memo(({ count, onCancel, onForward, onCopy, onDelete, canCopy }) => {
    return (
        <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="p-2 text-text-secondary hover:text-white">
                    <XIcon className="w-6 h-6"/>
                </button>
                <p className="font-bold text-lg text-text-primary">{count} Selected</p>
            </div>
            <div className="flex items-center gap-4">
                 <button onClick={onCopy} disabled={!canCopy} className="p-2 text-text-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title="Copy">
                    <ClipboardDocumentIcon className="w-6 h-6"/>
                </button>
                 <button onClick={onForward} className="p-2 text-text-secondary hover:text-white" title="Forward">
                    <ShareIcon className="w-6 h-6"/>
                </button>
                 <button onClick={onDelete} className="p-2 text-text-secondary hover:text-red-500" title="Delete">
                    <TrashIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
    )
});

const PinnedMessageBar: React.FC<{ chat: Chat; onUnpin: (messageId: string) => void; onJumpTo: (messageId: string) => void }> = React.memo(({ chat, onUnpin, onJumpTo }) => {
    if (!chat.pinnedMessages || chat.pinnedMessages.length === 0) return null;
    const pinnedMessageId = chat.pinnedMessages[chat.pinnedMessages.length - 1]; // Show the latest pinned message
    const message = chat.messages.find(m => m.id === pinnedMessageId);
    if (!message) return null;

    let contentPreview = message.content;
    if (message.type !== 'text') {
        contentPreview = `${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`;
    }

    return (
        <div className="bg-primary p-2 border-b border-slate-600 flex items-center justify-between text-sm animate-fade-in-fast">
            <div className="flex items-center min-w-0" onClick={() => onJumpTo(message.id)}>
                <PinIcon className="w-4 h-4 text-highlight mx-2 flex-shrink-0" />
                <p className="text-text-secondary truncate cursor-pointer hover:underline">
                    Pinned: <span className="text-text-primary">{contentPreview}</span>
                </p>
            </div>
            <button onClick={() => onUnpin(message.id)} className="p-1 text-text-secondary hover:text-white flex-shrink-0">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
});


const isImageMessage = (msg: Message): boolean => {
    if (!msg) return false;
    return msg.type === 'image' || (msg.type === 'file' && !!msg.fileInfo?.type.startsWith('image/'));
};


const GroupedImageMessage: React.FC<{ messages: Message[]; onImageClick: (message: Message) => void; onReply: (message: Message) => void; onStartSelection: (id: string) => void; }> = React.memo(({ messages, onImageClick, onReply, onStartSelection }) => {
    const { user } = useAppContext();
    const isCurrentUser = messages[0].senderId === user.id;

    const gridClasses: Record<number, string> = {
        2: "grid-cols-2 grid-rows-1",
        3: "grid-cols-2 grid-rows-2",
        4: "grid-cols-2 grid-rows-2",
    };
    
    const gridClass = gridClasses[messages.length] || "grid-cols-2 grid-rows-2";
    const lastMessage = messages[messages.length - 1];
    
    const getPhotoUrl = (message: Message): string => {
        if (message.fileInfo?.type.startsWith('image/')) {
            return message.fileInfo.url;
        }
        if (message.type === 'image') {
           return message.content;
        }
        return '';
    };

    return (
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
            <div className={`grid gap-1 p-1 rounded-2xl bg-primary max-w-xs ${gridClass}`}>
                {messages.slice(0, 4).map((msg, index) => {
                     const isLast = index === 3 && messages.length > 4;
                     const photoUrl = getPhotoUrl(msg);
                     return (
                        <div
                            key={msg.id}
                            onClick={() => onImageClick(msg)}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group 
                                ${messages.length === 3 && index === 0 ? 'row-span-2' : ''}
                            `}
                        >
                            <img src={photoUrl} alt="grouped image" className="w-full h-full object-cover" />
                             {isLast && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <p className="text-white text-2xl font-bold">+{messages.length - 3}</p>
                                </div>
                            )}
                        </div>
                     );
                })}
            </div>
            <div className="text-xs text-text-secondary mt-1 flex items-center">
                <span>{new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: user.settings?.timezone }).toLowerCase()}</span>
                {isCurrentUser && lastMessage.read && <CheckCircleIcon className="w-4 h-4 ml-1 text-highlight" />}
            </div>
        </div>
    )
});

const ChatWindow: React.FC<{
  onStartCall: (callType: 'audio' | 'video') => void;
  onOpenFilePicker: (accept?: string) => void;
  onOpenCamera: () => void;
  onOpenContactPicker: () => void;
  onOpenLocationPicker: () => void;
  onOpenForwardPicker: (sourceChatId: string, messageIds: string[]) => void;
  onOpenAddPeoplePicker: () => void;
  onOpenContactDetails: (user: User) => void;
  onOpenGroupDetails: (chat: Chat) => void;
  onBack: () => void;
}> = (props) => {
    const { activeChatId, chats, user, getContactById, togglePinMessage, copyToClipboard, deleteMessages, deleteMessage, pendingPrivateReply, clearPendingPrivateReply, getMessageById, typingStatus } = useAppContext();
    const chat = chats.find(c => c.id === activeChatId);
    
    // States
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [mediaToView, setMediaToView] = useState<{ messages: Message[]; startIndex: number } | null>(null);
    const [reactionModalMessage, setReactionModalMessage] = useState<Message | null>(null);
    const [viewingTranscript, setViewingTranscript] = useState<TranscriptInfo | null>(null);

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);
    
    // Selection state
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const isInSelectionMode = selectedMessageIds.length > 0;

    // Refs
    const mainRef = useRef<HTMLElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Record<string, HTMLDivElement>>({});
    const shouldScrollRef = useRef(true);

    const currentTypingUser = activeChatId ? typingStatus[activeChatId] : null;
    const showTypingIndicator = currentTypingUser && currentTypingUser.userId !== user.id;

    // Effect to track if user has scrolled away from the bottom
    useEffect(() => {
        const mainEl = mainRef.current;
        if (!mainEl) return;

        const handleScroll = () => {
            const threshold = 5; // A small pixel threshold
            const atBottom = mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight < threshold;
            shouldScrollRef.current = atBottom;
        };

        mainEl.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainEl.removeEventListener('scroll', handleScroll);
    }, []);

    // Effect to scroll on new messages IF user was at the bottom
    useEffect(() => {
        if (chat && chat.messages.length > 0) {
            if (shouldScrollRef.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [chat?.messages.length]);

    // Effect for initial load/chat switch, always scroll to bottom
    useEffect(() => {
        // A timeout ensures that the DOM has been updated and rendered before we try to scroll.
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 0);
        shouldScrollRef.current = true; // Reset scroll lock for new chat

        if (pendingPrivateReply && activeChatId === pendingPrivateReply.chatId) {
            const sourceMessage = getMessageById({ chatId: pendingPrivateReply.chatId, messageId: pendingPrivateReply.messageId });
            if(sourceMessage) {
                setReplyTo(sourceMessage);
            }
            clearPendingPrivateReply();
        }
        
        return () => clearTimeout(timer);
    }, [activeChatId, pendingPrivateReply, clearPendingPrivateReply, getMessageById]);

     useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
            setCurrentResultIndex(-1);
            return;
        }
        const results = chat?.messages
            .filter(m => m.type === 'text' && m.content.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(m => m.id) || [];
        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : -1);
    }, [searchTerm, chat?.messages]);

    const handleNavigateSearch = (direction: 'prev' | 'next') => {
        if (searchResults.length === 0) return;
        const newIndex = direction === 'next'
            ? (currentResultIndex + 1) % searchResults.length
            : (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentResultIndex(newIndex);

        const messageId = searchResults[newIndex];
        messageRefs.current[messageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleToggleSelection = (id: string) => {
        setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
    };
    
    const handleStartSelection = (id: string) => {
        setSelectedMessageIds([id]);
    };

    const handleCancelSelection = () => setSelectedMessageIds([]);
    
    const handleCopySelection = () => {
        if(!chat) return;
        const textToCopy = chat.messages
            .filter(m => selectedMessageIds.includes(m.id) && m.type === 'text')
            .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${getContactById(m.senderId)?.name}: ${m.content}`)
            .join('\n');
        copyToClipboard(textToCopy);
        handleCancelSelection();
    };

    const handleDeleteSelection = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedMessageIds.length} messages for yourself?`)) {
            if(activeChatId) deleteMessages({ chatId: activeChatId, messageIds: selectedMessageIds });
            handleCancelSelection();
        }
    };

    const handleForwardSelection = () => {
        if (activeChatId) props.onOpenForwardPicker(activeChatId, selectedMessageIds);
        handleCancelSelection();
    };

    const handleDeleteMessageFromViewer = (messageId: string, forEveryone: boolean) => {
        if (activeChatId) {
            deleteMessage({ chatId: activeChatId, messageId, forEveryone });
            setMediaToView(prev => {
                if (!prev) return null;
                const newMessages = prev.messages.filter(m => m.id !== messageId);
                if (newMessages.length === 0) return null;
                const newIndex = Math.min(prev.startIndex, newMessages.length - 1);
                return { messages: newMessages, startIndex: newIndex };
            });
        }
    };

    const handleForwardMessageFromViewer = (messageId: string) => {
        if (activeChatId) {
            props.onOpenForwardPicker(activeChatId, [messageId]);
            setMediaToView(null);
        }
    };
    
    const renderMessages = useMemo(() => {
        if (!chat) return null;
        
        const filteredMessages = chat.messages.filter(msg => !(msg.deletedFor || []).includes(user.id) && !msg.isDeleted);
        
        const renderableItems: (Message | { type: 'date_separator', id: string, date: Date } | {type: 'image_grid', id: string, messages: Message[]})[] = [];

        let lastDate: Date | null = null;
        let i = 0;
        while (i < filteredMessages.length) {
            const currentMsg = filteredMessages[i];
            const currentDate = new Date(currentMsg.timestamp);

            if (!lastDate || currentDate.toDateString() !== lastDate.toDateString()) {
                renderableItems.push({ type: 'date_separator', id: `date-${currentDate.toDateString()}`, date: currentDate });
                lastDate = currentDate;
            }

            if (isImageMessage(currentMsg)) {
                const imageGroup: Message[] = [];
                const senderId = currentMsg.senderId;
                const timeDiff = 2 * 60 * 1000; // 2 minutes
                let j = i;
                let lastTimestamp = new Date(currentMsg.timestamp).getTime();

                while (j < filteredMessages.length && isImageMessage(filteredMessages[j]) && filteredMessages[j].senderId === senderId && (new Date(filteredMessages[j].timestamp).getTime() - lastTimestamp) < timeDiff) {
                    imageGroup.push(filteredMessages[j]);
                    lastTimestamp = new Date(filteredMessages[j].timestamp).getTime();
                    j++;
                }

                if (imageGroup.length > 1) {
                    renderableItems.push({ type: 'image_grid', id: `grid-${imageGroup[0].id}`, messages: imageGroup });
                    i = j;
                    continue;
                }
            }

            renderableItems.push(currentMsg);
            i++;
        }
        
        return renderableItems.map(item => {
            switch(item.type) {
                case 'date_separator':
                    return <DateSeparator key={item.id} date={item.date} timezone={user.settings?.timezone} />;
                case 'image_grid':
                    return <GroupedImageMessage key={item.id} messages={item.messages} onImageClick={(msg) => setMediaToView({ messages: chat.messages.filter(m => isImageMessage(m)), startIndex: chat.messages.filter(m => isImageMessage(m)).findIndex(m => m.id === msg.id) })} onReply={setReplyTo} onStartSelection={handleStartSelection} />;
                case 'call':
                    return <CallLogEntry key={item.id} message={item} />;
                case 'text':
                case 'image':
                case 'file':
                case 'contact':
                case 'location':
                case 'audio':
                case 'transcript':
                    if (item.senderId === 'system') {
                        return <SystemMessageEntry key={item.id} message={item} />;
                    }
                    return (
                        <MessageBubble
                            ref={el => { if(el) messageRefs.current[item.id] = el; }}
                            key={item.id}
                            message={item}
                            onReply={setReplyTo}
                            onJumpToMessage={(id) => messageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            isInSelectionMode={isInSelectionMode}
                            isSelected={selectedMessageIds.includes(item.id)}
                            onToggleSelection={handleToggleSelection}
                            onStartSelection={handleStartSelection}
                            onStartForwarding={(id) => props.onOpenForwardPicker(activeChatId!, [id])}
                            searchTerm={searchTerm}
                            isCurrentResult={searchResults[currentResultIndex] === item.id}
                            onImageClick={(msg) => setMediaToView({ messages: chat.messages.filter(m => isImageMessage(m)), startIndex: chat.messages.filter(m => isImageMessage(m)).findIndex(m => m.id === msg.id) })}
                            onShowReactions={setReactionModalMessage}
                            onViewTranscript={setViewingTranscript}
                        />
                    );
                default:
                    return null;
            }
        });
    }, [chat, user.id, user.settings?.timezone, selectedMessageIds, searchTerm, currentResultIndex, searchResults]);
    
    if (!chat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-secondary text-text-secondary">
                 <UserCircleIcon className="w-24 h-24 text-slate-600" />
                 <h2 className="mt-2 text-xl font-bold text-text-primary">No chat selected</h2>
                 <p>Select a conversation from the list to start messaging.</p>
            </div>
        );
    }
    
    const partnerId = chat.type === 'private' ? chat.participants.find(p => p !== user.id) : undefined;
    const partner = partnerId ? getContactById(partnerId) : undefined;

    return (
        <div className="flex flex-col h-full bg-secondary">
            <header className="flex-shrink-0 h-[77px] px-4 border-b border-primary">
                {isInSelectionMode ? (
                    <SelectionToolbar 
                        count={selectedMessageIds.length} 
                        onCancel={handleCancelSelection}
                        onCopy={handleCopySelection}
                        onDelete={handleDeleteSelection}
                        onForward={handleForwardSelection}
                        canCopy={chat.messages.some(m => selectedMessageIds.includes(m.id) && m.type === 'text')}
                    />
                ) : (
                    <ChatHeader 
                        onStartCall={props.onStartCall} 
                        onOpenAddPeoplePicker={props.onOpenAddPeoplePicker}
                        isSearching={isSearching}
                        onToggleSearch={setIsSearching}
                        onBack={props.onBack}
                        onHeaderClick={() => chat.type === 'private' && partner ? props.onOpenContactDetails(partner) : props.onOpenGroupDetails(chat) }
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        searchResultsCount={searchResults.length}
                        currentResultIndex={currentResultIndex}
                        onNavigateSearch={handleNavigateSearch}
                    />
                )}
            </header>
            
            <PinnedMessageBar 
                chat={chat} 
                onUnpin={(id) => togglePinMessage({ chatId: chat.id, messageId: id })}
                onJumpTo={(id) => messageRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            />

            <main ref={mainRef} className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {renderMessages}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            <footer className="flex-shrink-0 border-t border-primary p-2">
                <div className="h-6">
                  {showTypingIndicator && <TypingIndicator name={currentTypingUser.name.split(' ')[0]} />}
                </div>
                <MessageInputBar
                    chatId={activeChatId!}
                    onOpenFilePicker={props.onOpenFilePicker}
                    onOpenCamera={props.onOpenCamera}
                    onOpenContactPicker={props.onOpenContactPicker}
                    onOpenLocationPicker={props.onOpenLocationPicker}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                />
            </footer>
             {mediaToView && <MediaViewer 
                messages={mediaToView.messages} 
                initialIndex={mediaToView.startIndex} 
                onClose={() => setMediaToView(null)} 
                onDelete={handleDeleteMessageFromViewer}
                onForward={handleForwardMessageFromViewer}
             />}
             {reactionModalMessage && <ReactionDetailsModal message={reactionModalMessage} onClose={() => setReactionModalMessage(null)} />}
             {viewingTranscript && <TranscriptViewerModal transcriptInfo={viewingTranscript} onClose={() => setViewingTranscript(null)} />}
        </div>
    );
};

export default ChatWindow;
