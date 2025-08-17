import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Message } from '../types';
import { EmojiGifStickerPicker } from './EmojiGifStickerPicker';
import { getSmartReplies } from '../services/geminiService';
import {
    PaperclipIcon, FaceSmileIcon, SendIcon, PhotoIcon, DocumentTextIcon, CameraIcon, UserCircleIcon, LocationMarkerIcon, XIcon, SparklesIcon
} from './icons';

interface MessageInputBarProps {
    chatId: string;
    onOpenFilePicker: (accept?: string) => void;
    onOpenCamera: () => void;
    onOpenContactPicker: () => void;
    onOpenLocationPicker: () => void;
    replyTo: Message | null;
    onCancelReply: () => void;
}

const ReplyPreview: React.FC<{ message: Message; onCancel: () => void; }> = ({ message, onCancel }) => {
    const { getContactById } = useAppContext();
    const sender = getContactById(message.senderId);

    const getPreview = () => {
        switch (message.type) {
            case 'image': return 'An image';
            case 'file': return message.fileInfo?.name || 'A file';
            case 'contact': return `Contact: ${message.contactInfo?.name}`;
            case 'location': return 'A location';
            case 'audio': return 'A voice message';
            default: return message.content;
        }
    };
    
    return (
        <div className="relative p-2 rounded-t-xl bg-black/20">
            <button onClick={onCancel} className="absolute top-1 right-1 p-1 text-text-secondary hover:text-white rounded-full">
                <XIcon className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-highlight">Replying to {sender?.name}</p>
            <p className="text-sm text-text-secondary truncate">{getPreview()}</p>
        </div>
    )
};

const SmartReplies: React.FC<{ onSelect: (reply: string) => void, messages: Message[] }> = React.memo(({ onSelect, messages }) => {
    const { user, contacts } = useAppContext();
    const [replies, setReplies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getSmartReplies(messages, contacts, user).then(res => {
            setReplies(res);
            setIsLoading(false);
        });
    }, [messages, contacts, user]);

    if (isLoading) return <div className="text-sm text-text-secondary p-2">Thinking...</div>;
    if (replies.length === 0) return null;

    return (
        <div className="flex items-center space-x-2 py-2">
            <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0" />
            {replies.map(reply => (
                <button key={reply} onClick={() => onSelect(reply)} className="px-3 py-1.5 bg-primary text-text-primary text-sm font-semibold rounded-full hover:bg-slate-700 transition-colors">
                    {reply}
                </button>
            ))}
        </div>
    );
});

const MessageInputBar: React.FC<MessageInputBarProps> = ({
    chatId,
    onOpenFilePicker,
    onOpenCamera,
    onOpenContactPicker,
    onOpenLocationPicker,
    replyTo,
    onCancelReply
}) => {
    const { user, sendMessage, chats, setCurrentUserTyping } = useAppContext();
    const chat = chats.find(c => c.id === chatId);
    const [text, setText] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
        setCurrentUserTyping({ chatId, isTyping: !!e.target.value });
    };

    const handleSend = useCallback(() => {
        if (!text.trim()) return;
        sendMessage({
            chatId, 
            message: {
                senderId: user.id,
                content: text,
                type: 'text',
                replyTo: replyTo?.id
            }
        });
        setText('');
        onCancelReply();
        if(textareaRef.current) textareaRef.current.style.height = 'auto';
    }, [text, chatId, replyTo, user.id, sendMessage, onCancelReply]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && user.settings?.sendMessageOnEnter) {
            e.preventDefault();
            handleSend();
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
                setIsAttachmentMenuOpen(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setIsEmojiPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const AttachmentMenuItem: React.FC<{ icon: React.FC<{ className?: string }>; label: string; onClick: () => void; }> = ({ icon: Icon, label, onClick }) => (
        <button onClick={() => { onClick(); setIsAttachmentMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-text-primary hover:bg-secondary">
            <Icon className="w-5 h-5 mr-3" />
            <span>{label}</span>
        </button>
    );

    const handleGifOrStickerSelect = (url: string) => {
        sendMessage({
            chatId,
            message: {
                senderId: user.id,
                content: url,
                type: 'image'
            }
        });
        setIsEmojiPickerOpen(false);
    };

    const showSmartReplies = user.settings?.showSuggestedReplies && chat && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].senderId !== user.id;

    return (
        <>
            {replyTo && <ReplyPreview message={replyTo} onCancel={onCancelReply} />}
            <div className="flex items-start space-x-2">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setCurrentUserTyping({ chatId, isTyping: false })}
                        placeholder="Type a message..."
                        className="w-full bg-primary rounded-xl p-3 pr-24 resize-none max-h-40 focus:outline-none focus:ring-2 focus:ring-highlight"
                        rows={1}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center">
                        <div ref={attachmentMenuRef}>
                            <button onClick={() => setIsAttachmentMenuOpen(p => !p)} className="p-1.5 text-text-secondary hover:text-white rounded-full">
                                <PaperclipIcon className="w-6 h-6"/>
                            </button>
                            {isAttachmentMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-56 bg-primary rounded-lg shadow-xl border border-slate-600 p-2 z-20">
                                    <AttachmentMenuItem icon={PhotoIcon} label="Photo & Video" onClick={() => onOpenFilePicker('image/*,video/*')} />
                                    <AttachmentMenuItem icon={DocumentTextIcon} label="File" onClick={() => onOpenFilePicker()} />
                                    <AttachmentMenuItem icon={CameraIcon} label="Camera" onClick={onOpenCamera} />
                                    <AttachmentMenuItem icon={UserCircleIcon} label="Contact" onClick={onOpenContactPicker} />
                                    <AttachmentMenuItem icon={LocationMarkerIcon} label="Location" onClick={onOpenLocationPicker} />
                                </div>
                            )}
                        </div>
                        <div ref={emojiPickerRef}>
                            <button onClick={() => setIsEmojiPickerOpen(p => !p)} className="p-1.5 text-text-secondary hover:text-white rounded-full">
                                <FaceSmileIcon className="w-6 h-6"/>
                            </button>
                            {isEmojiPickerOpen && (
                                <EmojiGifStickerPicker
                                    onEmojiSelect={(emoji) => { setText(prev => prev + emoji); textareaRef.current?.focus(); }}
                                    onGifSelect={handleGifOrStickerSelect}
                                    onStickerSelect={handleGifOrStickerSelect}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={handleSend} disabled={!text.trim()} className="p-2 bg-accent text-white rounded-full self-end hover:bg-highlight disabled:bg-slate-500 disabled:cursor-not-allowed">
                    <SendIcon className="w-6 h-6"/>
                </button>
            </div>
             {showSmartReplies && chat && (
                <SmartReplies messages={chat.messages} onSelect={(reply) => {setText(reply); textareaRef.current?.focus()}} />
            )}
        </>
    );
};

export default MessageInputBar;