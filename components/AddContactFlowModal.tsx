
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { XIcon, UserPlusIcon, MagnifyingGlassIcon, PencilIcon, ComputerDesktopIcon, ChevronLeftIcon, AppleIcon, GmailIcon } from './icons';
import { countries } from '../data/countries';
import { contacts as mockContacts, currentUser as mockCurrentUser } from '../data/mockData';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

// --- Contact Picker API Logic ---
const importFromDevice = async (
    addContact: (details: { name: string; email: string; phone?: string; }) => User | null,
    contacts: User[],
    currentUser: User,
    onSuccess: (newUser: User) => void,
    onError: (msg: string) => void
) => {
    // Check for API support
    if (!('contacts' in navigator && typeof (navigator as any).contacts.select === 'function')) {
        onError('Importing from device is not supported on this browser or device.');
        return;
    }

    try {
        const properties = ['name', 'email', 'tel'];
        const opts = { multiple: false };
        const deviceContacts = await (navigator as any).contacts.select(properties, opts);
        
        if (deviceContacts.length > 0) {
            const c = deviceContacts[0];
            const contactDetails = {
                name: c.name?.[0] || '',
                email: c.email?.[0] || '',
                phone: c.tel?.[0] || '',
            };

            if (!contactDetails.name || !contactDetails.email) {
                onError('The selected contact must have a name and an email address.');
                return;
            }
            
            if ([...contacts, currentUser].some(u => u.email.toLowerCase() === contactDetails.email.toLowerCase())) {
                onError('A contact with this email already exists.');
                return;
            }

            const newUser = addContact(contactDetails);
            if (newUser) {
                onSuccess(newUser);
            } else {
                onError('Failed to add contact. They may already exist.');
            }
        }
    } catch (ex) {
        console.error('Contact Picker API error:', ex);
        if ((ex as DOMException).name !== 'AbortError') {
            onError('Could not access device contacts. Please check permissions and try again.');
        }
    }
};

// --- Sub-components for different views ---

const OptionsView: React.FC<{ 
    setView: (view: 'manual' | 'search') => void; 
    onImport: () => void;
    onImportFromService: (service: 'gmail' | 'apple') => void;
    isContactPickerSupported: boolean;
}> = ({ setView, onImport, onImportFromService, isContactPickerSupported }) => {
    const OptionButton: React.FC<{ icon: React.FC<{className?: string}>, title: string, description: string, onClick: () => void, disabled?: boolean }> = ({ icon: Icon, title, description, onClick, disabled = false }) => (
        <button onClick={onClick} disabled={disabled} className="flex items-center w-full p-4 bg-primary rounded-lg hover:bg-slate-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="p-3 bg-secondary rounded-lg mr-4">
                <Icon className="w-6 h-6 text-highlight" />
            </div>
            <div>
                <p className="font-bold text-text-primary">{title}</p>
                <p className="text-sm text-text-secondary">{description}</p>
            </div>
        </button>
    );
    return (
        <div className="space-y-4">
            <OptionButton icon={PencilIcon} title="Create new contact" description="Add someone by email or phone" onClick={() => setView('manual')} />
            <OptionButton icon={MagnifyingGlassIcon} title="Search directory" description="Find people already on Let's Connect" onClick={() => setView('search')} />
            <div className="text-sm text-text-secondary text-center pt-2">or import from</div>
            <OptionButton icon={ComputerDesktopIcon} title="Your device" description={isContactPickerSupported ? "Use your device's address book" : "Not supported on this browser"} onClick={onImport} disabled={!isContactPickerSupported} />
            <OptionButton icon={GmailIcon} title="Google Contacts" description="Import from your Gmail account" onClick={() => onImportFromService('gmail')} />
            <OptionButton icon={AppleIcon} title="Apple iCloud" description="Import from your Apple ID" onClick={() => onImportFromService('apple')} />
        </div>
    );
};

