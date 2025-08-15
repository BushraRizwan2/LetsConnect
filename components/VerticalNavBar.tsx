
import React from 'react';
import { 
    BellIcon, ChatBubbleLeftRightIcon, PhoneIcon, UsersIcon, CalendarDaysIcon, 
    ClockIcon, PencilSquareIcon, CogIcon, TeamsLogoIcon, DiamondIcon
} from './icons';
import { ActiveFeature } from '../types';

interface VerticalNavBarProps {
    activeFeature: ActiveFeature;
    setActiveFeature: (feature: ActiveFeature) => void;
    unreadCount: number;
}

const NavButton: React.FC<{
    icon: React.FC<{className?: string}>;
    label: string;
    isActive: boolean;
    onClick: () => void;
    notificationCount?: number;
}> = ({ icon: Icon, label, isActive, onClick, notificationCount = 0 }) => (
    <button
        onClick={onClick}
        className="group w-full flex flex-col items-center justify-center py-3 rounded-lg relative transition-colors hover:bg-slate-700"
        title={label}
    >
        {isActive && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-highlight rounded-r-full"></div>
        )}
        <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-white'}`} />
        <span className={`text-xs mt-1 font-semibold transition-colors ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-white'}`}>
            {label}
        </span>
        {notificationCount > 0 && (
            <span className="absolute top-1 right-3 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {notificationCount}
            </span>
        )}
    </button>
);

export const VerticalNavBar: React.FC<VerticalNavBarProps> = ({ activeFeature, setActiveFeature, unreadCount }) => {
    const mainNavItems = [
        { key: 'activity', icon: BellIcon, label: 'Activity' },
        { key: 'chat', icon: ChatBubbleLeftRightIcon, label: 'Chats', count: unreadCount },
        { key: 'calls', icon: PhoneIcon, label: 'Calls' },
        { key: 'contacts', icon: UsersIcon, label: 'Contacts' },
        { key: 'calendar', icon: CalendarDaysIcon, label: 'Calendar' },
        { key: 'timesheet', icon: ClockIcon, label: 'Timesheet' },
    ];

    const secondaryNavItems = [
        { key: 'templates', icon: PencilSquareIcon, label: 'Templates' }
    ];

    return (
        <nav className="w-24 bg-primary flex flex-col items-center justify-between flex-shrink-0 border-r border-slate-700 py-2">
            <div className="w-full px-2">
                <button className="w-full flex items-center justify-center py-3 text-accent" title="Let's Connect Home">
                    <TeamsLogoIcon className="w-8 h-8"/>
                </button>
                <div className="space-y-1 mt-4">
                    {mainNavItems.map(item => (
                        <NavButton 
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeFeature === item.key}
                            onClick={() => setActiveFeature(item.key as ActiveFeature)}
                            notificationCount={item.count}
                        />
                    ))}
                </div>
            </div>

            <div className="w-full px-2">
                <div className="space-y-1">
                    {secondaryNavItems.map(item => (
                        <NavButton 
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeFeature === item.key}
                            onClick={() => setActiveFeature(item.key as ActiveFeature)}
                        />
                    ))}
                </div>
                 <div className="my-2 h-px bg-slate-600 w-3/4 mx-auto"></div>
                 <NavButton 
                    icon={CogIcon} 
                    label="Settings" 
                    isActive={activeFeature === 'settings'} 
                    onClick={() => setActiveFeature('settings')} 
                />
            </div>
        </nav>
    );
};
