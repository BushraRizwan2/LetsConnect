import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Chat, Message, Meeting } from '../types';
import { 
    XIcon, PencilIcon, ChatBubbleLeftRightIcon, VideoCameraIcon, ShareIcon, UserPlusIcon, PinIcon,
    BellIcon, BellOffIcon, FolderIcon, EyeOffIcon, TrashIcon
} from './icons';

// Helper to format date
const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    // Adding UTC timezone to ensure date is parsed correctly regardless of client timezone
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

const MembersTab: React.FC<{ chat: Chat }> = ({ chat }) => {
    const { getContactById } = useAppContext();
    return (
        <div className="p-4">
            <ul className="space-y-2">
                {chat.participants.map(id => {
                    const member = getContactById(id);
                    if (!member) return null;
                    return (
                        <li key={id} className="flex items-center p-2 rounded-lg hover:bg-secondary">
                            <img src={getAvatarUrl(member.name, member.avatar)} alt={member.name} className="w-10 h-10 rounded-full mr-3" />
                            <p className="font-semibold">{member.name}</p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
const MediaTab = () => <div className="p-4 text-center text-text-secondary">Media content would be here.</div>;
const MeetingsTab = () => <div className="p-4 text-center text-text-secondary">Meetings content would be here.</div>;

const GroupDetailsModal: React.FC<{
    chat: Chat;
    onClose: () => void;
    onStartCall: (callType: 'audio' | 'video') => void;
    onOpenAddPeoplePicker: () => void;
    onOpenForwardPicker: (messageIds: string[]) => void;
    onOpenMeetingDetails: (meeting: Meeting) => void;
    onOpenChat: (chatId: string) => void;
}> = ({ chat, onClose, onStartCall, onOpenAddPeoplePicker, onOpenChat }) => {
    const { 
        updateChatName, 
        updateChatDescription, 
        leaveGroup, 
        toggleFavorite, 
        toggleMuteChat,
        hideChat,
        archiveChat
    } = useAppContext();
    
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'media' | 'meetings'>('overview');
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(chat.name || '');
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState(chat.description || '');

    const handleNameSave = () => {
        if (editedName.trim() && editedName.trim() !== chat.name) {
            updateChatName({ chatId: chat.id, name: editedName.trim() });
        }
        setIsEditingName(false);
    };

    const handleDescriptionSave = () => {
        if (editedDescription.trim() !== (chat.description || '')) {
            updateChatDescription(chat.id, editedDescription.trim());
        }
        setIsEditingDescription(false);
    };
    
    const handleLeaveGroup = () => {
        if (window.confirm(`Are you sure you want to leave ${chat.name}?`)) {
            leaveGroup(chat.id);
            onClose();
        }
    };

    const HeaderActionButton: React.FC<{icon: React.FC<{className?:string}>, label: string, onClick: ()=>void}> = ({ icon: Icon, label, onClick }) => (
        <button onClick={onClick} className="flex flex-col items-center space-y-1 text-text-secondary hover:text-white w-14">
            <div className="w-10 h-10 bg-btn-bg rounded-full flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                 <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );

    const FooterActionButton: React.FC<{icon: React.FC<{className?:string}>, label: string, onClick: ()=>void, isDestructive?: boolean}> = ({ icon: Icon, label, onClick, isDestructive }) => (
        <button onClick={onClick} className={`flex flex-col items-center space-y-1 p-2 rounded-lg w-20 group transition-colors ${isDestructive ? 'text-red-400 hover:text-red-300' : 'text-text-secondary hover:text-white'}`}>
            <Icon className="w-5 h-5"/>
            <span className="text-sm font-semibold">{label}</span>
        </button>
    );
    
    const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void, count?: number }> = ({ label, isActive, onClick, count }) => (
      <button
        onClick={onClick}
        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
          isActive
            ? 'border-highlight text-text-primary'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
      >
        <span>{label}</span>
        {typeof count === 'number' && count > 0 && <span className="text-xs bg-slate-600 px-1.5 py-0.5 rounded-full">{count}</span>}
      </button>
    );

    const OverviewTab = () => (
        <div className="p-4 space-y-4">
            <div className="bg-secondary rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-text-primary">Description</h4>
                    <button onClick={() => setIsEditingDescription(p => !p)} className="p-1 text-text-secondary hover:text-white">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>
                 {isEditingDescription ? (
                    <textarea
                        value={editedDescription}
                        onChange={e => setEditedDescription(e.target.value)}
                        onBlur={handleDescriptionSave}
                        autoFocus
                        className="w-full bg-primary p-2 rounded text-sm h-24 resize-none focus:outline-none focus:ring-1 focus:ring-highlight"
                    />
                ) : (
                    <p className="text-sm text-text-secondary">{chat.description || 'No description provided.'}</p>
                )}
            </div>
            <div className="bg-secondary rounded-lg p-4">
                <h4 className="font-bold text-text-primary mb-2">Created</h4>
                <p className="text-sm text-text-secondary">{formatDate(chat.createdAt)}</p>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'members': return <MembersTab chat={chat} />;
            case 'media': return <MediaTab />;
            case 'meetings': return <MeetingsTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex md:items-center md:justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-primary w-full h-full md:h-auto md:max-h-[90vh] md:rounded-xl shadow-2xl md:max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="relative flex-shrink-0">
                    <img src={chat.coverPhoto || `https://picsum.photos/seed/${chat.id}-cover/400/128`} alt="Group Cover" className="w-full h-32 object-cover md:rounded-t-xl" />
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 bg-black/30 text-white rounded-full hover:bg-black/50 z-20"><XIcon className="w-5 h-5" /></button>
                    <div className="absolute -bottom-12 left-6">
                        <img src={getAvatarUrl(chat.name || 'Group', chat.avatar)} alt={chat.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary" />
                    </div>
                </header>

                <div className="pt-14 px-6 pb-4 flex-shrink-0">
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
                                <button onClick={() => setIsEditingName(true)} className="p-1 text-text-secondary hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                            </>
                        )}
                    </div>
                    <p className="text-text-secondary mt-1">{chat.participants.length} members</p>
                </div>
                
                <div className="flex justify-around items-center px-4 py-4 flex-shrink-0">
                    <HeaderActionButton icon={ChatBubbleLeftRightIcon} label="Chat" onClick={() => { onOpenChat(chat.id); onClose(); }} />
                    <HeaderActionButton icon={VideoCameraIcon} label="Meet" onClick={() => onStartCall('video')} />
                    <HeaderActionButton icon={ShareIcon} label="Share" onClick={() => alert('Share functionality not implemented yet.')} />
                    <HeaderActionButton icon={UserPlusIcon} label="Add" onClick={onOpenAddPeoplePicker} />
                    <HeaderActionButton icon={PinIcon} label={chat.isFavorite ? "Unpin" : "Pin"} onClick={() => toggleFavorite(chat.id)} />
                </div>

                <div className="flex-shrink-0 border-y border-slate-700 px-2">
                    <div className="flex space-x-2">
                        <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Members" count={chat.participants.length} isActive={activeTab === 'members'} onClick={() => setActiveTab('members')} />
                        <TabButton label="Media" isActive={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                        <TabButton label="Meetings" isActive={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {renderTabContent()}
                </div>

                <footer className="flex-shrink-0 p-2 border-t border-slate-700 flex justify-around items-center">
                    <FooterActionButton icon={chat.isMuted ? BellIcon : BellOffIcon} label={chat.isMuted ? 'Unmute' : 'Mute'} onClick={() => toggleMuteChat(chat.id)} />
                    <FooterActionButton icon={FolderIcon} label={chat.isArchived ? "Unarchive" : "Archive"} onClick={() => archiveChat(chat.id)} />
                    <FooterActionButton icon={EyeOffIcon} label="Hide" onClick={() => {hideChat(chat.id); onClose();}} />
                    <FooterActionButton icon={TrashIcon} label="Leave" onClick={handleLeaveGroup} isDestructive />
                </footer>
            </div>
        </div>
    );
};

export default GroupDetailsModal;
