

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import ChatWindow from './ChatWindow';
import { MeetingScreen } from './MeetingScreen';
import { CalendarView } from './CalendarView';
import { ProfilePictureModal } from './ProfilePictureModal';
import { SideBarSettings } from './SideBarSettings';
import { AddContactFlowModal } from './AddContactFlowModal';
import { CreateGroupModal } from './CreateGroupModal';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { JoinMeetingModal } from './JoinMeetingModal';
import ContactDetailsModal from './ContactDetailsModal';
import GroupDetailsModal from './GroupDetailsModal';
import { PeoplePickerModal } from './PeoplePickerModal';
import { PreJoinScreen } from './PreJoinScreen';
import { PushNotification } from './PushNotification';
import { MeetingCreatedModal } from './MeetingCreatedModal';
import { TemplatesView } from './TemplatesView';
import { MeetingStartingNotification } from './MeetingStartingNotification';
import { VerticalNavBar } from './VerticalNavBar';
import { ActivityView } from './ActivityView';
import { TimesheetView } from './TimesheetView';
import { NewChatModal } from './NewChatModal';
import { useAppContext } from '../context/AppContext';
import { User, LocationInfo, Meeting, PreJoinSettings, CallState, RecurrenceFrequency, Chat, ActiveFeature } from '../types';
import { CameraIcon, ChevronLeftIcon, UserCircleIcon, VideoCameraIcon, XIcon, LocationMarkerIcon, ShareIcon, CheckIcon, UserPlusIcon, PhoneIcon } from './icons';
import { callSound, notificationSound } from '../data/audio';

interface PendingCallInfo {
    meetingId: string;
    chatId: string;
    callType: 'audio' | 'video';
    meetingTitle?: string;
}

// Custom hook to get the previous value of a state or prop
const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CameraView: React.FC<{
    onClose: () => void;
    onCapture: (dataUrl: string) => void;
}> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    React.useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera for sharing:", err);
                onClose();
            }
        };
        startCamera();
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, [onClose]);

    const handleCapture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
    };

    return (
        <div className="absolute inset-0 bg-black z-[70] flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white">
                <XIcon className="w-8 h-8" />
            </button>
            <button onClick={handleCapture} className="absolute bottom-8 p-4 bg-white rounded-full">
                <CameraIcon className="w-10 h-10 text-black" />
            </button>
        </div>
    );
};

