import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, ActivityType, User, Chat } from '../types';
import { 
    PhoneXMarkIcon, CalendarDaysIcon, AtSymbolIcon, ThumbsUpIcon, ReplyIcon, XIcon, BellIcon,
    DotsHorizontalIcon, EnvelopeOpenIcon, TrashIcon
} from './icons';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
};

const formatTimestamp = (timestamp: string, timezone?: string): string => {
    if (!timestamp) return '';
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    if (now.getTime() - messageDate.getTime() < 60000) return 'Just now';
    if (now.getTime() - messageDate.getTime() < 3600000) return `${Math.floor((now.getTime() - messageDate.getTime())/60000)}m`;

    const ymdFormatter = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone });
    const todayStr = ymdFormatter.format(now);
    const messageDateStr = ymdFormatter.format(messageDate);

    if (messageDateStr === todayStr) {
        return messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: timezone }).toLowerCase();
    }
    
    return messageDate.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
};

const getChatName = (chat: Chat, currentUserId: string, getContactById: (id: string) => User | undefined): string => {
    if (chat.type === 'group') {
        return chat.name || 'Group Chat';
    }
    const partnerId = chat.participants.find(p => p !== currentUserId);
    return partnerId ? getContactById(partnerId)?.name || 'Chat' : 'Chat';
};

