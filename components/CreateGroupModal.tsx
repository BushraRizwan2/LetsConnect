
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { XIcon, UserGroupIcon, CheckIcon } from './icons';

interface CreateGroupModalProps {
    onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
    const { contacts, createGroupChat } = useAppContext();
    const [teamName, setTeamName] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleToggleContact = (contactId: string) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!teamName.trim()) {
            setError('Team name is required.');
            return;
        }
        if (selectedContacts.length < 1) {
            setError('You must select at least one member to create a team chat.');
            return;
        }

        createGroupChat(teamName, selectedContacts);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md p-6 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-text-secondary hover:text-white z-10">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-4 flex-shrink-0">
                    <UserGroupIcon className="w-12 h-12 text-highlight mx-auto mb-2" />
                    <h3 className="text-xl font-bold">Add New Team Chat</h3>
                </div>

                {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg text-center mb-4 flex-shrink-0">{error}</p>}

                <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        <div>
                            <label htmlFor="team-name" className="block text-sm font-medium text-text-secondary mb-1">Team Name</label>
                            <input
                                id="team-name"
                                type="text"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                placeholder="e.g., Project Team"
                                className="w-full px-4 py-3 bg-primary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight transition-colors"
                                required
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-text-secondary mb-1">Select Members ({selectedContacts.length})</label>
                             <div className="bg-primary border border-slate-600 rounded-lg p-2 h-60 overflow-y-auto">
                                {contacts.length > 0 ? (
                                    contacts.map(contact => (
                                        <div key={contact.id} onClick={() => handleToggleContact(contact.id)} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                                            <div className="flex items-center">
                                                <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full mr-3" />
                                                <p className="font-semibold">{contact.name}</p>
                                            </div>
                                            {selectedContacts.includes(contact.id) && (
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-accent">
                                                    <CheckIcon className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-text-secondary py-4">You have no contacts to add.</p>
                                )}
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-4 flex-shrink-0">
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight transition-colors duration-200">
                            Add Team Chat
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