const ContactPicker: React.FC<{
    onClose: () => void;
    onSelect: (contact: User) => void;
}> = ({ onClose, onSelect }) => {
    const { contacts } = useAppContext();
    return (
        <div className="absolute inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b border-slate-600">Share a contact</h3>
                <ul className="max-h-80 overflow-y-auto">
                    {contacts.map(contact => (
                        <li key={contact.id} onClick={() => onSelect(contact)} className="flex items-center p-3 space-x-3 cursor-pointer hover:bg-slate-700">
                            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full" />
                            <p className="font-semibold">{contact.name}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const LocationPicker: React.FC<{
    onClose: () => void;
    onSelect: (location: LocationInfo) => void;
}> = ({ onClose, onSelect }) => {
    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        
        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            let address = `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                if (data && data.display_name) {
                    address = data.display_name;
                } else {
                    console.warn("Reverse geocoding failed:", data);
                }
            } catch (fetchError) {
                console.error("Error fetching address:", fetchError);
            }

            onSelect({
                latitude,
                longitude,
                address
            });
        }, (error) => {
            let errorMessage = "Could not get your location. Please try again.";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Location access denied. To share your location, please enable it in your browser settings.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMessage = "The request to get user location timed out.";
                    break;
            }
            alert(errorMessage);
        }, options);
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <LocationMarkerIcon className="w-12 h-12 text-highlight mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Share Location</h3>
                <p className="text-text-secondary mb-6">Send your current location to this chat.</p>
                <button onClick={handleCurrentLocation} className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-highlight">
                    Share My Current Location
                </button>
            </div>
        </div>
    );
};

interface PickerProps {
    title: string;
    actionLabel: string;
    icon: React.FC<{className?: string}>;
    chats: Chat[];
    allowMultiSelect: boolean;
    onClose: () => void;
    onAction: (selectedChatIds: string[]) => void;
}

const ChatPicker: React.FC<PickerProps> = ({ title, actionLabel, icon: Icon, chats, allowMultiSelect, onClose, onAction }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { getContactById, user } = useAppContext();

    const handleSelect = (chatId: string) => {
        if (allowMultiSelect) {
            setSelectedIds(prev =>
                prev.includes(chatId)
                    ? prev.filter(id => id !== chatId)
                    : [...prev, chatId]
            );
        } else {
            onAction([chatId]);
        }
    };
    
    const handleConfirm = () => {
        if(selectedIds.length > 0) {
            onAction(selectedIds);
        }
    };

    const sortedChats = useMemo(() => {
        return [...chats].sort((a, b) => {
            if (a.type === 'private' && b.type === 'group') return -1;
            if (a.type === 'group' && b.type === 'private') return 1;
            return 0;
        });
    }, [chats]);

    return (
        <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-600 text-center flex-shrink-0">
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>

                <ul className="flex-1 overflow-y-auto p-2" style={{maxHeight: "24rem"}}>
                    {sortedChats.map(chat => {
                        const partner = chat.type === 'private' ? getContactById(chat.participants.find(p => p !== user.id) || '') : null;
                        const name = chat.type === 'private' ? partner?.name : chat.name;
                        const avatar = chat.type === 'private' ? partner?.avatar : chat.avatar;
                        if (!name) return null;
                        
                        const isSelected = selectedIds.includes(chat.id);

                        return (
                            <li key={chat.id} onClick={() => handleSelect(chat.id)} className="flex items-center p-2 space-x-3 cursor-pointer rounded-lg hover:bg-secondary">
                                {allowMultiSelect && (
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-slate-500 bg-secondary'}`}>
                                      {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                )}
                                <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
                                <p className="font-semibold flex-1">{name}</p>
                            </li>
                        );
                    })}
                </ul>
                
                {allowMultiSelect && (
                    <div className="p-4 border-t border-slate-600 flex-shrink-0">
                        <button onClick={handleConfirm} disabled={selectedIds.length === 0} className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight disabled:bg-slate-500 disabled:cursor-not-allowed">
                             <Icon className="w-5 h-5 mr-2" />
                            {actionLabel} {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


const Layout: React.FC = () => {
    const {
        activeChatId,
        sendMessage,
        getContactById,
        user,
        chats,
        contacts,
        forwardMessages,
        shareContact,
        addParticipant,
        createInstantMeeting,
        getMeetingById,
        setActiveChatId,
        findOrCreateContactByEmail,
        getOrCreatePrivateChat,
        activeFeature,
        setActiveFeature,
    } = useAppContext();

    const [calendarDate, setCalendarDate] = useState(new Date());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filePickerChatId, setFilePickerChatId] = useState<string | null>(null);
    const callAudioRef = useRef<HTMLAudioElement>(null);
    const notificationAudioRef = useRef<HTMLAudioElement>(null);


    // Modal States
    const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
    const [showAddContactFlowModal, setShowAddContactFlowModal] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [scheduleMeetingProps, setScheduleMeetingProps] = useState<{ meeting?: Meeting, date?: Date } | null>(null);
    const [showJoinMeetingModal, setShowJoinMeetingModal] = useState(false);
    const [contactDetailsUser, setContactDetailsUser] = useState<User | null>(null);
    const [groupDetailsChat, setGroupDetailsChat] = useState<Chat | null>(null);
    const [peoplePickerProps, setPeoplePickerProps] = useState<{chatId: string, currentParticipants: User[], onAdd: (emails: string[])=>void} | null>(null);
    const [preJoinLobbyState, setPreJoinLobbyState] = useState<{ meeting: Meeting; participants: User[]; callType: 'audio' | 'video' } | null>(null);
    const [activeCallState, setActiveCallState] = useState<CallState | null>(null);
    const [meetingCreated, setMeetingCreated] = useState<Meeting | null>(null);
    const [showCameraView, setShowCameraView] = useState(false);
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [forwardPickerProps, setForwardPickerProps] = useState<{ sourceChatId: string, messageIds: string[] } | null>(null);
    const [shareContactPickerUser, setShareContactPickerUser] = useState<User | null>(null);
    const [meetingsToNotify, setMeetingsToNotify] = useState<string[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
    const notifiedMeetingIdsRef = useRef(new Set<string>());

    const unreadCount = useMemo(() => {
        return chats.reduce((count, chat) => {
            const lastMessage = chat.messages[chat.messages.length - 1];
            if (!chat.isMuted && !chat.isHidden && lastMessage && !lastMessage.read && lastMessage.senderId !== user.id) {
                return count + 1;
            }
            return count;
        }, 0);
    }, [chats, user.id]);

    const prevUnreadCount = usePrevious(unreadCount);

    useEffect(() => {
        if (user.settings?.playSound && prevUnreadCount !== undefined && unreadCount > prevUnreadCount && notificationAudioRef.current) {
            notificationAudioRef.current.play().catch(e => {
                if (e.name !== 'AbortError') {
                    console.error("Audio play error", e);
                }
            });
        }
    }, [unreadCount, prevUnreadCount, user.settings?.playSound]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const upcomingMeetings = chats
                .flatMap(c => c.meetings || [])
                .filter(m => {
                    const startTime = new Date(m.startTime);
                    const timeDiff = startTime.getTime() - now.getTime();
                    // Notify if meeting is within the next 5 minutes, but not if it's already started for too long
                    return timeDiff > -10000 && timeDiff <= 5 * 60 * 1000;
                });
            
            const meetingsToTrigger = upcomingMeetings.filter(m => !notifiedMeetingIdsRef.current.has(m.id) && !dismissedNotifications.includes(m.id));

            if (meetingsToTrigger.length > 0) {
                if (user.settings?.playSound && notificationAudioRef.current) {
                    notificationAudioRef.current.currentTime = 0;
                    const playPromise = notificationAudioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            if (error.name !== 'AbortError') {
                                console.error("Audio play error", error);
                            }
                        });
                    }
                }
                meetingsToTrigger.forEach(m => notifiedMeetingIdsRef.current.add(m.id));
                setMeetingsToNotify(prev => [...new Set([...prev, ...meetingsToTrigger.map(m => m.id)])]);
            }

        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [chats, user.settings?.playSound, dismissedNotifications]);
    
    // This effect ensures that if the chat data changes (e.g., media is deleted), the modal gets the fresh data.
    useEffect(() => {
        if (groupDetailsChat) {
            const updatedChat = chats.find(c => c.id === groupDetailsChat.id);
            if (updatedChat) {
                setGroupDetailsChat(updatedChat);
            } else {
                setGroupDetailsChat(null); // Chat was deleted/left, so close modal
            }
        }
    }, [chats, groupDetailsChat?.id]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!filePickerChatId) return;

        const files = event.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                sendMessage({
                    chatId: filePickerChatId,
                    message: {
                        senderId: user.id,
                        content: `Shared a file: ${file.name}`,
                        type: 'file',
                        fileInfo: {
                            name: file.name,
                            size: formatFileSize(file.size),
                            url: url,
                            type: file.type,
                        }
                    }
                });
            };
            reader.readAsDataURL(file);
        }
        
        // Reset for next use
        event.target.value = '';
        setFilePickerChatId(null);
    };

    const handleOpenFilePicker = (chatId: string, accept?: string) => {
        if (fileInputRef.current) {
            setFilePickerChatId(chatId);
            if (accept) {
                fileInputRef.current.accept = accept;
            } else {
                fileInputRef.current.removeAttribute('accept');
            }
            fileInputRef.current.click();
        }
    };
    
    const handleOpenChatWindowCamera = (chatId: string) => {
        // Here you might want to store which chat requested the camera
        setShowCameraView(true);
    };

    const handleCapture = (dataUrl: string) => {
        if (!activeChatId) return;
        sendMessage({
            chatId: activeChatId,
            message: {
                senderId: user.id,
                content: dataUrl,
                type: 'image',
            }
        });
        setShowCameraView(false);
    };

    const handleOpenContactPicker = () => setShowContactPicker(true);
    const handleSelectContact = (contact: User) => {
        if (!activeChatId) return;
        sendMessage({
            chatId: activeChatId,
            message: {
                senderId: user.id,
                content: `Contact: ${contact.name}`,
                type: 'contact',
                contactInfo: { id: contact.id, name: contact.name, avatar: contact.avatar }
            }
        });
        setShowContactPicker(false);
    };

    const handleOpenLocationPicker = () => setShowLocationPicker(true);
    const handleSelectLocation = (location: LocationInfo) => {
         if (!activeChatId) return;
         sendMessage({
            chatId: activeChatId,
            message: {
                senderId: user.id,
                content: location.address || `Location`,
                type: 'location',
                locationInfo: location
            }
         });
         setShowLocationPicker(false);
    };

    const handleForward = (targetChatIds: string[]) => {
        if (forwardPickerProps) {
            forwardMessages({
                sourceChatId: forwardPickerProps.sourceChatId,
                targetChatIds,
                messageIds: forwardPickerProps.messageIds
            });
        }
        setForwardPickerProps(null);
    };
    
    const handleShareContact = (targetChatIds: string[]) => {
        if (shareContactPickerUser) {
            shareContact({ chatIdsToShareIn: targetChatIds, contactToShare: shareContactPickerUser });
        }
        setShareContactPickerUser(null);
    };

    const handleStartCall = (callType: 'audio' | 'video', chatId?: string) => {
        if (user.settings?.playSound && callAudioRef.current) {
            callAudioRef.current.play().catch(e => {
                if (e.name !== 'AbortError') {
                    console.error("Audio play error", e);
                }
            });
        }

        const targetChatId = chatId || activeChatId;
        if (!targetChatId) return;
        const chat = chats.find(c => c.id === targetChatId);
        if (!chat) return;

        const meetingTitle = chat.type === 'private' 
            ? `Call with ${getContactById(chat.participants.find(p => p !== user.id)!)?.name}` 
            : `Call in ${chat.name}`;

        const meeting: Meeting = {
            id: `meeting-instant-${Date.now()}`,
            title: meetingTitle,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            organizerId: user.id,
            participants: chat.participants.map(pId => {
                const participantUser = getContactById(pId);
                return {
                    email: participantUser?.email || '',
                    name: participantUser?.name || '',
                    status: 'accepted'
                }
            }),
            chatId: targetChatId,
            recurrence: RecurrenceFrequency.None
        };

        const callParticipants = chat.participants.map(getContactById).filter((u): u is User => !!u);

        setPreJoinLobbyState({
            meeting,
            participants: callParticipants,
            callType,
        });
    };
    
    const handleJoinMeeting = (meeting: Meeting) => {
        const callParticipants = meeting.participants.map(p => findOrCreateContactByEmail(p.email));
        
        setPreJoinLobbyState({
            meeting,
            participants: callParticipants,
            callType: 'video', // Joining a scheduled meeting implies video
        });
        setScheduleMeetingProps(null);
    };

    const handleMeetNow = () => {
        const meeting = createInstantMeeting();
        handleJoinMeeting(meeting);
    };
    
    const handleEndCall = (durationInSeconds: number) => {
        if (activeCallState) {
            sendMessage({
                chatId: activeCallState.meeting.chatId,
                message: {
                    senderId: user.id,
                    content: 'Meeting ended',
                    type: 'call',
                    callInfo: {
                        type: 'outgoing',
                        duration: durationInSeconds,
                        callMethod: activeCallState.initialSettings.isCameraOn ? 'video' : 'audio',
                    }
                }
            });
        }
        setActiveCallState(null);
    };

    const handleOpenScheduleMeeting = (meeting?: Meeting, date?: Date) => {
        setScheduleMeetingProps({ meeting, date });
    };

    const handleScheduleMeetingClose = (newMeeting: Meeting | null, isNew: boolean) => {
        setScheduleMeetingProps(null);
        if (newMeeting && isNew) {
            setMeetingCreated(newMeeting);
        }
    };
    
    const handleOpenAddPeoplePicker = (chatId: string, currentParticipants: User[]) => {
        setPeoplePickerProps({ 
            chatId, 
            currentParticipants, 
            onAdd: (emails) => {
                const userIds = emails.map(email => findOrCreateContactByEmail(email).id);
                addParticipant({ chatId, userIds });
                setPeoplePickerProps(null);
            }
        });
    };
    
    const handleOpenChatFromModal = (chatId: string) => {
        setContactDetailsUser(null);
        setGroupDetailsChat(null);
        setScheduleMeetingProps(null);
        setActiveChatId(chatId);
        setActiveFeature('chat');
    };
    
    const activeChat = chats.find(c => c.id === activeChatId);
    const showContentPanel = ['chat', 'calls', 'contacts', 'calendar', 'timesheet'].includes(activeFeature);
    
    const sidebarContentMap: { [key in ActiveFeature]?: 'chats' | 'calls' | 'contacts' | 'calendar' } = {
        chat: 'chats',
        calls: 'calls',
        contacts: 'contacts',
        calendar: 'calendar',
    };
    const activeSidebarContent = sidebarContentMap[activeFeature];
    
    const renderMainView = () => {
      switch (activeFeature) {
        case 'activity': return <ActivityView />;
        case 'timesheet': return <TimesheetView />;
        case 'calendar': return <CalendarView date={calendarDate} setDate={setCalendarDate} onScheduleMeeting={handleOpenScheduleMeeting} onJoinMeeting={handleJoinMeeting} onOpenChat={handleOpenChatFromModal} />;
        case 'settings': return <SideBarSettings onClose={() => setActiveFeature('chat')} onOpenProfilePictureModal={() => setShowProfilePictureModal(true)} />;
        case 'templates': return <TemplatesView onClose={() => setActiveFeature('chat')} />;
        case 'chat':
        case 'calls':
        case 'contacts':
        default:
          return activeChat ? (
            <ChatWindow
              key={activeChatId}
              onStartCall={(callType) => handleStartCall(callType)}
              onOpenFilePicker={(accept) => handleOpenFilePicker(activeChatId!, accept)}
              onOpenCamera={() => handleOpenChatWindowCamera(activeChatId!)}
              onOpenContactPicker={handleOpenContactPicker}
              onOpenLocationPicker={handleOpenLocationPicker}
              onOpenForwardPicker={(sourceChatId, messageIds) => setForwardPickerProps({ sourceChatId, messageIds })}
              onOpenAddPeoplePicker={() => {
                  if (activeChat?.type === 'group') {
                      const currentParticipants = activeChat.participants.map(getContactById).filter((u): u is User => !!u);
                      handleOpenAddPeoplePicker(activeChat.id, currentParticipants);
                  }
              }}
              onOpenContactDetails={(user) => setContactDetailsUser(user)}
              onOpenGroupDetails={(chat) => setGroupDetailsChat(chat)}
              onBack={() => setActiveChatId(null)}
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-secondary">
                <div className="text-center">
                    <UserCircleIcon className="w-24 h-24 text-slate-600 mx-auto" />
                    <h2 className="mt-2 text-2xl font-bold">Welcome to Let's Connect</h2>
                    <p className="mt-1 text-text-secondary">Select a chat to start messaging.</p>
                </div>
            </div>
          );
      }
    };

  return (
    <div className="flex h-screen bg-secondary">
        <audio ref={callAudioRef} src={callSound} preload="auto" />
        <audio ref={notificationAudioRef} src={notificationSound} preload="auto" />
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
        />
        <VerticalNavBar activeFeature={activeFeature} setActiveFeature={setActiveFeature} unreadCount={unreadCount}/>
        <PushNotification />
        {showContentPanel && activeSidebarContent && (
            <div className={`transition-all duration-300 ${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-shrink-0 bg-primary border-r border-slate-700 flex-col`}>
                <Sidebar
                    activeContent={activeSidebarContent}
                    onInitiateShareContact={setShareContactPickerUser}
                    onOpenProfilePictureModal={() => setShowProfilePictureModal(true)}
                    onOpenAddContact={() => setShowAddContactFlowModal(true)}
                    onOpenNewChat={() => setShowNewChatModal(true)}
                    onOpenAddTeamChat={() => setShowCreateGroupModal(true)}
                    onStartCall={(userId, chatId, callType) => handleStartCall(callType, chatId)}
                    onOpenScheduleMeeting={handleOpenScheduleMeeting}
                    onJoinMeeting={handleJoinMeeting}
                    onMeetingClick={(meeting) => handleOpenScheduleMeeting(meeting)}
                    onMeetNow={handleMeetNow}
                    onJoinWithId={() => setShowJoinMeetingModal(true)}
                 />
            </div>
        )}
      
      <div className={`flex-1 flex flex-col min-w-0 ${activeChatId || !showContentPanel ? 'flex' : 'hidden md:flex'}`}>
        {renderMainView()}
      </div>

      {/* --- Modals and Full-Screen Views --- */}
      {showProfilePictureModal && <ProfilePictureModal onClose={() => setShowProfilePictureModal(false)} />}
      {showAddContactFlowModal && <AddContactFlowModal onClose={() => setShowAddContactFlowModal(false)} />}
      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} />}
      {showCreateGroupModal && <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />}
      {showCameraView && <CameraView onClose={() => setShowCameraView(false)} onCapture={handleCapture} />}
      {showContactPicker && <ContactPicker onClose={() => setShowContactPicker(false)} onSelect={handleSelectContact} />}
      {showLocationPicker && <LocationPicker onClose={() => setShowLocationPicker(false)} onSelect={handleSelectLocation} />}
      {forwardPickerProps && <ChatPicker allowMultiSelect title="Forward to..." actionLabel="Forward" icon={ShareIcon} chats={chats} onClose={() => setForwardPickerProps(null)} onAction={handleForward} />}
      {shareContactPickerUser && <ChatPicker allowMultiSelect title={`Share ${shareContactPickerUser.name}`} actionLabel="Share" icon={ShareIcon} chats={chats} onClose={() => setShareContactPickerUser(null)} onAction={handleShareContact} />}
      {scheduleMeetingProps && <ScheduleMeetingModal {...scheduleMeetingProps} onClose={handleScheduleMeetingClose} onJoin={handleJoinMeeting} onOpenChat={handleOpenChatFromModal} />}
      {showJoinMeetingModal && <JoinMeetingModal onClose={() => setShowJoinMeetingModal(false)} onJoin={(id) => { const result = getMeetingById(id); if (result) { handleJoinMeeting(result.meeting); setShowJoinMeetingModal(false); } else { alert('Meeting not found'); } }} />}
      {peoplePickerProps && <PeoplePickerModal isOpen={!!peoplePickerProps} onClose={() => setPeoplePickerProps(null)} onAdd={peoplePickerProps.onAdd} excludedEmails={peoplePickerProps.currentParticipants.map(p => p.email)} />}
      {contactDetailsUser && <ContactDetailsModal user={contactDetailsUser} onClose={() => setContactDetailsUser(null)} onStartCall={(userId, chatId, callType) => handleStartCall(callType, chatId)} onInitiateShareContact={setShareContactPickerUser} onAddParticipant={(chatId, participants) => handleOpenAddPeoplePicker(chatId, participants)} onOpenMeetingDetails={handleOpenScheduleMeeting} onJoinMeeting={handleJoinMeeting} onOpenChat={handleOpenChatFromModal} onOpenForwardPicker={(ids) => setForwardPickerProps({ sourceChatId: getOrCreatePrivateChat(contactDetailsUser.id), messageIds: ids })} />}
      {groupDetailsChat && <GroupDetailsModal chat={groupDetailsChat} onClose={() => setGroupDetailsChat(null)} onStartCall={(callType) => handleStartCall(callType, groupDetailsChat.id)} onOpenAddPeoplePicker={() => handleOpenAddPeoplePicker(groupDetailsChat.id, groupDetailsChat.participants.map(getContactById).filter((u): u is User => !!u))} onOpenForwardPicker={(ids) => setForwardPickerProps({ sourceChatId: groupDetailsChat.id, messageIds: ids })} onOpenMeetingDetails={handleOpenScheduleMeeting} onOpenChat={handleOpenChatFromModal} />}
      {meetingCreated && <MeetingCreatedModal meeting={meetingCreated} onClose={() => setMeetingCreated(null)} />}
      {meetingsToNotify.map(id => {
          if (dismissedNotifications.includes(id) || preJoinLobbyState || activeCallState) return null;
          const result = getMeetingById(id);
          if (!result) return null;
          return <MeetingStartingNotification key={id} meeting={result.meeting} onJoin={handleJoinMeeting} onDismiss={(id) => setDismissedNotifications(p => [...p, id])} />;
      })}

      {/* Call/Meeting Overlays */}
      {activeCallState && (
          <MeetingScreen 
              key={activeCallState.sessionId}
              callState={activeCallState}
              onEndCall={handleEndCall}
              onOpenAddPeoplePicker={handleOpenAddPeoplePicker}
              onOpenFilePicker={handleOpenFilePicker}
              onOpenCameraPicker={handleOpenChatWindowCamera}
              onOpenForwardPicker={(sourceChatId, messageIds) => setForwardPickerProps({ sourceChatId, messageIds })}
          />
      )}
      {preJoinLobbyState && (
            <PreJoinScreen
              onClose={() => setPreJoinLobbyState(null)}
              onJoin={(settings: PreJoinSettings) => {
                  sendMessage({
                      chatId: preJoinLobbyState.meeting.chatId,
                      message: {
                        senderId: 'system',
                        content: 'Meeting started',
                        type: 'text'
                      }
                  });
                  setActiveCallState({
                      meeting: preJoinLobbyState.meeting,
                      participants: preJoinLobbyState.participants,
                      initialSettings: settings,
                      sessionId: Date.now(),
                  });
                  setPreJoinLobbyState(null);
              }}
              meetingTitle={preJoinLobbyState.meeting.title}
              initialAudioOn={true}
              initialVideoOn={preJoinLobbyState.callType === 'video'}
          />
      )}
    </div>
  );
};

export default Layout;