const ActivityItem: React.FC<{ activity: Activity }> = React.memo(({ activity }) => {
    const { getContactById, getChatById, user, setActiveChatId, setActiveFeature, markActivityAsRead, removeActivity } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const actor = getContactById(activity.actorId);
    const chat = getChatById(activity.chatId);

    if (!actor || !chat) return null;

    let icon: React.ReactNode;
    let title = '';
    let preview = activity.previewText || '';
    let previewIcon = null;

    switch(activity.type) {
        case ActivityType.Mention:
            icon = <AtSymbolIcon className="w-5 h-5 text-text-secondary" />;
            title = `${actor.name} mentioned you`;
            break;
        case ActivityType.Reaction:
            icon = <ThumbsUpIcon className="w-5 h-5 text-text-secondary" />;
            title = `${actor.name} reacted to your message`;
            preview = `reacted to your message`;
            previewIcon = <span className="text-lg mr-1">{activity.previewText}</span>
            break;
        case ActivityType.Reply:
            icon = <ReplyIcon className="w-5 h-5 text-text-secondary" />;
            title = `${actor.name} replied to you`;
            break;
        case ActivityType.MissedCall:
            icon = <PhoneXMarkIcon className="w-5 h-5 text-red-400" />;
            title = `Missed call from ${actor.name}`;
            preview = ``;
            break;
        case ActivityType.MeetingInvite:
            icon = <CalendarDaysIcon className="w-5 h-5 text-text-secondary" />;
            title = `${actor.name} invited you to an event`;
            break;
        case ActivityType.MeetingCancel:
            icon = <XIcon className="w-5 h-5 text-red-400" />;
            title = `${actor.name} cancelled an event`;
            break;
        default:
            icon = <BellIcon className="w-5 h-5 text-text-secondary" />;
            title = 'New activity';
    }

    const handleClick = () => {
        setActiveChatId(activity.chatId);
        setActiveFeature('chat');
        markActivityAsRead({ activityId: activity.id, read: true });
    };

    return (
        <li onClick={handleClick} className="flex p-3 space-x-4 cursor-pointer hover:bg-slate-700/50 rounded-lg group relative">
            <div className="w-10 flex-shrink-0 pt-1">
                 <img src={getAvatarUrl(actor.name, actor.avatar)} alt={actor.name} className="w-8 h-8 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className="text-sm">
                        <span className="font-bold text-text-primary">{title}</span>
                    </p>
                    <span className="text-xs text-text-secondary flex-shrink-0 ml-2">{formatTimestamp(activity.timestamp, user.settings?.timezone)}</span>
                </div>
                {preview && (
                    <p className="text-sm text-text-secondary truncate pr-8 flex items-center gap-1 mt-0.5">
                        {previewIcon}
                        {preview}
                    </p>
                )}
                 <div className="flex items-center space-x-2 text-xs text-text-secondary mt-1">
                    {icon}
                    <span>{getChatName(chat, user.id, getContactById)}</span>
                </div>
            </div>
             <div ref={menuRef} className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(p => !p);
                    }}
                    className="p-1 text-text-secondary hover:text-white rounded-full hover:bg-slate-600"
                >
                    <DotsHorizontalIcon className="w-5 h-5"/>
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-primary rounded-lg shadow-2xl border border-slate-600 w-48 py-1 z-20">
                        <button onClick={(e) => { e.stopPropagation(); markActivityAsRead({ activityId: activity.id, read: !activity.isRead }); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-secondary">
                            <EnvelopeOpenIcon className="w-4 h-4 mr-3" />
                            Mark as {activity.isRead ? 'Unread' : 'Read'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeActivity(activity.id); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-secondary">
                            <TrashIcon className="w-4 h-4 mr-3" />
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
});

const ActivityDayGroup: React.FC<{ label: string, activities: Activity[] }> = ({ label, activities }) => {
    if (activities.length === 0) return null;
    return (
        <div>
            <h3 className="px-3 py-2 text-sm font-bold text-text-primary uppercase tracking-wider">{label}</h3>
            <ul className="divide-y divide-slate-800">
                {activities.map(activity => <ActivityItem key={activity.id} activity={activity} />)}
            </ul>
        </div>
    );
}

export const ActivityView: React.FC = () => {
    const { activities, user } = useAppContext();
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mentions'>('all');

    const filteredActivities = useMemo(() => {
        switch (activeFilter) {
            case 'unread':
                return activities.filter(a => !a.isRead);
            case 'mentions':
                return activities.filter(a => a.type === ActivityType.Mention);
            case 'all':
            default:
                return activities;
        }
    }, [activities, activeFilter]);

    const { todayActivities, yesterdayActivities, olderActivities } = useMemo(() => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const ymdFormatter = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: user.settings?.timezone });

        const todayStr = ymdFormatter.format(today);
        const yesterdayStr = ymdFormatter.format(yesterday);
        
        const todayActivities: Activity[] = [];
        const yesterdayActivities: Activity[] = [];
        const olderActivities: Activity[] = [];

        filteredActivities.forEach(activity => {
            const activityDateStr = ymdFormatter.format(new Date(activity.timestamp));
            if (activityDateStr === todayStr) {
                todayActivities.push(activity);
            } else if (activityDateStr === yesterdayStr) {
                yesterdayActivities.push(activity);
            } else {
                olderActivities.push(activity);
            }
        });

        return { todayActivities, yesterdayActivities, olderActivities };
    }, [filteredActivities, user.settings?.timezone]);

    return (
        <div className="w-full h-full flex flex-col bg-secondary text-text-primary">
            <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0 h-[77px]">
                <h2 className="text-xl font-bold">Activity</h2>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveFilter('all')} className={`px-3 py-1 text-sm font-semibold rounded-md border border-slate-600 transition-colors ${activeFilter === 'all' ? 'bg-highlight text-white border-highlight' : 'bg-primary hover:bg-slate-700'}`}>All</button>
                    <button onClick={() => setActiveFilter('unread')} className={`px-3 py-1 text-sm font-semibold rounded-md border border-slate-600 transition-colors ${activeFilter === 'unread' ? 'bg-highlight text-white border-highlight' : 'bg-primary hover:bg-slate-700'}`}>Unread</button>
                    <button onClick={() => setActiveFilter('mentions')} className={`px-3 py-1 text-sm font-semibold rounded-md border border-slate-600 transition-colors ${activeFilter === 'mentions' ? 'bg-highlight text-white border-highlight' : 'bg-primary hover:bg-slate-700'}`}>@Mentions</button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
                        <BellIcon className="w-16 h-16 mb-4"/>
                        <h3 className="text-lg font-bold text-text-primary">Your activity feed is empty</h3>
                        <p>Mentions, reactions, and other notifications will show up here.</p>
                    </div>
                ) : (
                    <>
                        <ActivityDayGroup label="Today" activities={todayActivities} />
                        <ActivityDayGroup label="Yesterday" activities={yesterdayActivities} />
                        <ActivityDayGroup label="Older" activities={olderActivities} />
                    </>
                )}
            </div>
        </div>
    );
};
