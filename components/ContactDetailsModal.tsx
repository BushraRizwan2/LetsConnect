
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserStatus, Chat, Meeting, Message } from '../types';
import { MediaViewer } from './MediaViewer';
import { 
    XIcon, EmailIcon, CakeIcon, LocationMarkerIcon, HashtagIcon, DocumentTextIcon, LinkIcon,
    ArrowDownTrayIcon, VideoCameraIcon, BanIcon, TrashIcon, EyeOffIcon, PhoneIcon,
    ChatBubbleLeftRightIcon, ShareIcon, BellOffIcon, BellIcon, PencilIcon, UserPlusIcon, PinIcon, UnpinIcon, ChevronRightIcon,
    ForwardIcon, CheckIcon, MusicalNoteIcon, ExclamationTriangleIcon
} from './icons';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}

const getStatusBgColorClass = (status: UserStatus): string => {
    switch (status) {
        case UserStatus.Online: return 'bg-online';
        case UserStatus.Busy: return 'bg-busy';
        case UserStatus.Away: return 'bg-yellow-500';
        case UserStatus.DoNotDisturb: return 'bg-red-600';
        case UserStatus.Offline: return 'bg-offline';
        default: return 'bg-transparent';
    }
};

const InfoRow: React.FC<{ icon: React.FC<{ className?: string }>; children: React.ReactNode }> = ({ icon: Icon, children }) => (
    <div className="flex items-start space-x-4 py-2">
        <Icon className="w-5 h-5 text-text-secondary mt-1 flex-shrink-0" />
        <div className="text-sm text-text-primary min-w-0 break-words">{children}</div>
    </div>
);

