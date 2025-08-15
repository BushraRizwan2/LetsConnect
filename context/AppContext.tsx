import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { User, Chat, Message, UserStatus, CallInfo, UserSettings, Meeting, MeetingParticipant, RecurrenceFrequency, Timesheet, LeaveRequest, TimesheetStatus, LeaveStatus, Activity, ActivityType, ActiveFeature, UserRole, TimePunch, PayrollRun, EmployeeType, PayType } from '../types';
import { currentUser, contacts as initialContacts, initialChats, mockTimesheets, mockLeaveRequests, mockTimePunches, mockPayrollRuns } from '../data/mockData';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}
interface AppContextType {
  user: User;
  contacts: User[];
  chats: Chat[];
  activities: Activity[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  getContactById: (id: string) => User | undefined;
  getChatById: (id: string) => Chat | undefined;
  sendMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'read'>) => void;
  updateUserStatus: (status: UserStatus) => void;
  deleteMessage: (chatId: string, messageId: string, forEveryone: boolean) => void;
  editMessage: (chatId: string, messageId: string, newContent: string) => void;
  toggleReaction: (chatId: string, messageId: string, emoji: string) => void;
  getMessageById: (chatId: string, messageId: string) => Message | undefined;
  updateUserName: (name: string) => void;
  updateContactName: (contactId: string, name: string) => void;
  updateChatName: (chatId: string, name: string) => void;
  toggleFavorite: (chatId: string) => void;
  forwardMessages: (sourceChatId: string, targetChatIds: string[], messageIds: string[]) => void;
  toggleMuteChat: (chatId:string) => void;
  hideChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  leaveGroup: (chatId: string) => void;
  toggleBlockContact: (contactId: string) => void;
  markChatAsRead: (chatId: string, read: boolean) => void;
  shareContact: (chatIdsToShareIn: string[], contactToShare: User) => void;
  updateUserCustomStatus: (message: string) => void;
  logCall: (chatId: string, callDetails: Pick<Message, 'callInfo' | 'senderId'>) => void;
  updateUserAvatar: (avatarUrl: string | null) => void;
  addParticipant: (chatId: string, userIds: string[]) => void;
  createChat: (partnerId: string) => void;
  getOrCreatePrivateChat: (partnerId: string) => string;
  addContact: (contact: Partial<User> & { name: string; email: string; }) => User | null;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  copyToClipboard: (text: string) => void;
  togglePinMessage: (chatId: string, messageId: string) => void;
  replyPrivately: (sourceChatId: string, messageId: string) => void;
  pendingPrivateReply: { chatId: string, messageId: string } | null;
  clearPendingPrivateReply: () => void;
  typingStatus: Record<string, { userId: string, name: string } | null>;
  setCurrentUserTyping: (chatId: string, isTyping: boolean) => void;
  deleteMessages: (chatId: string, messageIds: string[]) => void;
  deleteCallLogs: (messageIds: string[]) => void;
  archiveChat: (chatId: string) => void;
  createGroupChat: (name: string, participantIds: string[]) => void;
  scheduleMeeting: (meetingDetails: Omit<Meeting, 'id' | 'organizerId' | 'chatId'>) => Meeting;
  updateMeeting: (meetingId: string, updatedDetails: Partial<Meeting>) => Meeting | undefined;
  cancelMeeting: (meetingId: string) => void;
  getMeetingById: (meetingId: string) => { meeting: Meeting; chat: Chat; } | undefined;
  createInstantMeeting: () => Meeting;
  findOrCreateContactByEmail: (email: string) => User;
  updateChatDescription: (chatId: string, description: string) => void;
  updateChatAvatar: (chatId: string, avatarUrl: string) => void;
  updateChatCoverPhoto: (chatId: string, coverPhotoUrl: string) => void;
  // Timesheet specific
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  timePunches: TimePunch[];
  payrollHistory: PayrollRun[];
  sendToPayroll: (timesheetIds: string[]) => void;
  requestLeave: (request: Omit<LeaveRequest, 'id'|'status'|'employeeId'>) => void;
  setTimesheetStatus: (timesheetId: string, status: TimesheetStatus) => void;
  requestTimesheetApproval: (timesheetId: string) => void;
  addEmployee: (employeeData: Pick<User, 'name' | 'email' | 'jobTitle' | 'startDate' | 'employeeType' | 'payType' | 'managerId' | 'role'>) => void;
  runPayrollForPeriod: (period: { start: string, end: string }) => void;
  activeFeature: ActiveFeature;
  setActiveFeature: (feature: ActiveFeature) => void;
  areCaptionsEnabled: boolean;
  setAreCaptionsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  // Activity specific
  markActivityAsRead: (activityId: string, read: boolean) => void;
  removeActivity: (activityId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
      throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

interface AppContextProviderProps {
  children: ReactNode;
  onLogout: () => void;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children, onLogout }) => {
  const [user, setUser] = useState<User>(currentUser);
  const [contacts, setContacts] = useState<User[]>(initialContacts);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChats[0]?.id || null);
  const [pendingPrivateReply, setPendingPrivateReply] = useState<{ chatId: string; messageId: string } | null>(null);
  const [typingStatus, setTypingStatus] = useState<Record<string, { userId: string, name: string } | null>>({});
  const [activeFeature, setActiveFeature] = useState<ActiveFeature>('chat');
  const [areCaptionsEnabled, setAreCaptionsEnabled] = useState(false);
  const [readActivityIds, setReadActivityIds] = useState<Set<string>>(new Set());
  const [removedActivityIds, setRemovedActivityIds] = useState<Set<string>>(new Set());

