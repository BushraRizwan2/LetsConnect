import React, { useState } from 'react';
import { FaceSmileIcon, GifIcon, TicketIcon } from './icons';

// Hardcoded data for demo purposes
const EMOJIS = [
    '😀', '😂', '😍', '🤔', '😢', '😡', '👍', '❤️', '🎉', '🙏', '🔥', '💯',
    '😊', '😎', '🥳', '🤯', '😱', '😴', '👋', '👏', '👀', '✨', '🚀', '🌟'
];

const GIFS = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmY4OW5tOG9yN2JtaWJmZWVreW9mMHh4dHFxdHBxNGFkemtjc3l1eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyE/giphy.gif', // Thumbs up
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG4yZ3M1dXU1dHdvdjJmd2M4dzY0cnZxa25ldnJtcjRjYnl4cmJ0ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IorAqDrjKiDcc/giphy.gif', // Cat typing
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTRnMWdha2xucTV6NWJ2cTZuNjN1cmI2ZW5mMHh4aG8xd3F6aGcybiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/t3sZxY5zS5B0z5zMIz/giphy.gif', // Michael Scott dance
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VjNW1ka3dxZ3JsdzU0eGt6Z3U4bXFkZnd3ODZsc21oZnpqaXN2cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0Gquis7ANdHYqJ3O/giphy.gif', // Homer Simpson disappears
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3JpdmFpNTc2M3JzcnJ0bzR0eHZnNnFwM2FoaXVmaXpxbjU0cnJyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6ZtpxSZbQRR7d0gU/giphy.gif', // Thank you
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2FwMjM5cjNncXBiaHZ4Z2QyZzZnbDdiYXg0aGg1c29uZHd4dnYxZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BPJmthQ3YRwD6/giphy.gif' // You're welcome
];

const STICKERS = [
    'https://cdn.dribbble.com/users/119990/screenshots/2347234/media/4e45d810a7b45155f46258c772c953c5.gif', // Robot sticker
    'https://cdn.dribbble.com/users/113499/screenshots/3134384/media/d93407c91d8481358319f6a5b7d60913.gif', // Cat sticker
    'https://cdn.dribbble.com/users/58957/screenshots/1169680/media/1a90c58f0003b87a810f3c5b52579b28.gif', // Fox sticker
    'https://cdn.dribbble.com/users/106173/screenshots/2099395/media/316f0a6e7c7a3307671a54558e0a1122.gif', // Pug sticker
    'https://cdn.dribbble.com/users/77598/screenshots/1635313/media/d5a8cde59374431e18c5e9334ac79934.gif', // Owl sticker
    'https://cdn.dribbble.com/users/329207/screenshots/2290483/media/59232ae9281a17951d5329c366a760c4.gif', // "Hi" sticker
];

interface EmojiGifStickerPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onGifSelect: (url: string) => void;
    onStickerSelect: (url: string) => void;
}

type PickerTab = 'emoji' | 'gif' | 'sticker';

const TabButton: React.FC<{
    icon: React.FC<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-lg ${isActive ? 'bg-highlight' : 'hover:bg-slate-600'}`}
    >
        <Icon className="w-6 h-6 text-text-primary" />
    </button>
);


export const EmojiGifStickerPicker: React.FC<EmojiGifStickerPickerProps> = ({ onEmojiSelect, onGifSelect, onStickerSelect }) => {
    const [activeTab, setActiveTab] = useState<PickerTab>('emoji');

    const renderContent = () => {
        switch (activeTab) {
            case 'emoji':
                return (
                    <div className="grid grid-cols-8 gap-1 p-2">
                        {EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => onEmojiSelect(emoji)} className="text-3xl p-1.5 rounded-lg hover:bg-slate-600 transition-colors">
                                {emoji}
                            </button>
                        ))}
                    </div>
                );
            case 'gif':
                return (
                    <div className="grid grid-cols-2 gap-2 p-2">
                        {GIFS.map(gif => (
                             <button key={gif} onClick={() => onGifSelect(gif)} className="aspect-square bg-slate-700 rounded-lg overflow-hidden hover:ring-2 ring-highlight">
                                <img src={gif} alt="GIF" className="w-full h-full object-cover" />
                             </button>
                        ))}
                    </div>
                );
            case 'sticker':
                return (
                     <div className="grid grid-cols-3 gap-2 p-2">
                        {STICKERS.map(sticker => (
                             <button key={sticker} onClick={() => onStickerSelect(sticker)} className="aspect-square bg-transparent rounded-lg overflow-hidden flex items-center justify-center hover:bg-slate-700 p-2">
                                <img src={sticker} alt="Sticker" className="w-full h-full object-contain" />
                             </button>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute bottom-full mb-2 w-80 bg-primary rounded-xl shadow-2xl border border-slate-600 flex flex-col z-30">
            <div className="h-[280px] overflow-y-auto">
                {renderContent()}
            </div>
            <div className="flex justify-around items-center p-1 bg-secondary rounded-b-xl border-t border-slate-600">
                <TabButton icon={FaceSmileIcon} isActive={activeTab === 'emoji'} onClick={() => setActiveTab('emoji')} />
                <TabButton icon={GifIcon} isActive={activeTab === 'gif'} onClick={() => setActiveTab('gif')} />
                <TabButton icon={TicketIcon} isActive={activeTab === 'sticker'} onClick={() => setActiveTab('sticker')} />
            </div>
        </div>
    );
};