const ManualAddView: React.FC<{ onBack: () => void; onClose: () => void }> = ({ onBack, onClose }) => {
    const { addContact, contacts, user } = useAppContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === '+1' && c.name === 'United States') || countries[0]);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim()) {
            setError('Name and email are required fields.'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.'); return;
        }
        if ([...contacts, user].some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setError('A contact with this email already exists.'); return;
        }

        const fullPhone = phone.trim() ? `${selectedCountry.code}${phone.trim()}` : undefined;
        addContact({ name, email, phone: fullPhone });
        onClose();
    };
    
    return (
        <>
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-white"><ChevronLeftIcon className="w-6 h-6"/></button>
                <h3 className="text-xl font-bold text-center flex-1 pr-6">Create New Contact</h3>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input id="contact-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Jane Doe" className="w-full px-4 py-3 bg-primary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight" required />
                </div>
                 <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input id="contact-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., jane.doe@example.com" className="w-full px-4 py-3 bg-primary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight" required />
                </div>
                <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-text-secondary mb-1">Phone (Optional)</label>
                    <div className="flex space-x-2">
                        <div className="relative">
                            <button type="button" onClick={() => setIsCountryDropdownOpen(p => !p)} className="flex items-center h-full px-3 bg-primary border border-slate-600 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight">
                                <span>{selectedCountry.flag}</span><span className="ml-2 text-sm">{selectedCountry.code}</span>
                            </button>
                            {isCountryDropdownOpen && (
                                <ul className="absolute bottom-full mb-2 w-56 bg-primary border border-slate-600 rounded-lg z-10 max-h-48 overflow-y-auto">
                                    {countries.map(c => <li key={c.name} onClick={() => { setSelectedCountry(c); setIsCountryDropdownOpen(false); }} className="flex items-center p-2 hover:bg-slate-600 cursor-pointer"><span className="w-6">{c.flag}</span><span className="ml-2 text-sm">{c.name} ({c.code})</span></li>)}
                                </ul>
                            )}
                        </div>
                        <input id="contact-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="flex-1 w-full px-4 py-3 bg-primary border border-slate-600 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-highlight" />
                    </div>
                </div>
                <button type="submit" className="w-full flex justify-center py-3 px-4 mt-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight">Add Contact</button>
            </form>
        </>
    );
};