  // Timesheet State
  const [timesheets, setTimesheets] = useState<Timesheet[]>(mockTimesheets);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [timePunches, setTimePunches] = useState<TimePunch[]>(mockTimePunches);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRun[]>(mockPayrollRuns);

  const addEmployee = useCallback((employeeData: Pick<User, 'name' | 'email' | 'jobTitle' | 'startDate' | 'employeeType' | 'payType' | 'managerId' | 'role'>) => {
    const newUser: User = {
        id: `user-${Date.now()}`,
        avatar: getAvatarUrl(employeeData.name),
        status: UserStatus.Offline,
        isBlocked: false,
        ...employeeData
    };
    setContacts(prev => [...prev, newUser]);
    return newUser;
  }, []);

  const runPayrollForPeriod = useCallback((period: { start: string, end: string }) => {
    const timesheetsToProcess = timesheets.filter(ts => 
        ts.status === TimesheetStatus.Approved && 
        !ts.isPayrollSent
    );

    if (timesheetsToProcess.length === 0) {
        alert("No approved timesheets to process for this period.");
        return;
    }

    const employeeIds = timesheetsToProcess.map(ts => ts.employeeId);
    const totalAmount = timesheetsToProcess.reduce((sum, ts) => sum + (ts.totalHours * 55), 0); // Assuming $55/hr

    setTimesheets(prev => prev.map(ts => 
        timesheetsToProcess.some(processed => processed.id === ts.id) 
            ? { ...ts, isPayrollSent: true } 
            : ts
    ));
    
    const newRun: PayrollRun = {
        id: `pr-${Date.now()}`,
        runDate: new Date().toISOString(),
        periodStart: period.start,
        periodEnd: period.end,
        employeeIds,
        totalAmount
    };
    setPayrollHistory(prev => [newRun, ...prev]);

    alert(`Payroll run successfully for ${employeeIds.length} employees. Total: $${totalAmount.toFixed(2)}`);

  }, [timesheets]);

  const sendToPayroll = useCallback((timesheetIds: string[]) => {
      setTimesheets(prev =>
        prev.map(ts =>
          timesheetIds.includes(ts.id)
            ? { ...ts, isPayrollSent: true, status: TimesheetStatus.Approved, approvedBy: user.name }
            : ts
        )
      );
    }, [user.name]);

  const requestLeave = useCallback((request: Omit<LeaveRequest, 'id'|'status'|'employeeId'>) => {
    const newRequest: LeaveRequest = {
        ...request,
        id: `lr-${Date.now()}`,
        employeeId: user.id,
        status: LeaveStatus.Pending
    };
    setLeaveRequests(prev => [...prev, newRequest]);
  }, [user.id]);
  
