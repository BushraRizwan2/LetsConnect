import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Message, User } from '../types';
import { XIcon } from './icons';

interface ReactionDetailsModalProps {
    message: Message;
    onClose: () => void;
}

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

export const ReactionDetailsModal: React.FC<ReactionDetailsModalProps> = ({ message, onClose }) => {
    const { getContactById } = useAppContext();

    const reactions = useMemo(() => {
        if (!message.reactions) return [];
        return Object.entries(message.reactions).map(([emoji, userIds]) => ({
            emoji,
            users: userIds.map(id => getContactById(id)).filter((u): u is User => !!u)
        })).filter(r => r.users.length > 0);
    }, [message.reactions, getContactById]);

    const allReactors = useMemo(() => {
        const all = reactions.flatMap(r => r.users);
        return Array.from(new Map(all.map(item => [item.id, item])).values());
    }, [reactions]);

    const [activeTab, setActiveTab] = useState('All');

    const tabs = useMemo(() => ['All', ...reactions.map(r => r.emoji)], [reactions]);

    const renderContent = () => {
        let reactorsToShow: User[] = [];

        if (activeTab !== 'All') {
            const reactionGroup = reactions.find(r => r.emoji === activeTab);
            reactorsToShow = reactionGroup ? reactionGroup.users : [];

            return (
                <ul>
                    {reactorsToShow.map(user => (
                        <li key={user.id} className="flex items-center p-3">
                            <img src={getAvatarUrl(user.name, user.avatar)} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                            <span className="font-semibold">{user.name}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        // "All" tab view
        return (
            <div className="space-y-4">
                {reactions.map(({ emoji, users }) => (
                     <div key={emoji} className="flex items-start space-x-4">
                        <span className="text-3xl pt-1">{emoji}</span>
                        <div className="flex-1">
                            <p className="font-bold text-text-primary mb-1">{users.length}</p>
                            <ul>
                                {users.map(user => (
                                    <li key={user.id} className="text-text-secondary">
                                        {user.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-xl font-bold">Reactions</h3>
                    <button onClick={onClose} className="p-1 text-text-secondary hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <nav className="flex-shrink-0 border-b border-slate-700 p-2 flex space-x-2 overflow-x-auto">
                    {tabs.map(tab => {
                        const count = tab === 'All' ? allReactors.length : reactions.find(r => r.emoji === tab)?.users.length || 0;
                        if(count === 0) return null;
                        return (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${activeTab === tab ? 'bg-highlight text-white' : 'bg-secondary text-text-secondary hover:bg-slate-700'}`}>
                                <span>{tab}</span>
                                <span>{count}</span>
                            </button>
                        )
                    })}
                </nav>
                <div className="flex-1 overflow-y-auto p-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
