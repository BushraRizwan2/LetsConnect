
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { XIcon, BellIcon, LockClosedIcon, QuestionMarkCircleIcon, ChevronRightIcon, ChevronLeftIcon, BookOpenIcon, BanIcon, CogIcon, SparklesIcon, VideoCameraIcon, PhoneIcon, ChatBubbleLeftRightIcon, UserCircleIcon, ExclamationTriangleIcon, PlayIcon, ArrowRightOnRectangleIcon, HashtagIcon, SpellcheckIcon, CloudIcon, ThemeIcon, ThumbsUpIcon, WandIcon, PhotoIcon, EmailIcon, CakeIcon, CurrencyDollarIcon, IdentificationIcon, UsersIcon, PencilIcon, CameraIcon } from './icons';
import { UserSettings } from '../types';
import { timezones } from '../data/timezones';
import { languages as translationLanguages } from '../data/languages';

const ProfileVisibilityModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, updateUserSettings } = useAppContext();
    
    const RadioOption: React.FC<{ label: string; description: string; value: string; checked: boolean; onChange: () => void; }> = ({ label, description, value, checked, onChange }) => (
        <label className="flex items-center space-x-4 cursor-pointer p-2 -ml-2 rounded-lg hover:bg-slate-700">
            <input
                type="radio"
                name="visibility"
                value={value}
                checked={checked}
                onChange={onChange}
                className="w-5 h-5 text-accent bg-secondary border-slate-500 focus:ring-highlight shrink-0"
            />
            <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-text-secondary">{description}</p>
            </div>
        </label>
    );
    
    return (
         <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                <div className="flex items-center mb-4 relative">
                    <button onClick={onClose} className="p-2 -ml-2 text-text-secondary hover:text-white">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <h3 className="text-xl font-bold text-center flex-1 pr-6">Profile Visibility</h3>
                </div>
                 <p className="text-sm text-center text-text-secondary mb-4">Choose who can see your profile picture.</p>
                 <div className="space-y-4">
                     <RadioOption
                        label="Public (recommended)"
                        description="Visible to everyone"
                        value="public"
                        checked={user.settings?.profilePictureVisibility === 'public'}
                        onChange={() => updateUserSettings({ profilePictureVisibility: 'public' })}
                    />
                    <RadioOption
                        label="Contacts only"
                        description="Visible just to your contacts"
                        value="contacts"
                        checked={user.settings?.profilePictureVisibility === 'contacts'}
                        onChange={() => updateUserSettings({ profilePictureVisibility: 'contacts' })}
                    />
                 </div>
            </div>
         </div>
    );
};

interface SideBarSettingsProps {
  onClose: () => void;
  onOpenProfilePictureModal: () => void;
}

type SettingsView = 'main' | 'account' | 'general' | 'appearance' | 'audioVideo' | 'calling' | 'messaging' | 'notifications' | 'contacts' | 'privacy' | 'help';

const ToggleSwitch: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className={`flex items-center justify-between py-3 ${!description ? 'min-h-[52px] px-2' : ''}`}>
    <div>
      <h4 className="font-semibold text-text-primary">{label}</h4>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-highlight' : 'bg-secondary'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const Checkbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer p-2 -ml-2">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded bg-secondary border-slate-500 text-accent focus:ring-highlight focus:ring-offset-primary focus:ring-2"
        />
        <span className="font-semibold text-text-primary">{label}</span>
    </label>
);