  const requestTimesheetApproval = useCallback((timesheetId: string) => {
    setTimesheets(prev =>
      prev.map(ts =>
        ts.id === timesheetId ? { ...ts, status: TimesheetStatus.PendingApproval } : ts
      )
    );
  }, []);

  const setTimesheetStatus = useCallback((timesheetId: string, status: TimesheetStatus) => {
    setTimesheets(prev =>
      prev.map(ts =>
        ts.id === timesheetId ? { ...ts, status, approvedBy: user.name } : ts
      )
    );
  }, [user.name]);


  const getContactById = useCallback((id: string): User | undefined => {
    if (id === user.id) return user;
    return contacts.find(c => c.id === id);
  }, [contacts, user]);
  
  const getChatById = useCallback((chatId: string): Chat | undefined => {
    return chats.find(c => c.id === chatId);
  }, [chats]);

  const getMessageById = useCallback((chatId: string, messageId: string): Message | undefined => {
    const chat = chats.find(c => c.id === chatId);
    return chat?.messages.find(m => m.id === messageId);
  }, [chats]);
  
  const markActivityAsRead = useCallback((activityId: string, read: boolean) => {
    setReadActivityIds(prev => {
        const newSet = new Set(prev);
        if (read) {
            newSet.add(activityId);
        } else {
            newSet.delete(activityId);
        }
        return newSet;
    });
  }, []);

  const removeActivity = useCallback((activityId: string) => {
      setRemovedActivityIds(prev => new Set(prev).add(activityId));
  }, []);