type MainTab = 'details' | 'files' | 'groups' | 'calendar';
type MediaTab = 'photos' | 'files' | 'links';

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ label, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
      isActive
        ? 'border-highlight text-text-primary'
        : 'border-transparent text-text-secondary hover:border-slate-500 hover:text-text-primary'
    }`}
  >
    <span>{label}</span>
    {typeof count === 'number' && count > 0 && <span className="text-xs bg-slate-600 px-1.5 py-0.5 rounded-full">{count}</span>}
  </button>
);

const DetailsSection: React.FC<{ contact: User }> = ({ contact }) => (
    <div className="p-4">
         <div className="bg-secondary rounded-lg p-4">
            <h4 className="font-semibold text-sm text-text-secondary mb-1">Contact information</h4>
            {contact.email && <InfoRow icon={EmailIcon}><a href={`mailto:${contact.email}`} className="text-text-primary hover:underline">{contact.email}</a></InfoRow>}
            {contact.phone && <InfoRow icon={PhoneIcon}><a href={`tel:${contact.phone}`} className="text-text-primary hover:underline">{contact.phone}</a></InfoRow>}
            {contact.location && <InfoRow icon={LocationMarkerIcon}>{contact.location}</InfoRow>}
            {contact.birthday && <InfoRow icon={CakeIcon}>{new Date(contact.birthday).toLocaleDateString('default', { month: 'long', day: 'numeric', timeZone: 'UTC' })}</InfoRow>}
            {contact.skypeName && <InfoRow icon={HashtagIcon}>{contact.skypeName}</InfoRow>}
         </div>
    </div>
);

const FilesSectionConfirmationDialog: React.FC<{ 
    itemCount: number;
    itemTypeLabel: string;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ itemCount, itemTypeLabel, onCancel, onConfirm }) => {
    const title = `Delete ${itemTypeLabel.charAt(0).toUpperCase()}${itemTypeLabel.slice(1, -3)}s`;

    return (
        <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-primary rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-text-secondary mb-6">Are you sure you want to remove the {itemCount} selected {itemTypeLabel}?</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 font-semibold">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const FilesSection: React.FC<{ chat: Chat | undefined; onOpenForwardPicker: (messageIds: string[]) => void }> = ({ chat, onOpenForwardPicker }) => {
    const { user, deleteMessages } = useAppContext();
    const [activeTab, setActiveTab] = useState<MediaTab>('photos');
    const [showAll, setShowAll] = useState<Record<MediaTab, boolean>>({ photos: false, files: false, links: false });

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [mediaToView, setMediaToView] = useState<{ messages: Message[]; startIndex: number } | null>(null);
    
    const getPhotoUrl = (message: Message): string => {
        if (message.type === 'image') return message.content;
        if (message.type === 'file' && message.fileInfo?.type.startsWith('image/')) {
            return message.fileInfo.url;
        }
        return '';
    };

    const photos = chat?.messages.filter(m => !(m.deletedFor || []).includes(user.id) && (m.type === 'image' || (m.type === 'file' && m.fileInfo?.type.startsWith('image/')))) || [];
    const files = chat?.messages.filter(m => !(m.deletedFor || []).includes(user.id) && ((m.type === 'file' && !m.fileInfo?.type.startsWith('image/')) || m.type === 'audio')) || [];
    const links = (chat?.messages.filter(m => !(m.deletedFor || []).includes(user.id) && m.type === 'text' && !!m.content.match(/(https?:\/\/[^\s]+)/g)) || [])
        .flatMap((m) => 
            (m.content.match(/(https?:\/\/[^\s]+)/g) || []).map((url, urlIndex) => ({
                id: `${m.id}-link-${urlIndex}`,
                messageId: m.id,
                url, 
                timestamp: m.timestamp 
            }))
        );
    
    const mediaMap = { photos, files, links };

    useEffect(() => {
        setIsSelectionMode(false);
        setSelectedItems([]);
    }, [activeTab]);

    const handleToggleSelection = (id: string) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        const currentMedia = mediaMap[activeTab];
        const allIds = currentMedia.map(item => 'id' in item ? item.id : '');
        if (selectedItems.length === allIds.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allIds);
        }
    };
    
    const handleConfirmDelete = () => {
        if (selectedItems.length === 0 || !chat) return;
        const messageIdsToDelete = Array.from(new Set(selectedItems.map(itemId => {
            if (activeTab === 'links') {
                const link = links.find(l => l.id === itemId);
                return link?.messageId;
            }
            return itemId;
        }).filter((id): id is string => !!id)));

        deleteMessages(chat.id, messageIdsToDelete);
        setSelectedItems([]);
        setShowConfirmDelete(false);
    };
    
    const handleDeleteSelected = () => {
        if (selectedItems.length > 0) {
            setShowConfirmDelete(true);
        }
    };
    
    const handleForwardSelected = () => {
        if (selectedItems.length === 0) return;
        const messageIdsToForward = Array.from(new Set(selectedItems.map(itemId => {
            if (activeTab === 'links') {
                const link = links.find(l => l.id === itemId);
                return link?.messageId;
            }
            return itemId;
        }).filter((id): id is string => !!id)));
        onOpenForwardPicker(messageIdsToForward);
    };
    
    const handleDownloadSelected = async () => {
        if (activeTab === 'links') {
            const urlsToCopy = links.filter(l => selectedItems.includes(l.id)).map(l => l.url).join('\n');
            await navigator.clipboard.writeText(urlsToCopy);
            alert(`${selectedItems.length} links copied!`);
        } else {
             alert(`Downloading ${selectedItems.length} files... (Not implemented in demo)`);
        }
    };

    const renderContent = () => {
        const currentMedia = mediaMap[activeTab];
        const showMore = !showAll[activeTab] && currentMedia.length > 5 && !isSelectionMode;
        const displayedMedia = showAll[activeTab] || isSelectionMode ? currentMedia : currentMedia.slice(0, 5);

        if (currentMedia.length === 0) {
            return <p className="text-center text-text-secondary py-8">No {activeTab} shared yet.</p>;
        }

        const renderItem = (item: any, index: number) => {
            const isSelected = selectedItems.includes(item.id);
            const commonClasses = `aspect-square bg-secondary rounded-lg overflow-hidden transition-all duration-200`;
            switch(activeTab) {
                case 'photos':
                    return (
                        <div key={item.id} onClick={() => isSelectionMode ? handleToggleSelection(item.id) : setMediaToView({ messages: photos, startIndex: index })} className={`relative cursor-pointer group ${commonClasses}`}>
                            <img src={getPhotoUrl(item)} alt="Shared media" className="w-full h-full object-cover" />
                            {isSelectionMode && (
                                <div className={`absolute inset-0 flex items-center justify-center ${isSelected ? 'bg-black/50' : 'bg-transparent'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-accent border-accent' : 'border-white/50 bg-black/20' } flex items-center justify-center`}>
                                        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                case 'files':
                     return (
                         <div key={item.id} onClick={() => isSelectionMode && handleToggleSelection(item.id)} className={`relative flex items-center p-3 rounded-lg cursor-pointer ${isSelected ? 'bg-slate-700' : 'bg-primary'}`}>
                            {item.type === 'audio' ? (
                                <MusicalNoteIcon className="w-8 h-8 text-text-secondary mr-4 flex-shrink-0" />
                            ) : (
                                <DocumentTextIcon className="w-8 h-8 text-text-secondary mr-4 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{item.type === 'audio' ? 'Voice Note' : item.fileInfo.name}</p>
                                <p className="text-sm text-text-secondary">{item.type === 'audio' ? `${item.audioInfo?.duration || 0}s` : item.fileInfo.size}</p>
                            </div>
                            {isSelectionMode && (
                                <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-accent border-accent' : 'border-slate-500'} flex items-center justify-center`}>
                                    {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                </div>
                            )}
                        </div>
                     );
                case 'links':
                    return (
                        <div key={item.id} onClick={() => isSelectionMode && handleToggleSelection(item.id)} className={`relative flex items-center p-3 rounded-lg cursor-pointer ${isSelected ? 'bg-slate-700' : 'bg-primary'}`}>
                            <LinkIcon className="w-6 h-6 text-text-secondary mr-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-highlight hover:underline truncate min-w-0" onClick={e => isSelectionMode && e.preventDefault()}>
                                    {item.url}
                                </a>
                                <p className="text-xs text-text-secondary mt-1">{new Date(item.timestamp).toLocaleDateString(undefined, { timeZone: user.settings?.timezone })}</p>
                            </div>
                            {isSelectionMode && (
                                 <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-accent border-accent' : 'border-slate-500'} flex items-center justify-center`}>
                                    {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                </div>
                            )}
                        </div>
                    );
            }
        };

        const gridClass = activeTab === 'photos' ? 'grid grid-cols-3 gap-2' : 'space-y-2';

        return (
            <div className="space-y-2">
                <div className={gridClass}>
                    {displayedMedia.map((item, index) => (
                        <React.Fragment key={'id' in item ? item.id : ''}>{renderItem(item, index)}</React.Fragment>
                    ))}
                    {showMore && activeTab === 'photos' && photos.length > 5 && (
                        <button onClick={() => setShowAll({ ...showAll, photos: true })} className="relative aspect-square bg-secondary rounded-lg overflow-hidden flex items-center justify-center group">
                            <img src={getPhotoUrl(photos[5])} alt="Show more" className="w-full h-full object-cover brightness-50" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">&gt;</span>
                            </div>
                        </button>
                    )}
                </div>
                {showMore && activeTab !== 'photos' && (
                    <button onClick={() => setShowAll({ ...showAll, [activeTab]: true })} className="w-full text-center py-2 text-sm font-semibold text-highlight hover:underline">
                        Show More
                    </button>
                )}
            </div>
        );
    };
    
    return (
        <div className="flex flex-col h-full relative">
            {mediaToView && (
                <MediaViewer
                    messages={mediaToView.messages}
                    initialIndex={mediaToView.startIndex}
                    onClose={() => setMediaToView(null)}
                />
            )}
            <div className="flex-shrink-0 border-b border-slate-700 px-2 flex justify-between items-center">
                {isSelectionMode ? (
                     <div className="flex items-center space-x-2">
                        <button onClick={handleSelectAll} className="p-2 text-sm font-semibold text-highlight">
                            {selectedItems.length === mediaMap[activeTab].length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                ) : (
                    <div className="flex space-x-2">
                        <TabButton label="Photos" count={photos.length} isActive={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
                        <TabButton label="Files" count={files.length} isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />
                        <TabButton label="Links" count={links.length} isActive={activeTab === 'links'} onClick={() => setActiveTab('links')} />
                    </div>
                )}
                 {!isSelectionMode ? (
                    <button onClick={() => setIsSelectionMode(true)} className="p-2 text-sm font-semibold text-highlight" disabled={mediaMap[activeTab].length === 0}>Select</button>
                ) : (
                    <div className="flex items-center space-x-1">
                        <button onClick={handleForwardSelected} title="Forward" className="p-2 text-text-secondary hover:text-white disabled:opacity-50" disabled={selectedItems.length === 0}><ForwardIcon className="w-5 h-5"/></button>
                        <button onClick={handleDownloadSelected} title="Download/Copy" className="p-2 text-text-secondary hover:text-white disabled:opacity-50" disabled={selectedItems.length === 0}><ArrowDownTrayIcon className="w-5 h-5"/></button>
                        <button onClick={handleDeleteSelected} title="Delete" className="p-2 text-text-secondary hover:text-red-500 disabled:opacity-50" disabled={selectedItems.length === 0}><TrashIcon className="w-5 h-5"/></button>
                        <button onClick={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="p-2 text-text-secondary hover:text-white"><XIcon className="w-5 h-5"/></button>
                    </div>
                )}
            </div>
            <div className={`flex-1 overflow-y-auto p-4 ${isSelectionMode ? 'bg-secondary' : ''}`}>
                {!chat && <p className="text-center text-text-secondary py-8">No chat history found.</p>}
                {chat && renderContent()}
            </div>
             {showConfirmDelete && <FilesSectionConfirmationDialog 
                itemCount={selectedItems.length}
                itemTypeLabel={activeTab === 'photos' ? 'photo(s)' : activeTab === 'files' ? 'file(s)' : 'link(s)'}
                onCancel={() => setShowConfirmDelete(false)}
                onConfirm={handleConfirmDelete}
             />}
        </div>
    );
};

const SharedGroupsSection: React.FC<{ contact: User }> = ({ contact }) => {
    const { user, chats } = useAppContext();
    const sharedGroups = chats.filter(c => 
        c.type === 'group' && 
        c.participants.includes(user.id) &&
        c.participants.includes(contact.id)
    );

    return (
        <div className="p-4 space-y-3">
             {sharedGroups.length > 0 ? (
                sharedGroups.map(chat => (
                    <div key={chat.id} className="flex items-center p-2 bg-secondary rounded-lg">
                        <img src={getAvatarUrl(chat.name || 'Group', chat.avatar)} alt={chat.name} className="w-10 h-10 rounded-full mr-3" />
                        <div>
                            <p className="font-semibold">{chat.name}</p>
                            <p className="text-sm text-text-secondary">{chat.participants.length} members</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-text-secondary">No shared groups.</p>
            )}
        </div>
    );
};

const CalendarSection: React.FC<{ contact: User; onOpenMeetingDetails: (meeting: Meeting) => void; onJoinMeeting: (meeting: Meeting) => void; onOpenChat: (chatId: string) => void; }> = ({ contact, onOpenMeetingDetails, onJoinMeeting, onOpenChat }) => {
    const { user, chats } = useAppContext();
    const allMeetings = useMemo(() => chats.flatMap(c => c.meetings || []), [chats]);
    
    const sharedMeetings = useMemo(() => 
        allMeetings
            .filter(m => 
                !m.isCancelled &&
                new Date(m.startTime) > new Date() &&
                m.participants.some(p => p.email === user.email) &&
                m.participants.some(p => p.email === contact.email)
            )
            .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    , [allMeetings, user.email, contact.email]);

    const formatMeetingTime = (meeting: Meeting) => {
        const date = new Date(meeting.startTime);
        return date.toLocaleString('default', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: user.settings?.timezone
        });
    };

    return (
         <div className="p-4 space-y-3">
             {sharedMeetings.length > 0 ? (
                sharedMeetings.map(meeting => (
                    <div key={meeting.id} className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-slate-700" onClick={() => onOpenMeetingDetails(meeting)}>
                       <div className="flex items-center">
                           <VideoCameraIcon className="w-8 h-8 text-text-secondary mr-4 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold">{meeting.title}</p>
                                <p className="text-sm text-text-secondary">{formatMeetingTime(meeting)}</p>
                            </div>
                       </div>
                       <div className="flex justify-end space-x-2 mt-2">
                           <button onClick={(e) => { e.stopPropagation(); onOpenChat(meeting.chatId); }} className="px-3 py-1 text-xs font-semibold bg-slate-600 rounded-md hover:bg-slate-500">Chat</button>
                           <button onClick={(e) => { e.stopPropagation(); onJoinMeeting(meeting); }} className="px-3 py-1 text-xs font-semibold bg-accent rounded-md hover:bg-highlight">Join</button>
                       </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-text-secondary">No upcoming meetings together.</p>
            )}
        </div>
    );
};

interface ContactDetailsModalProps {
    user: User;
    onClose: () => void;
    onStartCall: (userId: string, chatId: string, callType: 'audio' | 'video') => void;
    onInitiateShareContact: (contact: User) => void;
    onAddParticipant: (chatId: string, participants: User[]) => void;
    onOpenMeetingDetails: (meeting: Meeting) => void;
    onJoinMeeting: (meeting: Meeting) => void;
    onOpenChat: (chatId: string) => void;
    onOpenForwardPicker: (messageIds: string[]) => void;
}

const ConfirmationDialog: React.FC<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    isDestructive?: boolean;
}> = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = true }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in-fast">
            <div className="bg-primary rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                <ExclamationTriangleIcon className={`w-12 h-12 ${isDestructive ? 'text-red-500' : 'text-yellow-500'} mx-auto mb-4`} />
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-text-secondary mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 font-semibold">
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-6 py-2 rounded-lg ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-highlight'} text-white font-semibold`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ContactDetailsModalWithoutMemo: React.FC<ContactDetailsModalProps> = ({ user: contact, onClose, onStartCall, onInitiateShareContact, onAddParticipant, onOpenMeetingDetails, onJoinMeeting, onOpenChat, onOpenForwardPicker }) => {
    const { 
        user: currentUser, 
        chats, 
        toggleBlockContact, 
        deleteChat, 
        hideChat,
        toggleMuteChat,
        toggleFavorite,
        getOrCreatePrivateChat,
        setActiveChatId,
        updateContactName
    } = useAppContext();

    const [activeTab, setActiveTab] = useState<MainTab>('details');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(contact.name);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmBlock, setShowConfirmBlock] = useState(false);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
    
    const privateChat = useMemo(() => chats.find(c => c.type === 'private' && c.participants.includes(contact.id) && c.participants.includes(currentUser.id)), [chats, contact.id, currentUser.id]);

    const mediaCount = useMemo(() => {
        if (!privateChat) return 0;
        const photosCount = (privateChat.messages || []).filter(m => !(m.deletedFor || []).includes(currentUser.id) && (m.type === 'image' || (m.type === 'file' && m.fileInfo?.type.startsWith('image/')))).length;
        const filesCount = (privateChat.messages || []).filter(m => !(m.deletedFor || []).includes(currentUser.id) && ((m.type === 'file' && !m.fileInfo?.type.startsWith('image/')) || m.type === 'audio')).length;
        const linksCount = (privateChat.messages || []).filter(m => !(m.deletedFor || []).includes(currentUser.id) && m.type === 'text')
            .reduce((acc, m) => acc + (m.content.match(/(https?:\/\/[^\s]+)/g) || []).length, 0);
        return photosCount + filesCount + linksCount;
    }, [privateChat, currentUser.id]);


    const handleNameSave = useCallback(() => {
        if (editedName.trim() && editedName.trim() !== contact.name) {
            updateContactName(contact.id, editedName.trim());
        }
        setIsEditingName(false);
    }, [editedName, contact.id, contact.name, updateContactName]);
    
    const executeBlock = useCallback(() => {
        toggleBlockContact(contact.id);
        setShowConfirmBlock(false);
    }, [contact.id, toggleBlockContact]);

    const executeDelete = useCallback(() => {
        if (privateChat) {
            deleteChat(privateChat.id);
            setShowConfirmDelete(false);
            onClose();
        }
    }, [privateChat, deleteChat, onClose]);
    
    const handleHideConversation = useCallback(() => {
        if (privateChat) {
            hideChat(privateChat.id);
            onClose();
        }
    }, [privateChat, hideChat, onClose]);
    
    const handleMessage = useCallback(() => {
        const chatId = getOrCreatePrivateChat(contact.id);
        setActiveChatId(chatId);
        onClose();
    }, [contact.id, getOrCreatePrivateChat, setActiveChatId, onClose]);

    const handleCall = useCallback(() => {
        const chatId = getOrCreatePrivateChat(contact.id);
        onStartCall(contact.id, chatId, 'audio');
        onClose();
    }, [contact.id, getOrCreatePrivateChat, onStartCall, onClose]);

    const handleShare = useCallback(() => {
        onInitiateShareContact(contact);
    }, [onInitiateShareContact, contact]);

    const handleAddParticipant = useCallback(() => {
        const chatId = getOrCreatePrivateChat(contact.id);
        onAddParticipant(chatId, [currentUser, contact]);
    }, [getOrCreatePrivateChat, onAddParticipant, currentUser, contact]);

    const handlePinChat = useCallback(() => {
        const chatId = getOrCreatePrivateChat(contact.id);
        toggleFavorite(chatId);
    }, [getOrCreatePrivateChat, contact.id, toggleFavorite]);
    
    const handleMuteToggle = useCallback(() => {
        const chatId = getOrCreatePrivateChat(contact.id);
        toggleMuteChat(chatId);
    }, [getOrCreatePrivateChat, contact.id, toggleMuteChat]);

    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case 'details':
                return <DetailsSection contact={contact} />;
            case 'files':
                return <FilesSection chat={privateChat} onOpenForwardPicker={onOpenForwardPicker} />;
            case 'groups':
                return <SharedGroupsSection contact={contact} />;
            case 'calendar':
                return <CalendarSection contact={contact} onOpenMeetingDetails={onOpenMeetingDetails} onJoinMeeting={onJoinMeeting} onOpenChat={onOpenChat} />;
            default:
                return <DetailsSection contact={contact} />;
        }
    }, [activeTab, contact, privateChat, onOpenForwardPicker, onOpenMeetingDetails, onJoinMeeting, onOpenChat]);
    
    const FooterActionButton: React.FC<{ icon: React.FC<{ className?: string }>, label: string, onClick: () => void, isDestructive?: boolean, hasBackground?: boolean }> = ({ icon: Icon, label, onClick, isDestructive = false, hasBackground = false }) => (
        <button onClick={onClick} className={`flex flex-col items-center space-y-1 p-2 rounded-lg w-24 group transition-colors 
            ${hasBackground ? 'bg-slate-700' : ''} 
            ${isDestructive 
                ? 'text-red-400 hover:bg-slate-700 hover:text-red-300' 
                : 'text-text-secondary hover:text-white hover:bg-slate-700'
            }`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );

    const PrimaryActionButton: React.FC<{ icon: React.FC<{ className?: string }>, label: string, onClick: () => void, hasBackground?: boolean }> = ({ icon: Icon, label, onClick, hasBackground }) => {
        const PinOrUnpinIcon = privateChat?.isFavorite ? UnpinIcon : PinIcon;
        const FinalIcon = label === "Pin" || label === "Unpin" ? PinOrUnpinIcon : Icon;

        return (
            <button onClick={onClick} className={`flex flex-col items-center space-y-1 p-2 rounded-lg w-full text-text-secondary hover:text-white transition-colors ${hasBackground ? 'bg-slate-700 hover:bg-slate-600' : 'hover:bg-slate-700'}`}>
                <FinalIcon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
            </button>
        );
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex md:items-center md:justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-primary w-full h-full md:h-auto md:max-h-[90vh] md:rounded-xl shadow-2xl md:max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex-shrink-0">
                    <div className="relative">
                        <button onClick={() => setZoomedImageUrl(`https://picsum.photos/seed/${contact.id}/800/256`)} className="w-full">
                            <img src={`https://picsum.photos/seed/${contact.id}/400/128`} alt="Cover" className="w-full h-32 object-cover md:rounded-t-xl" />
                        </button>
                        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-white hover:text-gray-200 z-20">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div className="absolute -bottom-12 left-6">
                            <button onClick={() => setZoomedImageUrl(contact.avatar)}>
                                <div className="relative">
                                    <img src={getAvatarUrl(contact.name, contact.avatar)} alt={contact.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary" />
                                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-primary ${getStatusBgColorClass(contact.status)}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                     <div className="pt-14 px-6 pb-4">
                        <div className="flex items-center gap-2">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={e => setEditedName(e.target.value)}
                                    onBlur={handleNameSave}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); }}
                                    autoFocus
                                    className="text-2xl font-bold bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-highlight rounded px-1 -ml-1 w-full"
                                />
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-text-primary truncate">{contact.name}</h2>
                                    <button onClick={() => setIsEditingName(true)} className="p-1 text-text-secondary hover:text-white hover:bg-slate-700 rounded-full flex-shrink-0 transition-colors">
                                        <PencilIcon className="w-5 h-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-text-secondary">{contact.customStatusMessage || contact.status}</p>

                        <div className="mt-6 grid grid-cols-5 gap-2 text-center">
                            <PrimaryActionButton icon={ChatBubbleLeftRightIcon} label="Message" onClick={handleMessage} />
                            <PrimaryActionButton icon={PhoneIcon} label="Call" onClick={handleCall} />
                            <PrimaryActionButton icon={ShareIcon} label="Share" onClick={handleShare} />
                            <PrimaryActionButton icon={UserPlusIcon} label="Add" onClick={handleAddParticipant} />
                            <PrimaryActionButton icon={PinIcon} label={privateChat?.isFavorite ? "Unpin" : "Pin"} onClick={handlePinChat} hasBackground={!!privateChat?.isFavorite}/>
                        </div>
                     </div>
                </div>
                
                {/* Tabs */}
                <div className="flex-shrink-0 border-y border-slate-700 px-2">
                    <div className="flex space-x-2">
                        <TabButton label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                        <TabButton label="Files" count={mediaCount} isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />
                        <TabButton label="Groups" isActive={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
                        <TabButton label="Calendar" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {renderTabContent()}
                </div>
                
                {/* Footer Actions */}
                <div className="flex-shrink-0 p-4 border-t border-slate-700 flex justify-around items-center">
                    <FooterActionButton
                        icon={privateChat?.isMuted ? BellIcon : BellOffIcon}
                        label={privateChat?.isMuted ? 'Unmute' : 'Mute'}
                        onClick={handleMuteToggle}
                        hasBackground={!!privateChat?.isMuted}
                    />
                    <FooterActionButton 
                        icon={BanIcon} 
                        label={contact.isBlocked ? 'Unblock' : 'Block'} 
                        onClick={() => setShowConfirmBlock(true)}
                        isDestructive={!contact.isBlocked}
                    />
                    {privateChat && (
                         <>
                            <FooterActionButton 
                                icon={TrashIcon} 
                                label="Delete Chat" 
                                onClick={() => setShowConfirmDelete(true)} 
                                isDestructive 
                            />
                            <FooterActionButton 
                                icon={EyeOffIcon} 
                                label="Hide Chat" 
                                onClick={handleHideConversation} 
                            />
                         </>
                    )}
                </div>
                {showConfirmDelete && (
                    <ConfirmationDialog
                        title="Delete Conversation"
                        message={`Are you sure you want to delete your conversation with ${contact.name}? This action cannot be undone.`}
                        onConfirm={executeDelete}
                        onCancel={() => setShowConfirmDelete(false)}
                        confirmText="Yes, Delete"
                    />
                )}
                {showConfirmBlock && (
                    <ConfirmationDialog
                        title={contact.isBlocked ? 'Unblock Contact' : 'Block Contact'}
                        message={`Are you sure you want to ${contact.isBlocked ? 'unblock' : 'block'} ${contact.name}?`}
                        onConfirm={executeBlock}
                        onCancel={() => setShowConfirmBlock(false)}
                        confirmText={contact.isBlocked ? 'Unblock' : 'Block'}
                        isDestructive={!contact.isBlocked}
                    />
                )}
                {zoomedImageUrl && (
                <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in-fast" onClick={() => setZoomedImageUrl(null)}>
                    <img src={zoomedImageUrl} alt="Zoomed view" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
                     <button onClick={() => setZoomedImageUrl(null)} className="absolute top-4 right-4 p-1 text-white hover:text-gray-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
            </div>
        </div>
    );
};

const ContactDetailsModal = React.memo(ContactDetailsModalWithoutMemo);
export default ContactDetailsModal;