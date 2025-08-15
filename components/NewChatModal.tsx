import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { XIcon } from './icons';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

interface NewChatModalProps {
    onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
    const { user, contacts, getOrCreatePrivateChat, createGroupChat, setActiveChatId, setActiveFeature } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');

    const searchableUsers = useMemo(() => {
        const selectedIds = new Set(selectedUsers.map(u => u.id));
        return contacts.filter(c => c.id !== user.id && !selectedIds.has(c.id));
    }, [contacts, user.id, selectedUsers]);
    
    const filteredResults = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase().trim();
        
        const usersToShow = lowerCaseSearch ? 
            searchableUsers.filter(person =>
                person.name.toLowerCase().includes(lowerCaseSearch) ||
                person.email.toLowerCase().includes(lowerCaseSearch)
            ) : searchableUsers;
        
        return usersToShow.sort((a,b) => a.name.localeCompare(b.name));

    }, [searchTerm, searchableUsers]);

    const handleSelectUser = (person: User) => {
        setSelectedUsers(prev => [...prev, person]);
        setSearchTerm('');
    };

    const handleRemoveUser = (personId: string) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== personId));
    };

    const handleSubmit = () => {
        if (selectedUsers.length === 0) return;

        if (selectedUsers.length === 1) {
            const chatId = getOrCreatePrivateChat(selectedUsers[0].id);
            setActiveChatId(chatId);
        } else {
            const finalGroupName = groupName.trim() || [user, ...selectedUsers].slice(0, 3).map(u => u.name.split(' ')[0]).join(', ');
            createGroupChat(finalGroupName, selectedUsers.map(u => u.id));
        }
        
        setActiveFeature('chat');
        onClose();
    };

    const isGroupChat = selectedUsers.length > 1;
    const buttonLabel = isGroupChat ? 'Create Group Chat' : 'Start Chat';

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg p-0 relative flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-slate-700">
                    <h3 className="text-xl font-bold">New Chat</h3>
                    <button onClick={onClose} className="p-1 text-text-secondary hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-primary border border-slate-600 focus-within:ring-2 focus-within:ring-highlight">
                        <label htmlFor="search-user" className="text-text-secondary font-semibold self-center">To:</label>
                        {selectedUsers.map(person => (
                            <div key={person.id} className="bg-accent rounded-full flex items-center pl-3 pr-1 py-1 text-sm font-medium text-white animate-fade-in-fast">
                                <span>{person.name}</span>
                                <button type="button" onClick={() => handleRemoveUser(person.id)} className="ml-1.5 text-white/80 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <input
                            id="search-user"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={selectedUsers.length === 0 ? "Enter a name or email" : ""}
                            className="bg-transparent flex-1 focus:outline-none min-w-[150px] py-1"
                            autoFocus
                        />
                    </div>
                    {isGroupChat && (
                         <div className="mt-4 animate-fade-in-fast">
                            <label htmlFor="group-name" className="text-text-secondary font-semibold">Group Name (optional)</label>
                             <input
                                id="group-name"
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter a name for your group"
                                className="w-full bg-primary border border-slate-600 rounded-lg px-4 py-3 mt-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <h4 className="text-sm font-bold text-text-secondary mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                        {filteredResults.map(person => (
                            <li
                                key={person.id}
                                onClick={() => handleSelectUser(person)}
                                className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer"
                            >
                                <img src={getAvatarUrl(person.name, person.avatar)} alt={person.name} className="w-10 h-10 rounded-full mr-3" />
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{person.name}</p>
                                    <p className="text-sm text-text-secondary truncate">{person.email}</p>
                                </div>
                            </li>
                        ))}
                        {filteredResults.length === 0 && (
                            <li className="text-center p-4 text-sm text-text-secondary">
                                {searchTerm ? 'No results found.' : 'No more contacts to add.'}
                            </li>
                        )}
                    </ul>
                </div>

                 <footer className="p-4 border-t border-slate-700 flex-shrink-0 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={selectedUsers.length === 0}
                        className="px-6 py-2 text-sm font-semibold bg-accent text-white rounded-md hover:bg-highlight disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        {buttonLabel}
                    </button>
                </footer>
            </div>
        </div>
    );
};