  useEffect(() => {
    const generatedActivities: Activity[] = [];
    const currentUserId = user.id;

    chats.forEach(chat => {
        chat.messages.forEach(message => {
            const messageDate = new Date(message.timestamp);
            if (messageDate > new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)) { // Only process last 7 days for performance
                // Mention
                if (message.senderId !== currentUserId && message.content.includes(`@${user.name}`)) {
                    generatedActivities.push({
                        id: `activity-${message.id}-mention`,
                        type: ActivityType.Mention,
                        actorId: message.senderId,
                        chatId: chat.id,
                        messageId: message.id,
                        timestamp: message.timestamp,
                        isRead: false,
                        previewText: message.content
                    });
                }

                // Reply
                const repliedToMessage = message.replyTo ? getMessageById(chat.id, message.replyTo) : undefined;
                if (message.senderId !== currentUserId && repliedToMessage && repliedToMessage.senderId === currentUserId) {
                    generatedActivities.push({
                        id: `activity-${message.id}-reply`,
                        type: ActivityType.Reply,
                        actorId: message.senderId,
                        chatId: chat.id,
                        messageId: message.id,
                        timestamp: message.timestamp,
                        isRead: false,
                        previewText: `Replied: "${message.content}"`
                    });
                }

                // Reaction
                if (message.senderId === currentUserId && message.reactions) {
                    Object.entries(message.reactions).forEach(([emoji, userIds]) => {
                        userIds.forEach(reactorId => {
                            if (reactorId !== currentUserId) {
                                generatedActivities.push({
                                    id: `activity-${message.id}-reaction-${reactorId}-${emoji}`,
                                    type: ActivityType.Reaction,
                                    actorId: reactorId,
                                    chatId: chat.id,
                                    messageId: message.id,
                                    timestamp: new Date(new Date(message.timestamp).getTime() + 1000).toISOString(), // Slightly after message
                                    isRead: false,
                                    previewText: emoji
                                });
                            }
                        });
                    });
                }

                // Missed Call
                if (message.type === 'call' && message.callInfo?.type === 'missed' && message.senderId !== currentUserId) {
                    generatedActivities.push({
                        id: `activity-${message.id}-missedcall`,
                        type: ActivityType.MissedCall,
                        actorId: message.senderId,
                        chatId: chat.id,
                        messageId: message.id,
                        timestamp: message.timestamp,
                        isRead: false,
                        previewText: 'Missed call'
                    });
                }
            }
        });

        (chat.meetings || []).forEach(meeting => {
             const isParticipant = meeting.participants.some(p => p.email === user.email);
             if (isParticipant && meeting.organizerId !== currentUserId) {
                if (meeting.isCancelled) {
                     generatedActivities.push({
                        id: `activity-${meeting.id}-cancel`,
                        type: ActivityType.MeetingCancel,
                        actorId: meeting.organizerId,
                        chatId: chat.id,
                        meetingId: meeting.id,
                        timestamp: new Date().toISOString(), // Use now as proxy
                        isRead: false,
                        previewText: `Cancelled: ${meeting.title}`
                    });
                } else {
                     generatedActivities.push({
                        id: `activity-${meeting.id}-invite`,
                        type: ActivityType.MeetingInvite,
                        actorId: meeting.organizerId,
                        chatId: chat.id,
                        meetingId: meeting.id,
                        timestamp: meeting.startTime,
                        isRead: false,
                        previewText: `Meeting: ${meeting.title}`
                    });
                }
             }
        });
    });
    
    // Remove duplicates and sort
    const uniqueActivities = Array.from(new Map(generatedActivities.map(item => [item.id, item])).values());
    uniqueActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const finalActivities = uniqueActivities
        .filter(a => !removedActivityIds.has(a.id))
        .map(a => ({
            ...a,
            isRead: readActivityIds.has(a.id)
        }));
    setActivities(finalActivities);

  }, [chats, user, getMessageById, readActivityIds, removedActivityIds]);

  const sendMessage = useCallback((chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    setChats(prevChats => prevChats.map(chat => {
        if (chat.id === chatId) {
            const replyToMessage = message.replyTo ? chat.messages.find(m => m.id === message.replyTo) : undefined;
            const newMessage: Message = {
                id: `msg-${Date.now()}`,
                timestamp: new Date().toISOString(),
                read: false,
                ...message,
                reactions: {},
                replyInfo: replyToMessage ? {
                    messageId: replyToMessage.id,
                    senderName: getContactById(replyToMessage.senderId)?.name || 'Unknown',
                    content: replyToMessage.content,
                    type: replyToMessage.type,
                } : undefined,
            };
            return { ...chat, messages: [...chat.messages, newMessage] };
        }
        return chat;
    }));
  }, [getContactById]);

  const updateUserStatus = useCallback((status: UserStatus) => {
    setUser(prev => ({ ...prev, status }));
  }, []);

  const deleteMessage = useCallback((chatId: string, messageId: string, forEveryone: boolean) => {
      setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;
          return {
              ...chat,
              messages: chat.messages.map(msg => {
                  if (msg.id !== messageId) return msg;
                  if (forEveryone) {
                      return { ...msg, isDeleted: true, content: 'This message was deleted', type: 'text' };
                  }
                  return { ...msg, deletedFor: [...(msg.deletedFor || []), user.id] };
              })
          };
      }));
  }, [user.id]);
  
  const editMessage = useCallback((chatId: string, messageId: string, newContent: string) => {
      setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;
          return {
              ...chat,
              messages: chat.messages.map(msg => {
                  if (msg.id !== messageId) return msg;
                  return { ...msg, content: newContent, isEdited: true, timestamp: new Date().toISOString() };
              })
          };
      }));
  }, []);
  
  const toggleReaction = useCallback((chatId: string, messageId: string, emoji: string) => {
      setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;
          
          return {
              ...chat,
              messages: chat.messages.map(msg => {
                  if (msg.id !== messageId) return msg;
                  
                  // Prevent reacting to your own messages.
                  if (msg.senderId === user.id) {
                      return msg;
                  }

                  const newReactions = { ...(msg.reactions || {}) };
                  const isPrivateChat = chat.type === 'private';
                  
                  if (isPrivateChat) {
                      // In a private chat, a user can only have one reaction.
                      const wasReactedWithSameEmoji = newReactions[emoji]?.includes(user.id);

                      // First, remove any existing reaction from the current user
                      for (const key in newReactions) {
                          newReactions[key] = newReactions[key].filter(uid => uid !== user.id);
                          if (newReactions[key].length === 0) {
                              delete newReactions[key];
                          }
                      }
                      
                      // If the user is not just turning off their reaction (by clicking the same emoji again), add the new one.
                      if (!wasReactedWithSameEmoji) {
                          newReactions[emoji] = [user.id];
                      }
                  } else {
                      // Group chat: standard toggle
                      const usersForEmoji = newReactions[emoji] || [];
                      if (usersForEmoji.includes(user.id)) {
                          newReactions[emoji] = usersForEmoji.filter(uid => uid !== user.id);
                      } else {
                          newReactions[emoji] = [...usersForEmoji, user.id];
                      }
                      if (newReactions[emoji].length === 0) {
                          delete newReactions[emoji];
                      }
                  }
                  
                  return { ...msg, reactions: newReactions };
              })
          };
      }));
  }, [user.id]);

  const updateUserName = useCallback((name: string) => {
    setUser(prev => ({ ...prev, name }));
  }, []);

  const updateContactName = useCallback((contactId: string, name: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, name } : c));
  }, []);

  const updateChatName = useCallback((chatId: string, name: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, name } : c));
  }, []);

  const updateChatDescription = useCallback((chatId: string, description: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, description } : c));
  }, []);
  
  const updateChatAvatar = useCallback((chatId: string, avatarUrl: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, avatar: avatarUrl } : c));
  }, []);

  const updateChatCoverPhoto = useCallback((chatId: string, coverPhotoUrl: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, coverPhoto: coverPhotoUrl } : c));
  }, []);


  const toggleFavorite = useCallback((chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isFavorite: !c.isFavorite } : c));
  }, []);

  const forwardMessages = useCallback((sourceChatId: string, targetChatIds: string[], messageIds: string[]) => {
      const sourceChat = chats.find(c => c.id === sourceChatId);
      if (!sourceChat) return;

      const messagesToForward = sourceChat.messages.filter(m => messageIds.includes(m.id));

      setChats(prev => prev.map(chat => {
          if (!targetChatIds.includes(chat.id)) return chat;
          
          const forwardedMessages = messagesToForward.map(m => ({
              ...m,
              id: `msg-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              senderId: user.id,
              isForwarded: true,
              read: false,
              reactions: {},
              replyTo: undefined,
              replyInfo: undefined
          }));
          return { ...chat, messages: [...chat.messages, ...forwardedMessages] };
      }));
  }, [chats, user.id]);

  const toggleMuteChat = useCallback((chatId: string) => {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isMuted: !c.isMuted } : c));
  }, []);

  const hideChat = useCallback((chatId: string) => {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isHidden: true } : c));
      if (activeChatId === chatId) {
          setActiveChatId(null);
      }
  }, [activeChatId]);

  const deleteChat = useCallback((chatId: string) => {
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
          setActiveChatId(null);
      }
  }, [activeChatId]);

  const leaveGroup = useCallback((chatId: string) => {
      setChats(prevChats => {
          const updatedChatsWithMessage = prevChats.map(chat => {
              if (chat.id === chatId && chat.type === 'group') {
                  const systemMessage: Message = {
                      id: `msg-system-${Date.now()}`,
                      senderId: 'system',
                      content: `${user.name} left the group.`,
                      timestamp: new Date().toISOString(),
                      type: 'text',
                      read: true,
                  };
                  return {
                      ...chat,
                      participants: chat.participants.filter(pId => pId !== user.id),
                      messages: [...chat.messages, systemMessage]
                  };
              }
              return chat;
          });
          return updatedChatsWithMessage.filter(chat => chat.id !== chatId);
      });

      if (activeChatId === chatId) {
          setActiveChatId(null);
      }
  }, [user.id, user.name, activeChatId]);

  const toggleBlockContact = useCallback((contactId: string) => {
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isBlocked: !c.isBlocked } : c));
  }, []);

  const markChatAsRead = useCallback((chatId: string, read: boolean) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage && (lastMessage.senderId !== user.id || !read)) {
          return {
              ...chat,
              messages: chat.messages.map(m => ({ ...m, read }))
          };
      }
      return chat;
    }));
  }, [user.id]);

  const shareContact = useCallback((chatIdsToShareIn: string[], contactToShare: User) => {
      chatIdsToShareIn.forEach(chatId => {
        sendMessage(chatId, {
            senderId: user.id,
            content: `Contact card for ${contactToShare.name}`,
            type: 'contact',
            contactInfo: {
                id: contactToShare.id,
                name: contactToShare.name,
                avatar: contactToShare.avatar
            }
        });
      });
  }, [sendMessage, user.id]);

  const updateUserCustomStatus = useCallback((message: string) => {
      setUser(prev => ({ ...prev, customStatusMessage: message }));
  }, []);

  const logCall = useCallback((chatId: string, callDetails: Pick<Message, 'callInfo' | 'senderId'>) => {
      sendMessage(chatId, {
          ...callDetails,
          type: 'call',
          content: callDetails.callInfo?.type === 'missed' ? 'Missed call' : 'Call'
      });
  }, [sendMessage]);

  const updateUserAvatar = useCallback((avatarUrl: string | null) => {
      setUser(prev => ({ ...prev, avatar: avatarUrl || `https://picsum.photos/seed/${prev.name}/100/100` }));
  }, []);

  const findOrCreateContactByEmail = useCallback((email: string): User => {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = [...contacts, user].find(c => c.email.toLowerCase() === normalizedEmail);
    if (existing) {
        return existing;
    }

    const newContact: User = {
        id: `user-${Date.now()}-${Math.random()}`,
        name: normalizedEmail.split('@')[0], // A reasonable default name
        email: normalizedEmail,
        avatar: `https://picsum.photos/seed/${normalizedEmail}/100/100`,
        status: UserStatus.Offline,
    };
    
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, [contacts, user]);

  const addParticipant = useCallback((chatId: string, userIds: string[]) => {
      setChats(prev => prev.map(chat => {
          if (chat.id === chatId && chat.type === 'group') {
              const newParticipants = userIds.filter(id => !chat.participants.includes(id));
              if (newParticipants.length > 0) {
                 const newUsers = newParticipants.map(getContactById).filter(Boolean) as User[];
                 const announcement = `${user.name} added ${newUsers.map(u => u.name).join(', ')}.`;

                 const systemMessage: Message = {
                    id: `msg-system-${Date.now()}`,
                    senderId: 'system',
                    content: announcement,
                    timestamp: new Date().toISOString(),
                    type: 'text',
                    read: true,
                 };

                 return { 
                    ...chat, 
                    participants: [...chat.participants, ...newParticipants],
                    messages: [...chat.messages, systemMessage]
                 };
              }
          }
          return chat;
      }));
  }, [getContactById, user.name]);
  
  const getOrCreatePrivateChat = useCallback((partnerId: string) => {
      const existingChat = chats.find(c => c.type === 'private' && c.participants.includes(user.id) && c.participants.includes(partnerId));
      if (existingChat) {
          return existingChat.id;
      }
      const newChat: Chat = {
          id: `chat-${Date.now()}`,
          type: 'private',
          participants: [user.id, partnerId],
          messages: []
      };
      setChats(prev => [...prev, newChat]);
      return newChat.id;
  }, [chats, user.id]);
  
  const createChat = useCallback((partnerId: string) => {
      const chatId = getOrCreatePrivateChat(partnerId);
      setActiveChatId(chatId);
  }, [getOrCreatePrivateChat]);

  const addContact = useCallback((contact: Partial<User> & { name: string; email: string; }): User | null => {
      const existing = contacts.find(c => c.email.toLowerCase() === contact.email.toLowerCase());
      if (existing) return null;

      const newContact: User = {
          id: contact.id || `user-${Date.now()}`,
          status: contact.status || UserStatus.Offline,
          avatar: contact.avatar || `https://picsum.photos/seed/${contact.name}/100/100`,
          ...contact
      } as User;
      setContacts(prev => [...prev, newContact]);
      return newContact;
  }, [contacts]);
  
  const updateUserSettings = useCallback((newSettings: Partial<UserSettings>) => {
      setUser(prev => ({...prev, settings: { ...prev.settings!, ...newSettings }}));
  }, []);
  
  const updateUser = useCallback((updates: Partial<User>) => {
      setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const logout = useCallback(() => {
      onLogout();
  }, [onLogout]);
  
  const copyToClipboard = useCallback((text: string) => {
      navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy text: ', err));
  }, []);
  
  const togglePinMessage = useCallback((chatId: string, messageId: string) => {
      setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;
          const pinned = chat.pinnedMessages || [];
          const newPinned = pinned.includes(messageId)
              ? pinned.filter(id => id !== messageId)
              : [...pinned, messageId];
          return { ...chat, pinnedMessages: newPinned };
      }));
  }, []);
  
  const replyPrivately = useCallback((sourceChatId: string, messageId: string) => {
      const sourceMessage = getMessageById(sourceChatId, messageId);
      if (!sourceMessage) return;
      
      const partnerId = sourceMessage.senderId;
      const privateChatId = getOrCreatePrivateChat(partnerId);
      
      setActiveChatId(privateChatId);
      setPendingPrivateReply({ chatId: privateChatId, messageId: sourceMessage.id });
  }, [getMessageById, getOrCreatePrivateChat]);
  
  const clearPendingPrivateReply = useCallback(() => {
      setPendingPrivateReply(null);
  }, []);
  
  const setCurrentUserTyping = useCallback((chatId: string, isTyping: boolean) => {
    setTypingStatus(prev => {
        const newStatus = { ...prev };
        if (isTyping) {
            newStatus[chatId] = { userId: user.id, name: user.name };
        } else if (newStatus[chatId]?.userId === user.id) {
            newStatus[chatId] = null;
        }
        return newStatus;
    });
  }, [user.id, user.name]);

  const deleteMessages = useCallback((chatId: string, messageIds: string[]) => {
      setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;
          return {
              ...chat,
              messages: chat.messages.map(msg =>
                  messageIds.includes(msg.id)
                      ? { ...msg, deletedFor: [...(msg.deletedFor || []), user.id] }
                      : msg
              )
          };
      }));
  }, [user.id]);

  const deleteCallLogs = useCallback((messageIds: string[]) => {
      setChats(prev => prev.map(chat => ({
          ...chat,
          messages: chat.messages.map(msg => messageIds.includes(msg.id) ? { ...msg, deletedFor: [...(msg.deletedFor || []), user.id] } : msg)
      })));
  }, [user.id]);

  const archiveChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(c => {
        if (c.id === chatId) {
            return { ...c, isArchived: !(c.isArchived || false) };
        }
        return c;
    }));
  }, []);

  const createGroupChat = useCallback((name: string, participantIds: string[]) => {
      const newChat: Chat = {
          id: `chat-${Date.now()}`,
          type: 'group',
          name,
          participants: [user.id, ...participantIds],
          messages: [],
          avatar: `https://picsum.photos/seed/${name}/100/100`,
          coverPhoto: `https://picsum.photos/seed/${name}-cover/800/200`,
          organizerId: user.id,
          createdAt: new Date().toISOString(),
          description: 'A new group chat.'
      };
      setChats(prev => [...prev, newChat]);
      setActiveChatId(newChat.id);
  }, [user.id]);
  
  const scheduleMeeting = useCallback((meetingDetails: Omit<Meeting, 'id' | 'organizerId' | 'chatId'>): Meeting => {
      const allParticipantUsers = meetingDetails.participants.map(p => findOrCreateContactByEmail(p.email));
      const allParticipantIds = allParticipantUsers.map(u => u.id);
      
      // Find or create a group chat for these participants
      let chatForMeeting = chats.find(c => 
          c.type === 'group' && 
          c.participants.length === allParticipantIds.length && 
          allParticipantIds.every(id => c.participants.includes(id))
      );

      if (!chatForMeeting) {
          chatForMeeting = {
              id: `chat-meeting-${Date.now()}`,
              type: 'group',
              name: meetingDetails.title,
              participants: allParticipantIds,
              messages: [],
              meetings: []
          };
          setChats(prev => [...prev, chatForMeeting!]);
      }

      const newMeeting: Meeting = {
          ...meetingDetails,
          id: `meeting-${Date.now()}`,
          organizerId: user.id,
          chatId: chatForMeeting.id,
          participants: allParticipantUsers.map(u => ({ email: u.email, name: u.name, status: u.id === user.id ? 'accepted' : 'pending' }))
      };

      setChats(prev => prev.map(c => 
          c.id === chatForMeeting!.id 
              ? { ...c, meetings: [...(c.meetings || []), newMeeting] } 
              : c
      ));
      return newMeeting;
  }, [user.id, user.name, chats, findOrCreateContactByEmail]);
  
  const updateMeeting = useCallback((meetingId: string, updatedDetails: Partial<Meeting>): Meeting | undefined => {
      let updatedMeeting: Meeting | undefined;
      setChats(prev => prev.map(chat => ({
          ...chat,
          meetings: chat.meetings?.map(m => {
            if (m.id === meetingId) {
                updatedMeeting = { ...m, ...updatedDetails };
                return updatedMeeting;
            }
            return m;
        })
      })));
      return updatedMeeting;
  }, []);
  
  const cancelMeeting = useCallback((meetingId: string) => {
      setChats(prev => prev.map(chat => ({
          ...chat,
          meetings: chat.meetings?.map(m =>
              m.id === meetingId ? { ...m, isCancelled: true } : m
          )
      })));
  }, []);

  const getMeetingById = useCallback((meetingId: string) => {
    for (const chat of chats) {
        const meeting = chat.meetings?.find(m => m.id === meetingId);
        if (meeting) {
            return { meeting, chat };
        }
    }
    return undefined;
  }, [chats]);
  
  const createInstantMeeting = useCallback((): Meeting => {
    const meetingTitle = `Instant Meeting - ${new Date().toLocaleTimeString()}`;
    const newChatId = `chat-instant-${Date.now()}`;
    
    const newChat: Chat = {
        id: newChatId,
        type: 'group',
        name: meetingTitle,
        participants: [user.id],
        messages: [],
        meetings: [],
    };

    const meeting: Meeting = {
        id: `meeting-instant-${Date.now()}`,
        title: meetingTitle,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        organizerId: user.id,
        participants: [{ email: user.email, name: user.name, status: 'accepted' }],
        chatId: newChatId,
        recurrence: RecurrenceFrequency.None
    };

    if (newChat.meetings) {
        newChat.meetings.push(meeting);
    } else {
        newChat.meetings = [meeting];
    }
    
    setChats(prev => [...prev, newChat]);

    return meeting;
  }, [user]);
  

  const value: AppContextType = {
    user,
    contacts,
    chats,
    activities,
    activeChatId,
    setActiveChatId,
    getContactById,
    getChatById,
    sendMessage,
    updateUserStatus,
    deleteMessage,
    editMessage,
    toggleReaction,
    getMessageById,
    updateUserName,
    updateContactName,
    updateChatName,
    toggleFavorite,
    forwardMessages,
    toggleMuteChat,
    hideChat,
    deleteChat,
    leaveGroup,
    toggleBlockContact,
    markChatAsRead,
    shareContact,
    updateUserCustomStatus,
    logCall,
    updateUserAvatar,
    addParticipant,
    createChat,
    getOrCreatePrivateChat,
    addContact,
    updateUserSettings,
    updateUser,
    logout,
    copyToClipboard,
    togglePinMessage,
    replyPrivately,
    pendingPrivateReply,
    clearPendingPrivateReply,
    typingStatus,
    setCurrentUserTyping,
    deleteMessages,
    deleteCallLogs,
    archiveChat,
    createGroupChat,
    scheduleMeeting,
    updateMeeting,
    cancelMeeting,
    getMeetingById,
    createInstantMeeting,
    findOrCreateContactByEmail,
    updateChatDescription,
    updateChatAvatar,
    updateChatCoverPhoto,
    timesheets,
    leaveRequests,
    timePunches,
    payrollHistory,
    sendToPayroll,
    requestLeave,
    setTimesheetStatus,
    requestTimesheetApproval,
    addEmployee,
    runPayrollForPeriod,
    activeFeature,
    setActiveFeature,
    areCaptionsEnabled,
    setAreCaptionsEnabled,
    markActivityAsRead,
    removeActivity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};