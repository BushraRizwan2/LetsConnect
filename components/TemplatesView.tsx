import React from 'react';
import { 
    CompassIcon, UsersIcon, BuildingOfficeIcon, FolderIcon, BriefcaseIcon, MegaphoneIcon, QuestionMarkCircleIcon, ComputerDesktopIcon,
    ClockIcon, ClipboardDocumentListIcon, ChatBubbleLeftIcon, CalendarDaysIcon, XIcon
} from './icons';

interface TemplatesViewProps {
    onClose: () => void;
}

const LeftMenuItem: React.FC<{ icon: React.FC<{className?: string}>, text: string, isActive?: boolean }> = ({ icon: Icon, text, isActive }) => (
    <button className={`w-full flex items-center p-2 text-left rounded-md ${isActive ? 'bg-highlight text-white' : 'hover:bg-secondary'}`}>
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <span className="font-semibold truncate">{text}</span>
    </button>
);

const CategoryCard: React.FC<{ icon: React.FC<{className?: string}>, text: string }> = ({ icon: Icon, text }) => (
    <div className="bg-primary p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-3 aspect-square hover:bg-slate-700 cursor-pointer transition-colors">
        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
            <Icon className="w-8 h-8 text-highlight" />
        </div>
        <p className="font-semibold text-text-primary">{text}</p>
    </div>
);

const TemplatePreviewCard: React.FC<{ title: string, imgSrc: string }> = ({ title, imgSrc }) => (
    <div className="bg-primary rounded-lg overflow-hidden group cursor-pointer">
        <div className="aspect-[4/3] bg-secondary overflow-hidden">
            <img src={imgSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
            <p className="font-semibold text-text-primary truncate">{title}</p>
        </div>
    </div>
);


export const TemplatesView: React.FC<TemplatesViewProps> = ({ onClose }) => {
    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-secondary">
             <header className="flex items-center justify-between p-4 border-b border-slate-700 h-[77px] flex-shrink-0 bg-primary">
                <h2 className="text-xl font-bold flex items-center">Templates <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-accent text-white rounded-md">PRO</span></h2>
                <div className="flex items-center space-x-4">
                    <button className="px-4 py-2 text-sm font-semibold bg-secondary rounded-md border border-slate-600 hover:bg-slate-700">
                        Build a Template
                    </button>
                     <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-white">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>
            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane */}
                <div className="w-1/4 max-w-xs flex-shrink-0 bg-primary flex flex-col border-r border-slate-700">
                    <div className="flex-1 overflow-y-auto p-2 space-y-4">
                        <div className="space-y-1">
                            <LeftMenuItem icon={CompassIcon} text="All templates" isActive />
                            <LeftMenuItem icon={UsersIcon} text="Your templates" />
                        </div>
                        <div>
                            <h3 className="px-2 py-1 text-sm font-semibold text-text-secondary">Browse by department</h3>
                            <div className="space-y-1 mt-1">
                                <LeftMenuItem icon={BriefcaseIcon} text="Sales" />
                                <LeftMenuItem icon={MegaphoneIcon} text="Marketing" />
                                <LeftMenuItem icon={UsersIcon} text="Human resources" />
                                <LeftMenuItem icon={QuestionMarkCircleIcon} text="Customer service" />
                                <LeftMenuItem icon={ComputerDesktopIcon} text="IT" />
                            </div>
                        </div>
                         <div>
                            <h3 className="px-2 py-1 text-sm font-semibold text-text-secondary">Browse by topic</h3>
                            <div className="space-y-1 mt-1">
                                <LeftMenuItem icon={ClockIcon} text="Productivity" />
                                <LeftMenuItem icon={ClipboardDocumentListIcon} text="Project management" />
                                <LeftMenuItem icon={UsersIcon} text="Team management" />
                                <LeftMenuItem icon={ChatBubbleLeftIcon} text="Communication" />
                                <LeftMenuItem icon={CalendarDaysIcon} text="Planning" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Pane */}
                <main className="flex-1 overflow-y-auto p-8 space-y-10">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight">Get work started faster with <span className="text-highlight">templates</span></h1>
                            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">Upgrade to a paid plan to unlock templates that help your team work smarter, together.</p>
                            <button className="mt-6 px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors">
                                Upgrade Now
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            <CategoryCard icon={BriefcaseIcon} text="Sales" />
                            <CategoryCard icon={MegaphoneIcon} text="Marketing" />
                            <CategoryCard icon={UsersIcon} text="Human resources" />
                            <CategoryCard icon={QuestionMarkCircleIcon} text="Customer service" />
                            <CategoryCard icon={ComputerDesktopIcon} text="IT" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-6">Browse all templates</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <TemplatePreviewCard title="Project starter kit" imgSrc="https://i.imgur.com/8aK3q4Y.png" />
                                <TemplatePreviewCard title="New hire onboarding" imgSrc="https://i.imgur.com/jB3e5Zg.png" />
                                <TemplatePreviewCard title="Help requests process" imgSrc="https://i.imgur.com/k9o4U8p.png" />
                            </div>
                        </div>
                </main>
            </div>
        </div>
    );
};