const SearchDirectoryView: React.FC<{ onBack: () => void; onClose: () => void }> = ({ onBack, onClose }) => {
    const { user, contacts, addContact, createChat } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    // Simulate a public directory of all possible users.
    const publicDirectory = useMemo(() => [mockCurrentUser, ...mockContacts], []);

    const filteredResults = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase().trim();
        if (lowerCaseSearch.length < 2) return [];

        const existingContactEmails = contacts.map(c => c.email.toLowerCase());

        return publicDirectory.filter(person => {
            // Exclude self and existing contacts
            if (person.id === user.id) return false;
            if (existingContactEmails.includes(person.email.toLowerCase())) return false;

            // Match against name, email, or phone
            return (
                person.name.toLowerCase().includes(lowerCaseSearch) ||
                person.email.toLowerCase().includes(lowerCaseSearch) ||
                (person.phone && person.phone.replace(/[^0-9]/g, '').includes(lowerCaseSearch.replace(/[^0-9]/g, '')))
            );
        });
    }, [searchTerm, publicDirectory, contacts, user.id]);

    const handleSelect = (person: User) => {
        const newContact = addContact(person);
        if (newContact) {
            createChat(newContact.id);
            onClose();
        } else {
            // This case handles if the contact was added concurrently
            const existing = contacts.find(c => c.email.toLowerCase() === person.email.toLowerCase());
            if (existing) {
                createChat(existing.id);
                onClose();
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header and search bar (non-scrolling part) */}
            <div className="flex-shrink-0">
                <div className="flex items-center mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-white"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <h3 className="text-xl font-bold text-center flex-1 pr-6">Search Directory</h3>
                </div>
                <div className="relative mb-4">
                    <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or phone"
                        className="w-full bg-primary border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight"
                        autoFocus
                    />
                </div>
            </div>
            
            {/* Results list (scrolling part) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <ul className="space-y-2">
                    {filteredResults.map(person => (
                        <li key={person.id} onClick={() => handleSelect(person)} className="flex items-center p-2 rounded-lg hover:bg-slate-700 cursor-pointer">
                            <img src={getAvatarUrl(person.name, person.avatar)} alt={person.name} className="w-10 h-10 rounded-full mr-3" />
                            <div className="min-w-0">
                                <p className="font-semibold truncate">{person.name}</p>
                                <p className="text-sm text-text-secondary truncate">{person.email}</p>
                            </div>
                        </li>
                    ))}
                    {searchTerm.length >= 2 && filteredResults.length === 0 && (
                        <p className="text-center text-text-secondary p-4">No results found.</p>
                    )}
                    {searchTerm.length < 2 && (
                         <p className="text-center text-sm text-text-secondary p-4">Enter at least 2 characters to search.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

// --- Main Modal Component ---
export const AddContactFlowModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [view, setView] = useState<'options' | 'manual' | 'search'>('options');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { addContact, createChat, contacts, user } = useAppContext();

    const isContactPickerSupported = 'contacts' in navigator && typeof (navigator as any).contacts.select === 'function';

    const handleImport = useCallback(() => {
        setError('');
        setSuccess('');
        importFromDevice(
            addContact,
            contacts,
            user,
            (newUser) => {
                createChat(newUser.id);
                onClose();
            },
            setError
        );
    }, [addContact, contacts, user, createChat, onClose]);

    const handleImportFromService = (service: 'gmail' | 'apple') => {
        setError('');
        setSuccess(`Simulating import from ${service === 'gmail' ? 'Google' : 'Apple'}...`);

        const gmailImportContact = { name: 'Gia Miller', email: 'gia.miller@gmail.com', phone: '+1-555-987-6543' };
        const appleImportContact = { name: 'Adam Applebaum', email: 'adam.a@icloud.com', phone: '+1-555-111-2222' };

        const contactToAdd = service === 'gmail' ? gmailImportContact : appleImportContact;

        setTimeout(() => {
            const newUser = addContact(contactToAdd);
            if (newUser) {
                setSuccess(`Successfully imported ${newUser.name}! Starting chat...`);
                setTimeout(() => {
                    createChat(newUser.id);
                    onClose();
                }, 1500);
            } else {
                const existing = contacts.find(c => c.email.toLowerCase() === contactToAdd.email.toLowerCase());
                setSuccess(`${contactToAdd.name} is already in your contacts. Opening chat.`);
                 setTimeout(() => {
                    setSuccess('');
                    if (existing) {
                        createChat(existing.id);
                        onClose();
                    }
                }, 2000);
            }
        }, 1500);
    };
    
    const renderContent = () => {
        switch (view) {
            case 'manual': return <ManualAddView onBack={() => setView('options')} onClose={onClose} />;
            case 'search': return <SearchDirectoryView onBack={() => setView('options')} onClose={onClose} />;
            case 'options':
            default:
                return (
                    <>
                        <div className="text-center">
                            <UserPlusIcon className="w-12 h-12 text-highlight mx-auto mb-2" />
                            <h3 className="text-xl font-bold">Add New Contact</h3>
                            <p className="text-sm text-text-secondary">Choose how you'd like to add a new contact.</p>
                        </div>
                        {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg text-center mt-4">{error}</p>}
                        {success && <p className="text-sm text-green-400 bg-green-500/10 p-3 rounded-lg text-center mt-4 flex items-center justify-center">
                            {success.startsWith('Simulating') && <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {success}
                        </p>}
                        <div className="mt-6">
                            <OptionsView setView={setView} onImport={handleImport} onImportFromService={handleImportFromService} isContactPickerSupported={isContactPickerSupported}/>
                        </div>
                    </>
                );
        }
    };
    
    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-sm p-6 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-text-secondary hover:text-white z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="flex-1 min-h-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
