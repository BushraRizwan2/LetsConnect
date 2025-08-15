import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { XIcon, MagnifyingGlassIcon, UserPlusIcon } from './icons';

interface PeoplePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (emails: string[]) => void;
    excludedEmails?: string[];
}

const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const PeoplePickerModal: React.FC<PeoplePickerModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    excludedEmails = [],
}) => {
    const { contacts, user } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const availableContacts = useMemo(() =>
        contacts.filter(c => !excludedEmails.includes(c.email) && c.id !== user.id),
        [contacts, excludedEmails, user.id]
    );

    const filteredContacts = useMemo(() => {
        if (!searchTerm) return [];
        return availableContacts.filter(c =>
            !selectedEmails.includes(c.email) &&
            (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, availableContacts, selectedEmails]);

    const handleToggleSelection = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email)
                ? prev.filter(e => e !== email)
                : [...prev, email]
        );
    };

    const handleAdd = () => {
        if (selectedEmails.length > 0) {
            onAdd(selectedEmails);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ' ' || e.key === ',') && searchTerm.trim()) {
            e.preventDefault();
            const potentialEmail = searchTerm.trim();
            if (isEmailValid(potentialEmail) && !selectedEmails.includes(potentialEmail) && !excludedEmails.includes(potentialEmail)) {
                handleToggleSelection(potentialEmail);
                setSearchTerm('');
            }
        } else if (e.key === 'Backspace' && searchTerm === '' && selectedEmails.length > 0) {
            e.preventDefault();
            setSelectedEmails(prev => prev.slice(0, prev.length - 1));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg p-0 relative flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                         <UserPlusIcon className="w-8 h-8 text-highlight"/>
                        <div>
                            <h3 className="text-xl font-bold">Add people</h3>
                            <p className="text-sm text-text-secondary">Add from contacts or type an email.</p>
                        </div>
                    </div>
                     <button onClick={onClose} className="p-1 text-text-secondary hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-primary border border-slate-600 focus-within:ring-2 focus-within:ring-highlight">
                        {selectedEmails.map(email => (
                            <div key={email} className="bg-accent rounded-full flex items-center pl-3 pr-1 py-1 text-sm font-medium text-white">
                                <span>{email}</span>
                                <button type="button" onClick={() => handleToggleSelection(email)} className="ml-1.5 text-white/80 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedEmails.length === 0 ? "Type a name or email" : ""}
                            className="bg-transparent flex-1 focus:outline-none min-w-[150px] py-1"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <ul className="space-y-1">
                        {searchTerm.trim() && isEmailValid(searchTerm.trim()) && !filteredContacts.some(c => c.email === searchTerm.trim()) && !selectedEmails.includes(searchTerm.trim()) && (
                             <li
                                onClick={() => { handleToggleSelection(searchTerm.trim()); setSearchTerm(''); }}
                                className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center mr-3">
                                    <UserPlusIcon className="w-6 h-6 text-text-secondary"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">Add "{searchTerm.trim()}"</p>
                                    <p className="text-sm text-text-secondary truncate">Invite by email</p>
                                </div>
                            </li>
                        )}
                        {filteredContacts.map(contact => (
                             <li
                                key={contact.id}
                                onClick={() => handleToggleSelection(contact.email)}
                                className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer"
                            >
                                <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full mr-3" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{contact.name}</p>
                                    <p className="text-sm text-text-secondary truncate">{contact.email}</p>
                                </div>
                            </li>
                        ))}
                        {searchTerm && filteredContacts.length === 0 && !isEmailValid(searchTerm.trim()) && (
                            <li className="text-center p-4 text-sm text-text-secondary">No contacts found.</li>
                        )}
                    </ul>
                </div>

                <footer className="p-4 border-t border-slate-700 flex-shrink-0 flex justify-end">
                    <button
                        onClick={handleAdd}
                        disabled={selectedEmails.length === 0}
                        className="px-6 py-2 text-sm font-semibold bg-accent text-white rounded-md hover:bg-highlight disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        Add ({selectedEmails.length})
                    </button>
                </footer>
            </div>
        </div>
    );
};