const GeneralSettingsView: React.FC = () => {
    const { user, updateUserSettings } = useAppContext();
    const settings = user.settings;

    const handleSettingChange = (newSettings: Partial<UserSettings>) => {
        if (settings) {
            updateUserSettings(newSettings);
        }
    };
    
    const handleRemoveNeverTranslate = (lang: string) => {
        const newLangs = settings?.neverTranslateLanguages.filter(l => l !== lang);
        handleSettingChange({ neverTranslateLanguages: newLangs });
    };

    const handleAddNeverTranslate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        if (lang && !settings?.neverTranslateLanguages.includes(lang)) {
            const newLangs = [...(settings?.neverTranslateLanguages || []), lang];
            handleSettingChange({ neverTranslateLanguages: newLangs });
        }
    };

    const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Russian'];
    
    const SettingsCard: React.FC<{ title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode; }> = ({ title, icon: Icon, children }) => (
        <div className="bg-primary rounded-lg">
            <div className="p-4 border-b border-slate-700">
                <h3 className="flex items-center font-semibold"><Icon className="w-5 h-5 mr-3 text-text-secondary" /> {title}</h3>
            </div>
            <div className="p-4 space-y-4">
                {children}
            </div>
        </div>
    );

    const ImageRadio: React.FC<{
        label: string;
        value: string;
        name: string;
        currentValue: string;
        onChange: (value: string) => void;
        children: React.ReactNode;
    }> = ({ label, value, name, currentValue, onChange, children }) => {
        const isChecked = value === currentValue;
        return (
            <div 
                onClick={() => onChange(value)}
                className={`cursor-pointer p-3 rounded-lg border-2 w-full ${isChecked ? 'border-highlight bg-accent/20' : 'border-slate-600 bg-secondary'}`}
            >
                <div className="flex justify-center items-center h-24 bg-primary p-4 rounded-md">
                    {children}
                </div>
                <div className="flex items-center mt-3">
                    <input
                        type="radio"
                        name={name}
                        value={value}
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 text-highlight bg-secondary border-slate-500 focus:ring-highlight"
                    />
                    <span className="ml-2 text-sm font-semibold">{label}</span>
                </div>
            </div>
        );
    };

    if (!settings) return null;

    return (
        <div className="p-4 space-y-4">
            <SettingsCard title="System" icon={CogIcon}>
                <ToggleSwitch label="Auto-start Teams" checked={settings.autoStartApp} onChange={(val) => handleSettingChange({ autoStartApp: val })}/>
                <ToggleSwitch label="Open application in background" checked={settings.openInBackground} onChange={(val) => handleSettingChange({ openInBackground: val })}/>
            </SettingsCard>
            
            <div className="bg-primary rounded-lg p-4">
                <p className="font-semibold mb-2">Opening content in Teams windows</p>
                <p className="text-sm text-text-secondary mb-4">Open incoming notifications and links in the main window or a new window. This will only apply to this account.</p>
                <div className="flex gap-4">
                    <ImageRadio name="openContentIn" label="Main window" value="main" currentValue={settings.openContentIn} onChange={(val) => handleSettingChange({ openContentIn: val as 'main' | 'new' })}>
                        <div className="w-32 h-20 bg-slate-700 rounded-md p-2 shadow-inner"><div className="w-full h-full bg-primary rounded-sm p-2"><div className="w-10 h-3 bg-accent rounded-sm"></div></div></div>
                    </ImageRadio>
                    <ImageRadio name="openContentIn" label="New window" value="new" currentValue={settings.openContentIn} onChange={(val) => handleSettingChange({ openContentIn: val as 'main' | 'new' })}>
                        <div className="relative w-32 h-20">
                            <div className="absolute top-3 left-3 w-28 h-16 bg-slate-700 rounded-md p-1 shadow-inner"><div className="w-full h-full bg-primary rounded-sm"></div></div>
                            <div className="absolute top-0 left-0 w-28 h-16 bg-slate-600 rounded-md p-2 border-2 border-slate-500 shadow-lg"><div className="w-full h-full bg-primary rounded-sm p-1"><div className="w-8 h-2 bg-accent rounded-sm"></div></div></div>
                        </div>
                    </ImageRadio>
                </div>
            </div>

            <div className="bg-primary rounded-lg p-4">
                    <p className="font-semibold mb-2">Starting chats</p>
                <p className="text-sm text-text-secondary mb-4">Create new chats in the main window or a new window. This will only apply to this account.</p>
                <div className="flex gap-4">
                    <ImageRadio name="startChatsIn" label="Main window" value="main" currentValue={settings.startChatsIn} onChange={(val) => handleSettingChange({ startChatsIn: val as 'main' | 'new' })}>
                        <div className="w-32 h-20 bg-slate-700 rounded-md p-2 shadow-inner"><div className="w-full h-full bg-primary rounded-sm p-2"><div className="w-10 h-3 bg-accent rounded-sm"></div></div></div>
                    </ImageRadio>
                    <ImageRadio name="startChatsIn" label="New window" value="new" currentValue={settings.startChatsIn} onChange={(val) => handleSettingChange({ startChatsIn: val as 'main' | 'new' })}>
                        <div className="relative w-32 h-20">
                            <div className="absolute top-3 left-3 w-28 h-16 bg-slate-700 rounded-md p-1 shadow-inner"><div className="w-full h-full bg-primary rounded-sm"></div></div>
                            <div className="absolute top-0 left-0 w-28 h-16 bg-slate-600 rounded-md p-2 border-2 border-slate-500 shadow-lg"><div className="w-full h-full bg-primary rounded-sm p-1"><div className="w-8 h-2 bg-accent rounded-sm"></div></div></div>
                        </div>
                    </ImageRadio>
                </div>
            </div>

            <div className="bg-primary rounded-lg p-4 space-y-4">
                <div>
                    <p className="font-semibold mb-1">Time zone</p>
                    <p className="text-sm text-text-secondary mb-2">Set your local time zone for calendar.</p>
                    <select value={settings.timezone} onChange={(e) => handleSettingChange({ timezone: e.target.value })} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-highlight focus:outline-none">
                        {timezones.map(tz => <option key={tz.identifier} value={tz.identifier}>{tz.name}</option>)}
                    </select>
                </div>
                <div className="border-t border-slate-700 pt-4">
                    <p className="font-semibold mb-1">Language</p>
                    <p className="text-sm text-text-secondary mb-2">Restart Teams to apply these settings</p>
                        <select value={settings.appLanguage} onChange={(e) => handleSettingChange({ appLanguage: e.target.value })} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-highlight focus:outline-none">
                        {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
                <div className="border-t border-slate-700 pt-4">
                    <p className="font-semibold mb-2">Translation</p>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">Preferred In-Meeting Translation</label>
                                <select value={settings.translationLanguage} onChange={(e) => handleSettingChange({ translationLanguage: e.target.value })} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-highlight focus:outline-none">
                                {translationLanguages.map(lang => <option key={lang.code} value={lang.name}>{lang.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-primary rounded-lg p-4">
                    <ToggleSwitch 
                    label="Keep the app bar visible when resizing" 
                    description="When reducing the size of your Teams window, the app bar will remain visible for most window sizes." 
                    checked={settings.keepAppBarVisible} 
                    onChange={(val) => handleSettingChange({ keepAppBarVisible: val })}
                />
            </div>

            <div className="bg-primary rounded-lg p-4">
                    <ToggleSwitch 
                    label="Suggested replies" 
                    description="Show suggested replies in chat." 
                    checked={settings.showSuggestedReplies} 
                    onChange={(val) => handleSettingChange({ showSuggestedReplies: val })}
                />
            </div>

            <SettingsCard title="Spell check" icon={SpellcheckIcon}>
                <Checkbox
                    label="Enable spell check (requires restarting Teams)"
                    checked={settings.enableSpellCheck}
                    onChange={(val) => handleSettingChange({ enableSpellCheck: val })}
                />
            </SettingsCard>

            <SettingsCard title="Microsoft cloud storage" icon={CloudIcon}>
                {(() => {
                    const percentage = settings.cloudStorageTotal > 0 ? (settings.cloudStorageUsed / settings.cloudStorageTotal) * 100 : 0;
                    return (
                        <div className="space-y-3">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-bold">{settings.cloudStorageUsed.toFixed(1)} GB</span>
                                <span className="text-text-secondary">of {settings.cloudStorageTotal} GB ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-highlight h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div>
                                <button onClick={() => alert('Learn more about cloud storage!')} className="text-sm font-semibold text-highlight hover:underline">Learn more about cloud storage</button>
                            </div>
                            <div className="pt-2">
                                <button onClick={() => alert('Manage storage clicked!')} className="px-4 py-2 text-sm font-semibold bg-secondary rounded-lg border border-slate-600 hover:bg-slate-700">
                                    Manage
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </SettingsCard>
        </div>
    );
};

const AppearanceSettingsView: React.FC = () => {
    const { user, updateUserSettings } = useAppContext();
    const settings = user.settings;

    if (!settings) return null;

    const handleSettingChange = (newSettings: Partial<UserSettings>) => {
        updateUserSettings(newSettings);
    };

    const themeOptions = [
        { value: 'system', label: 'Follow operating system theme' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'highContrast', label: 'High contrast' }
    ];

    const skinTones = [
        { id: 'default', color: '#ffc83d' },
        { id: 'light', color: '#fadcbc' },
        { id: 'medium-light', color: '#e0bb95' },
        { id: 'medium', color: '#bf8f68' },
        { id: 'medium-dark', color: '#9d643c' },
        { id: 'dark', color: '#593d2b' },
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="bg-primary rounded-lg p-4 space-y-4">
                <div className="flex items-start">
                    <ThemeIcon className="w-6 h-6 mr-4 text-text-secondary mt-1" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">Theme</h3>
                        <p className="text-sm text-text-secondary mb-3">This will apply to all your Teams apps</p>
                        <select
                            value={settings.theme}
                            onChange={(e) => handleSettingChange({ theme: e.target.value as UserSettings['theme'] })}
                            className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-highlight focus:outline-none"
                        >
                            {themeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <div className="mt-4">
                            <Checkbox
                                label="Always use dark theme for calls and meetings"
                                checked={settings.alwaysUseDarkThemeForCalls}
                                onChange={(val) => handleSettingChange({ alwaysUseDarkThemeForCalls: val })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-primary rounded-lg p-4 space-y-4">
                <div className="flex items-start">
                    <ThumbsUpIcon className="w-6 h-6 mr-4 text-text-secondary mt-1" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">Skin tone preference</h3>
                        <p className="text-sm text-text-secondary mb-3">Reactions and emoji will appear with this skin tone.</p>
                        <div className="flex items-center space-x-2">
                            {skinTones.map(tone => (
                                <div key={tone.id} className="flex flex-col items-center">
                                    <button
                                        onClick={() => handleSettingChange({ skinTonePreference: tone.id as UserSettings['skinTonePreference'] })}
                                        className="w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight"
                                        style={{ backgroundColor: tone.color }}
                                        aria-label={`Select ${tone.id} skin tone`}
                                    />
                                    {settings.skinTonePreference === tone.id && (
                                        <div className="w-4 h-1 bg-highlight rounded-full mt-2"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MessagingSettingsView: React.FC = () => {
    const { user, updateUserSettings } = useAppContext();
    const settings = user.settings;

    if (!settings) return null;

    const handleSettingChange = (newSettings: Partial<UserSettings>) => {
        updateUserSettings(newSettings);
    };

    const textSizes: UserSettings['textSize'][] = ['small', 'normal', 'large'];

    return (
        <div className="p-4">
            <h3 className="font-bold text-sm text-text-secondary uppercase tracking-wider mb-2">Messaging & Chats</h3>
            <div className="bg-primary rounded-lg divide-y divide-slate-700">
                <div className="p-4">
                    <ToggleSwitch 
                        label="Read receipts"
                        description="Send and receive read receipts in chats with 20 or fewer people."
                        checked={settings.showReadReceipts}
                        onChange={(val) => handleSettingChange({ showReadReceipts: val })}
                    />
                </div>
                <div className="p-4">
                    <ToggleSwitch 
                        label="Large emoticons"
                        description="Make single emoticons larger in chat."
                        checked={settings.largeEmoticons}
                        onChange={(val) => handleSettingChange({ largeEmoticons: val })}
                    />
                </div>
                 <div className="p-4">
                    <ToggleSwitch 
                        label="Web link previews"
                        description="Show me a preview of websites I send or receive."
                        checked={settings.webLinkPreviews}
                        onChange={(val) => handleSettingChange({ webLinkPreviews: val })}
                    />
                </div>
                <div className="flex items-center justify-between p-4">
                    <h4 className="font-semibold text-text-primary">Text size</h4>
                    <select
                        value={settings.textSize}
                        onChange={(e) => handleSettingChange({ textSize: e.target.value as UserSettings['textSize'] })}
                        className="bg-secondary p-1 rounded-md border border-slate-600 focus:ring-2 focus:ring-highlight focus:outline-none"
                    >
                        {textSizes.map(size => (
                            <option key={size} value={size} className="capitalize">{size.charAt(0).toUpperCase() + size.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div className="p-4">
                    <ToggleSwitch 
                        label="Send message with Enter key"
                        description="Use Ctrl or Shift or Alt + Enter to insert a new line."
                        checked={settings.sendMessageOnEnter}
                        onChange={(val) => handleSettingChange({ sendMessageOnEnter: val })}
                    />
                </div>
                 <div className="p-4">
                    <ToggleSwitch 
                        label="Paste copied messages as quotes"
                        checked={settings.pasteAsQuote}
                        onChange={(val) => handleSettingChange({ pasteAsQuote: val })}
                    />
                </div>
                 <div className="p-4">
                    <ToggleSwitch 
                        label="Auto-download photos"
                        checked={settings.autoDownloadPhotos}
                        onChange={(val) => handleSettingChange({ autoDownloadPhotos: val })}
                    />
                </div>
                 <div className="p-4">
                    <ToggleSwitch 
                        label="Auto-download files"
                        description="New files received in chat will be automatically downloaded to this device."
                        checked={settings.autoDownloadFiles}
                        onChange={(val) => handleSettingChange({ autoDownloadFiles: val })}
                    />
                </div>
                <div className="flex items-center justify-between p-4">
                    <div>
                        <h4 className="font-semibold text-text-primary">When I receive a file</h4>
                        <p className="text-sm text-text-secondary">Save the file to: <span className="text-highlight font-semibold">{settings.fileSaveLocation}</span></p>
                    </div>
                    <button onClick={() => alert('File system access is not available in this demo.')} className="px-3 py-1.5 text-sm font-semibold bg-secondary rounded-lg border border-slate-600 hover:bg-slate-700">
                        Change Directory
                    </button>
                </div>
            </div>
        </div>
    );
};


const AccountAndProfileView: React.FC<{ onOpenProfilePictureModal: () => void; onOpenVisibilityModal: () => void; }> = ({ onOpenProfilePictureModal, onOpenVisibilityModal }) => {
    const { user, updateUser, logout } = useAppContext();
    const [isEditingBirthday, setIsEditingBirthday] = useState(false);
    const [birthday, setBirthday] = useState(user.birthday || '');

    const handleBirthdaySave = (e: React.FormEvent) => {
        e.preventDefault();
        const newBirthday = (e.currentTarget as HTMLFormElement).querySelector('input')?.value;
        if (newBirthday) {
            updateUser({ birthday: newBirthday });
        }
        setIsEditingBirthday(false);
    };

    const InfoRow: React.FC<{ icon: React.FC<{ className?: string }>, label: string, children: React.ReactNode, actionText?: string, onAction?: (e: React.MouseEvent) => void }> = ({ icon: Icon, label, children, actionText, onAction }) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
            <div className="flex items-center space-x-4">
                <Icon className="w-6 h-6 text-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{label}</p>
                    <div className="text-text-primary truncate">{children}</div>
                </div>
            </div>
            {actionText && (
                <button onClick={onAction} className="flex items-center text-sm font-semibold text-highlight hover:underline flex-shrink-0 ml-2">
                    {actionText}
                    {onAction && <ChevronRightIcon className="w-4 h-4 ml-1" />}
                </button>
            )}
        </div>
    );
    
    const ManageRow: React.FC<{ icon: React.FC<{ className?: string }>, label: string, description: string, buttonText?: string, onAction: () => void, isLink?: boolean, hasButton?: boolean }> =
    ({ icon: Icon, label, description, buttonText, onAction, isLink, hasButton = true }) => (
        <button onClick={onAction} className="flex items-center justify-between w-full text-left py-3 border-b border-slate-700 last:border-b-0">
            <div className="flex items-center space-x-4">
                <Icon className="w-6 h-6 text-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-text-secondary">{description}</p>
                </div>
            </div>
            {hasButton && (
                isLink ?
                <ChevronRightIcon className="w-5 h-5 text-text-secondary" /> :
                <span className="text-sm font-semibold text-highlight">{buttonText}</span>
            )}
        </button>
    );

    return (
        <div className="p-4">
            <div className="text-center mb-6">
                <button onClick={onOpenProfilePictureModal} className="relative group mx-auto">
                    <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-600" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PencilIcon className="w-8 h-8 text-white"/>
                    </div>
                </button>
                <h3 className="mt-4 text-2xl font-bold">{user.name}</h3>
                <p className="text-text-secondary">{user.email}</p>
            </div>
            
            <div className="bg-primary rounded-lg p-4">
                <InfoRow icon={EmailIcon} label="Email address">{user.email}</InfoRow>
                <InfoRow icon={PhoneIcon} label="Phone number">
                    {user.phone ? user.phone : <span className="text-text-secondary italic">Not set</span>}
                </InfoRow>
                <InfoRow icon={CakeIcon} label="Birthday">
                     {isEditingBirthday ? (
                        <form onSubmit={handleBirthdaySave} className="flex gap-2">
                            <input
                                type="date"
                                value={birthday}
                                onChange={e => setBirthday(e.target.value)}
                                className="bg-secondary p-1 rounded-md text-sm"
                                autoFocus
                            />
                            <button type="submit" className="text-sm text-highlight">Save</button>
                        </form>
                     ) : (
                        user.birthday ? new Date(user.birthday).toLocaleDateString('default', {month:'long', day:'numeric', year:'numeric'}) : <span className="text-text-secondary italic">Not set</span>
                     )}
                </InfoRow>
                 <InfoRow icon={IdentificationIcon} label="Teams name" actionText="Manage" onAction={() => alert('Manage Teams name clicked!')}>
                    {user.skypeName}
                </InfoRow>
            </div>

            <div className="bg-primary rounded-lg p-4 mt-4">
                <h3 className="font-semibold mb-2">Manage your account</h3>
                <ManageRow icon={UsersIcon} label="Profile visibility" description="Choose who can see your profile picture" isLink onAction={onOpenVisibilityModal} />
                <ManageRow icon={CurrencyDollarIcon} label="Skype Credits" description="Auto-recharge is off" buttonText={`$${user.skypeCredits?.toFixed(2)}`} onAction={() => alert('Manage Skype Credits')} />
                <ManageRow icon={HashtagIcon} label="Skype Number" description="Your number for receiving calls" buttonText={user.skypeNumber} onAction={() => alert('Manage Skype Number')} />
                 <ManageRow icon={ArrowRightOnRectangleIcon} label="Sign out" description="You can sign back in at any time" hasButton={false} onAction={logout} />
            </div>
        </div>
    );
};


export const SideBarSettings: React.FC<SideBarSettingsProps> = ({ onClose, onOpenProfilePictureModal }) => {
    const [activeView, setActiveView] = useState<SettingsView>('account');
    const [showDetails, setShowDetails] = useState(false);
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);

    const menuItems = [
        { key: 'account', icon: UserCircleIcon, label: 'Account & Profile' },
        { key: 'general', icon: CogIcon, label: 'General' },
        { key: 'appearance', icon: ThemeIcon, label: 'Appearance' },
        { key: 'audioVideo', icon: VideoCameraIcon, label: 'Audio & Video' },
        { key: 'calling', icon: PhoneIcon, label: 'Calling' },
        { key: 'messaging', icon: ChatBubbleLeftRightIcon, label: 'Messaging' },
        { key: 'notifications', icon: BellIcon, label: 'Notifications' },
        { key: 'contacts', icon: UsersIcon, label: 'Contacts', sub: 'Privacy, blocked contacts' },
        { key: 'privacy', icon: LockClosedIcon, label: 'Privacy', sub: 'How your data is used' },
        { key: 'help', icon: QuestionMarkCircleIcon, label: 'Help & feedback' },
    ];
    
    const renderCurrentView = () => {
        switch(activeView) {
            case 'account': return <AccountAndProfileView onOpenProfilePictureModal={onOpenProfilePictureModal} onOpenVisibilityModal={() => setShowVisibilityModal(true)}/>
            case 'general': return <GeneralSettingsView />;
            case 'appearance': return <AppearanceSettingsView />;
            case 'messaging': return <MessagingSettingsView />;
            // Placeholder for other views
            case 'audioVideo':
            case 'calling':
            case 'notifications':
            case 'contacts':
            case 'privacy':
            case 'help':
            default:
                return <div className="p-4 text-center text-text-secondary">This section is not yet implemented.</div>;
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-primary">
            <header className="p-4 flex items-center justify-between border-b border-slate-700 h-[77px] flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowDetails(false)} className="p-2 -ml-2 text-text-secondary hover:text-white md:hidden">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <h2 className="text-xl font-bold">{menuItems.find(i => i.key === activeView)?.label}</h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-text-secondary hover:text-white">
                    <XIcon className="w-6 h-6"/>
                </button>
            </header>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Pane: Menu */}
                <div className={`w-full md:w-80 flex-shrink-0 bg-primary flex flex-col border-r border-slate-700 ${showDetails ? 'hidden md:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-2">
                        <ul className="space-y-1">
                            {menuItems.map(item => (
                                <li key={item.key}>
                                    <button
                                        onClick={() => {
                                            setActiveView(item.key as SettingsView);
                                            setShowDetails(true);
                                        }}
                                        className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${activeView === item.key ? 'bg-slate-700' : 'hover:bg-slate-600'}`}
                                    >
                                        <item.icon className="w-6 h-6 text-text-secondary mr-4" />
                                        <div>
                                            <span className="font-semibold">{item.label}</span>
                                            {item.sub && <p className="text-xs text-text-secondary">{item.sub}</p>}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Right Pane: Details */}
                <div className={`flex-1 flex flex-col bg-secondary ${showDetails ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex-1 overflow-y-auto">
                        {renderCurrentView()}
                    </div>
                </div>
            </div>
            {showVisibilityModal && <ProfileVisibilityModal onClose={() => setShowVisibilityModal(false)} />}
        </div>
    );
};
