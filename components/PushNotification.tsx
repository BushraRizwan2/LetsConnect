import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Chat, Message, User } from '../types';

// Custom hook to get the previous value of a state or prop
const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

export const PushNotification: React.FC = () => {
    const { chats, user, getContactById, activeChatId, setActiveChatId } = useAppContext();
    const [permission, setPermission] = useState(Notification.permission);
    const prevChats = usePrevious(chats);

    // Request permission on component mount
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(setPermission);
        }
    }, []);

    // Listen for chat changes and trigger notifications
    useEffect(() => {
        if (permission !== 'granted' || !prevChats) {
            return;
        }

        chats.forEach(currentChat => {
            const prevChat = prevChats.find(c => c.id === currentChat.id);

            // Don't notify for the currently active, muted, or hidden chats
            if (currentChat.id === activeChatId || currentChat.isMuted || currentChat.isHidden) {
                return;
            }

            // Check for new messages
            if (prevChat && currentChat.messages.length > prevChat.messages.length) {
                const newMessage = currentChat.messages[currentChat.messages.length - 1];
                if (newMessage.senderId !== user.id) {
                    notifyNewMessage(currentChat, newMessage);
                }
            }

            // Check for new reactions on user's messages
            if (prevChat) {
                currentChat.messages.forEach((currentMessage) => {
                    if (currentMessage.senderId !== user.id) return; // Only check reactions on own messages
                    
                    const prevMessage = prevChat.messages.find(m => m.id === currentMessage.id);
                    if (!prevMessage) return; // This is a new message, handled above

                    const currentReactions = currentMessage.reactions || {};
                    const prevReactions = prevMessage.reactions || {};

                    // Find a new reactor
                    for (const emoji in currentReactions) {
                        const currentReactors = currentReactions[emoji] || [];
                        const prevReactors = prevReactions[emoji] || [];
                        const newReactorId = currentReactors.find(reactorId => !prevReactors.includes(reactorId));

                        if (newReactorId && newReactorId !== user.id) {
                            const reactor = getContactById(newReactorId);
                            if (reactor) {
                                notifyNewReaction(currentChat, currentMessage, reactor, emoji);
                            }
                        }
                    }
                });
            }
        });

    }, [chats, prevChats, permission, activeChatId, user.id, getContactById]);

    const showNotification = (title: string, options: NotificationOptions, chatId: string) => {
        const notification = new Notification(title, { ...options, tag: chatId });

        notification.onclick = () => {
            setActiveChatId(chatId);
            window.focus();
            notification.close();
        };
    };

    const notifyNewMessage = (chat: Chat, message: Message) => {
        const sender = getContactById(message.senderId);
        if (!sender) return;

        let title = '';
        let icon = '';
        let body = '';

        if (chat.type === 'private') {
            title = sender.name;
            icon = sender.avatar;
        } else {
            title = chat.name || 'Group Chat';
            icon = chat.avatar || sender.avatar;
        }
        
        const senderNamePrefix = chat.type === 'group' ? `${sender.name.split(' ')[0]}: ` : '';

        switch(message.type) {
            case 'text':
                body = `${senderNamePrefix}${message.content}`;
                break;
            case 'image':
                body = `${senderNamePrefix}Sent an image.`;
                break;
            case 'file':
                body = `${senderNamePrefix}Sent a file: ${message.fileInfo?.name}`;
                break;
            case 'contact':
                body = `${senderNamePrefix}Shared contact: ${message.contactInfo?.name}`;
                break;
            case 'location':
                body = `${senderNamePrefix}Shared a location.`;
                break;
            case 'audio':
                body = `${senderNamePrefix}Sent a voice note.`;
                break;
            default:
                body = `${senderNamePrefix}Sent a message.`;
        }

        showNotification(title, { body, icon }, chat.id);
    };
    
    const notifyNewReaction = (chat: Chat, message: Message, reactor: User, emoji: string) => {
        let title = '';
        let icon = '';
        
        if (chat.type === 'private') {
            title = reactor.name;
            icon = reactor.avatar;
        } else {
            title = chat.name || 'Group Chat';
            icon = chat.avatar || reactor.avatar;
        }
        
        let messagePreview = message.content;
        if (message.type !== 'text') {
            messagePreview = `your ${message.type}`;
        } else if (messagePreview.length > 25) {
            messagePreview = `"${messagePreview.substring(0, 25)}..."`;
        } else {
             messagePreview = `"${messagePreview}"`;
        }

        const body = chat.type === 'group'
            ? `${reactor.name.split(' ')[0]} reacted ${emoji} to ${messagePreview}`
            : `Reacted ${emoji} to ${messagePreview}`;

        showNotification(title, { body, icon }, chat.id);
    };

    return null; // This component is non-visual
};