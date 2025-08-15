
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Chat, Message, Meeting } from '../types';
import { MediaViewer } from './MediaViewer';
import { 
    XIcon, PencilIcon, UserPlusIcon, MagnifyingGlassIcon, InformationCircleIcon, 
    PhotoIcon, DocumentTextIcon, LinkIcon, BellIcon, BellOffIcon,
    StarIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon, CameraIcon,
    ForwardIcon, ArrowDownTrayIcon, TrashIcon, CheckIcon, MusicalNoteIcon,
    ChatBubbleLeftRightIcon, VideoCameraIcon, ShareIcon, PinIcon, UnpinIcon, CalendarDaysIcon,
    FolderIcon, EyeOffIcon
} from './icons';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}

// --- Sub-Components for Tabs ---

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

const OverviewPanel: React.FC<{ chat: Chat; }> = ({ chat }) => {
    const { updateChatDescription, user } = useAppContext();
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editedDesc, setEditedDesc] = useState(chat.description || '');

    const handleDescSave = () => {
        if (editedDesc.trim() !== chat.description) {
            updateChatDescription(chat.id, editedDesc.trim());
        }
        setIsEditingDesc(false);
    };
    
    return (
        <div className="p-4 space-y-4 relative">
            <div className="bg-secondary rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold">Description</p>
                        {isEditingDesc ? (
                             <textarea
                                value={editedDesc}
                                onChange={e => setEditedDesc(e.target.value)}
                                onBlur={handleDescSave}
                                autoFocus
                                className="text-sm bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-highlight rounded px-2 py-1 w-full mt-1 resize-none"
                                rows={3}
                            />
                        ) : (
                            <p className="text-sm text-text-secondary">{chat.description || 'No description'}</p>
                        )}
                    </div>
                    <button onClick={() => setIsEditingDesc(p => !p)} className="p-1 text-text-secondary hover:text-white flex-shrink-0 transition-colors ml-2">
                        <PencilIcon className="w-4 h-4"/>
                    </button>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">Created</p>
                        <p className="text-sm text-text-secondary">{chat.createdAt ? new Date(chat.createdAt).toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric', timeZone: user.settings?.timezone }) : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MembersPanel: React.FC<{ chat: Chat; participants: User[], onAddPeople: () => void }> = ({ chat, participants, onAddPeople }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredParticipants = useMemo(
        () => participants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [participants, searchTerm]
    );

    return (
        <div className="p-4 space-y-4 flex flex-col h-full">
            <div className="relative flex-shrink-0">
                <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
                />
            </div>
             <button onClick={onAddPeople} className="w-full flex items-center p-3 rounded-lg text-sm font-semibold hover:bg-secondary bg-primary flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center mr-3">
                    <UserPlusIcon className="w-5 h-5"/>
                </div>
                Add people
            </button>
             <ul className="space-y-2 flex-1 overflow-y-auto pr-2">
                {filteredParticipants.map(p => (
                    <li key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
                         <div className="flex items-center min-w-0">
                            <img src={getAvatarUrl(p.name, p.avatar)} alt={p.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                            <span className="font-semibold truncate">{p.name}</span>
                        </div>
                        {chat.organizerId === p.id && <span className="text-xs font-bold bg-highlight/20 text-highlight px-2 py-0.5 rounded-full">Admin</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

type MediaTab = 'photos' | 'files' | 'links';

const MediaPanel: React.FC<{ chat: Chat; onOpenForwardPicker: (messageIds: string[]) => void }> = ({ chat, onOpenForwardPicker }) => {
    const { user, deleteMessages } = useAppContext();
    const [activeTab, setActiveTab] = useState<MediaTab>('photos');
    const [showAll, setShowAll] = useState<Record<MediaTab, boolean>>({ photos: false, files: false, links: false });

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [mediaToView, setMediaToView] = useState<{ messages: Message[]; startIndex: number } | null>(null);

    const getPhotoUrl = useCallback((message: Message): string => {
        if (message.type === 'image') return message.content;
        if (message.type === 'file' && message.fileInfo?.type.startsWith('image/')) {
            return message.fileInfo.url;
        }
        return '';
    }, []);

    const { photos, files, links } = useMemo(() => {
        const photoMessages: Message[] = [];
        const fileMessages: Message[] = [];
        const linkMessages: { id: string; messageId: string; url: string; timestamp: string }[] = [];

        if (!chat) return { photos: [], files: [], links: [] };

        for (const m of chat.messages) {
            if ((m.deletedFor || []).includes(user.id)) continue;
            
            switch (m.type) {
                case 'image':
                    photoMessages.push(m);
                    break;
                case 'file':
                    if (m.fileInfo?.type.startsWith('image/')) {
                        photoMessages.push(m);
                    } else {
                        fileMessages.push(m);
                    }
                    break;
                case 'audio':
                    fileMessages.push(m);
                    break;
                case 'text':
                    if (m.content.match(/(https?:\/\/[^\s]+)/g)) {
                        const urls = m.content.match(/(https?:\/\/[^\s]+)/g) || [];
                        urls.forEach((url, urlIndex) => {
                            linkMessages.push({
                                id: `${m.id}-link-${urlIndex}`,
                                messageId: m.id,
                                url,
                                timestamp: m.timestamp
                            });
                        });
                    }
                    break;
                default:
                    break;
            }
        }
        return { photos: photoMessages, files: fileMessages, links: linkMessages };
    }, [chat, user.id]);

    const mediaMap = useMemo(() => ({ photos, files, links }), [photos, files, links]);

    useEffect(() => {
        setIsSelectionMode(false);
        setSelectedItems([]);
    }, [activeTab]);

    const handleToggleSelection = useCallback((id: string) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const handleSelectAll = useCallback(() => {
        const currentMedia = mediaMap[activeTab];
        const allIds = currentMedia.map(item => 'id' in item ? item.id : '');
        if (selectedItems.length === allIds.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allIds);
        }
    }, [activeTab, mediaMap, selectedItems.length]);

    const handleConfirmDelete = useCallback(() => {
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
    }, [chat, selectedItems, activeTab, links, deleteMessages]);
    
    const handleDeleteSelected = () => {
        if (selectedItems.length > 0) {
            setShowConfirmDelete(true);
        }
    };
    
    const handleForwardSelected = useCallback(() => {
        if (selectedItems.length === 0) return;
        const messageIdsToForward = Array.from(new Set(selectedItems.map(itemId => {
            if (activeTab === 'links') {
                const link = links.find(l => l.id === itemId);
                return link?.messageId;
            }
            return itemId;
        }).filter((id): id is string => !!id)));
        onOpenForwardPicker(messageIdsToForward);
    }, [selectedItems, activeTab, links, onOpenForwardPicker]);
    
    const handleDownloadSelected = useCallback(async () => {
        if (activeTab === 'links') {
            const urlsToCopy = links.filter(l => selectedItems.includes(l.id)).map(l => l.url).join('\n');
            await navigator.clipboard.writeText(urlsToCopy);
            alert(`${selectedItems.length} links copied!`);
        } else {
             alert(`Downloading ${selectedItems.length} files... (Not implemented in demo)`);
        }
    }, [activeTab, links, selectedItems]);

    const ConfirmationDialog = () => {
        const itemType = activeTab === 'photos' ? 'photo(s)' : activeTab === 'files' ? 'file(s)' : 'link(s)';
        const title = `Delete ${itemType.charAt(0).toUpperCase()}${itemType.slice(1, -3)}s`;

        return (
            <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 animate-fade-in-fast">
                <div className="bg-primary rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-text-secondary mb-6">Are you sure you want to remove the {selectedItems.length} selected {itemType}?</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => setShowConfirmDelete(false)} className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 font-semibold">
                            Cancel
                        </button>
                        <button onClick={handleConfirmDelete} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        );
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
                {renderContent()}
            </div>
             {showConfirmDelete && <ConfirmationDialog />}
        </div>
    );
};


const MeetingsPanel: React.FC<{ chat: Chat; onOpenMeetingDetails: (meeting: Meeting) => void; onJoinMeeting: (meeting: Meeting) => void; }> = ({ chat, onOpenMeetingDetails, onJoinMeeting }) => {
    const { user } = useAppContext();
    const sortedMeetings = useMemo(() =>
        (chat.meetings || [])
            .filter(m => !m.isCancelled)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    , [chat.meetings]);

    const upcomingMeetings = sortedMeetings.filter(m => new Date(m.startTime) > new Date());
    const pastMeetings = sortedMeetings.filter(m => new Date(m.startTime) <= new Date());
    
    if (sortedMeetings.length === 0) {
        return <div className="p-4 text-center text-text-secondary">No meetings scheduled for this group.</div>;
    }
    
    const MeetingItem: React.FC<{meeting: Meeting}> = ({meeting}) => (
        <div className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-slate-700" onClick={() => onOpenMeetingDetails(meeting)}>
           <div className="flex items-center">
               <CalendarDaysIcon className="w-8 h-8 text-text-secondary mr-4 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-semibold">{meeting.title}</p>
                    <p className="text-sm text-text-secondary">
                        {new Date(meeting.startTime).toLocaleString('default', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: user.settings?.timezone })}
                    </p>
                </div>
           </div>
           <div className="flex justify-end mt-2">
               <button onClick={(e) => { e.stopPropagation(); onJoinMeeting(meeting); }} className="px-3 py-1 text-xs font-semibold bg-accent rounded-md hover:bg-highlight">Join</button>
           </div>
        </div>
    );

    return (
        <div className="p-4 space-y-4">
            {upcomingMeetings.length > 0 && (
                <div>
                    <h4 className="font-bold text-text-secondary mb-2">Upcoming</h4>
                    <div className="space-y-2">
                        {upcomingMeetings.map(m => <MeetingItem key={m.id} meeting={m} />)}
                    </div>
                </div>
            )}
             {pastMeetings.length > 0 && (
                <div>
                    <h4 className="font-bold text-text-secondary mb-2">Past</h4>
                    <div className="space-y-2">
                        {pastMeetings.map(m => <MeetingItem key={m.id} meeting={m} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

interface GroupDetailsModalProps {
    chat: Chat;
    onClose: () => void;
    onStartCall: (callType: 'audio' | 'video') => void;
    onOpenAddPeoplePicker: () => void;
    onOpenForwardPicker: (messageIds: string[]) => void;
    onOpenMeetingDetails: (meeting: Meeting) => void;
    onOpenChat: (chatId: string) => void;
}

const ConfirmationDialog: React.FC<{
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ onCancel, onConfirm }) => (
    <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center p-4 animate-fade-in-fast">
        <div className="bg-primary rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Leave Group</h3>
            <p className="text-text-secondary mb-6">Are you sure you want to leave this group? You will be removed and the conversation will be deleted from your side.</p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 font-semibold">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                    Yes, Leave
                </button>
            </div>
        </div>
    </div>
);


const GroupDetailsModalWithoutMemo: React.FC<GroupDetailsModalProps> = ({ chat, onClose, onStartCall, onOpenAddPeoplePicker, onOpenForwardPicker, onOpenMeetingDetails, onOpenChat }) => {
    const { 
        getContactById, updateChatName, updateChatAvatar, updateChatCoverPhoto, 
        copyToClipboard, toggleFavorite, toggleMuteChat, hideChat, archiveChat, leaveGroup
    } = useAppContext();
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'media' | 'meetings'>('overview');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(chat.name || '');
    const [copied, setCopied] = useState(false);
    const [showConfirmLeave, setShowConfirmLeave] = useState(false);

    const participants = useMemo(() => chat.participants.map(getContactById).filter((u): u is User => !!u), [chat.participants, getContactById]);
    const coverPhotoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleNameSave = useCallback(() => {
        if (editedName.trim() && editedName.trim() !== chat.name) {
            updateChatName(chat.id, editedName.trim());
        }
        setIsEditingName(false);
    }, [chat.id, chat.name, editedName, updateChatName]);
    
    const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                if (type === 'avatar') {
                    updateChatAvatar(chat.id, url);
                } else {
                    updateChatCoverPhoto(chat.id, url);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [chat.id, updateChatAvatar, updateChatCoverPhoto]);
    
    const handleShare = useCallback(() => {
        const groupLink = `https://lets.connect/join/${chat.id}`;
        copyToClipboard(groupLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [chat.id, copyToClipboard]);

    const handleHide = useCallback(() => {
        hideChat(chat.id);
        onClose();
    }, [chat.id, hideChat, onClose]);
    
    const handleArchive = useCallback(() => {
        archiveChat(chat.id);
        onClose();
    }, [chat.id, archiveChat, onClose]);

    const handleLeaveGroup = useCallback(() => {
        leaveGroup(chat.id);
        setShowConfirmLeave(false);
        onClose();
    }, [chat.id, leaveGroup, onClose]);

    const ActionButton: React.FC<{
        icon: React.FC<{ className?: string }>;
        label: string;
        onClick: () => void;
        isCopied?: boolean;
        isPinned?: boolean;
    }> = ({ icon: Icon, label, onClick, isCopied = false, isPinned = false }) => {
        const iconColor = isPinned ? 'text-highlight' : isCopied ? 'text-white' : 'text-text-secondary';
        const bgColor = isCopied ? 'bg-green-600' : isPinned ? 'bg-highlight/20' : '';

        return (
            <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg w-full text-text-secondary hover:text-white hover:bg-slate-700 transition-colors ${bgColor}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <span className={`text-xs ${isCopied ? 'text-white font-bold' : 'font-semibold'}`}>{label}</span>
            </button>
        );
    };

    const FooterActionButton: React.FC<{ icon: React.FC<{ className?: string }>, label: string, onClick: () => void, isDestructive?: boolean, hasBackground?: boolean }> = ({ icon: Icon, label, onClick, isDestructive = false, hasBackground = false }) => (
        <button onClick={onClick} className={`flex flex-col items-center space-y-1 p-2 rounded-lg w-20 group transition-colors 
            ${hasBackground ? 'bg-slate-700' : ''} 
            ${isDestructive 
                ? 'text-red-400 hover:bg-slate-700 hover:text-red-300' 
                : 'text-text-secondary hover:text-white hover:bg-slate-700'
            }`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs font-semibold text-center">{label}</span>
        </button>
    );

    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case 'overview': return <OverviewPanel chat={chat} />;
            case 'members': return <MembersPanel chat={chat} participants={participants} onAddPeople={onOpenAddPeoplePicker} />;
            case 'media': return <MediaPanel chat={chat} onOpenForwardPicker={onOpenForwardPicker} />;
            case 'meetings': return <MeetingsPanel chat={chat} onOpenMeetingDetails={onOpenMeetingDetails} onJoinMeeting={() => {}} />;
        }
    }, [activeTab, chat, participants, onOpenAddPeoplePicker, onOpenForwardPicker, onOpenMeetingDetails]);

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex md:items-center md:justify-center animate-fade-in-fast" onClick={onClose}>
            <input type="file" accept="image/*" ref={coverPhotoInputRef} onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />
            
            <div className="bg-primary w-full h-full md:h-auto md:max-h-[90vh] md:rounded-xl shadow-2xl md:max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                 <div className="flex-shrink-0">
                    <div className="relative group">
                         <img src={chat.coverPhoto || `https://picsum.photos/seed/${chat.id}-cover/400/128`} alt="Cover" className="w-full h-32 object-cover md:rounded-t-xl" />
                        <button onClick={() => coverPhotoInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <CameraIcon className="w-8 h-8 text-white"/>
                             <span className="sr-only">Change cover photo</span>
                        </button>
                        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-white hover:text-gray-200 z-20">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div className="absolute -bottom-12 left-6">
                            <div className="relative group/avatar">
                                <img src={getAvatarUrl(chat.name || 'Group', chat.avatar)} alt={chat.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary" />
                                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                    <CameraIcon className="w-6 h-6 text-white"/>
                                </button>
                            </div>
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
                                    <h2 className="text-2xl font-bold text-text-primary truncate">{chat.name}</h2>
                                    <button onClick={() => setIsEditingName(true)} className="p-1 text-text-secondary hover:text-white hover:bg-slate-700 rounded-full flex-shrink-0 transition-colors">
                                        <PencilIcon className="w-5 h-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-text-secondary">{participants.length} members</p>
                        
                         <div className="mt-6 grid grid-cols-5 gap-2 text-center">
                            <ActionButton icon={ChatBubbleLeftRightIcon} label="Chat" onClick={() => onOpenChat(chat.id)} />
                            <ActionButton icon={VideoCameraIcon} label="Meet" onClick={() => onStartCall('video')} />
                            <ActionButton icon={ShareIcon} label={copied ? 'Copied!' : 'Share'} onClick={handleShare} isCopied={copied} />
                            <ActionButton icon={UserPlusIcon} label="Add" onClick={onOpenAddPeoplePicker} />
                            <ActionButton icon={PinIcon} label={chat.isFavorite ? 'Unpin' : 'Pin'} onClick={() => toggleFavorite(chat.id)} isPinned={!!chat.isFavorite} />
                        </div>
                     </div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 border-y border-slate-700 px-2">
                     <div className="flex space-x-2">
                        <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Members" count={participants.length} isActive={activeTab === 'members'} onClick={() => setActiveTab('members')} />
                        <TabButton label="Media" isActive={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                        <TabButton label="Meetings" isActive={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {renderTabContent()}
                </div>
                
                {/* Footer Actions */}
                <div className="flex-shrink-0 p-4 border-t border-slate-700 flex justify-around items-center">
                    <FooterActionButton
                        icon={chat.isMuted ? BellIcon : BellOffIcon}
                        label={chat.isMuted ? 'Unmute' : 'Mute'}
                        onClick={() => toggleMuteChat(chat.id)}
                        hasBackground={!!chat.isMuted}
                    />
                    <FooterActionButton 
                        icon={FolderIcon} 
                        label={chat.isArchived ? 'Unarchive' : 'Archive'}
                        onClick={() => archiveChat(chat.id)}
                        hasBackground={!!chat.isArchived}
                    />
                    <FooterActionButton 
                        icon={EyeOffIcon} 
                        label="Hide" 
                        onClick={handleHide} 
                    />
                    <FooterActionButton 
                        icon={TrashIcon} 
                        label="Leave" 
                        onClick={() => setShowConfirmLeave(true)} 
                        isDestructive 
                    />
                </div>
                
                {showConfirmLeave && <ConfirmationDialog onCancel={() => setShowConfirmLeave(false)} onConfirm={handleLeaveGroup} />}
            </div>
        </div>
    );
};

const GroupDetailsModal = React.memo(GroupDetailsModalWithoutMemo);
export default GroupDetailsModal;