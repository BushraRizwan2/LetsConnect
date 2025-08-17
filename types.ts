export interface Language {
  code: string;
  name: string;
}

export enum UserStatus {
  Online = 'Online',
  Busy = 'Busy',
  Away = 'Away',
  DoNotDisturb = 'Do not disturb',
  Offline = 'Offline',
}

export interface UserSettings {
  enableNotifications: boolean;
  showMessagePreview: boolean;
  playSound: boolean;
  showReadReceipts: boolean;
  showCallWindowInBackground: boolean;
  onlyRingForContacts: boolean;
  // Audio & Video Settings
  selectedCameraId?: string;
  selectedMicId?: string;
  selectedSpeakerId?: string;
  autoAdjustMic?: boolean;
  micVolume?: number; // 0-100
  unmuteOnIncoming?: boolean;
  speakerVolume?: number; // 0-100
  ringOnAdditionalDevice?: boolean;
  // New General Settings
  autoStartApp: boolean;
  openInBackground: boolean;
  openContentIn: 'main' | 'new';
  startChatsIn: 'main' | 'new';
  appLanguage: string;
  translationLanguage: string;
  translationHandling: 'auto' | 'ask' | 'off';
  neverTranslateLanguages: string[];
  keepAppBarVisible: boolean;
  showSuggestedReplies: boolean;
  enableSpellCheck: boolean;
  cloudStorageUsed: number; // in GB
  cloudStorageTotal: number; // in GB
  timezone?: string;
  // New Appearance Settings
  theme: 'system' | 'light' | 'dark' | 'highContrast';
  alwaysUseDarkThemeForCalls: boolean;
  skinTonePreference: 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
  profilePictureVisibility: 'public' | 'contacts';
  // New Messaging Settings
  largeEmoticons: boolean;
  webLinkPreviews: boolean;
  textSize: 'small' | 'normal' | 'large';
  sendMessageOnEnter: boolean;
  pasteAsQuote: boolean;
  autoDownloadPhotos: boolean;
  autoDownloadFiles: boolean;
  fileSaveLocation: string;
}

export enum EmployeeType {
  Fulltime = 'Fulltime',
  Contractor = 'Contractor',
}

export enum PayType {
  Salaried = 'Salaried',
  Hourly = 'Hourly',
}

export enum LeaveStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Declined = 'Declined',
}

export enum TimesheetStatus {
  Pending = 'Pending',
  PendingApproval = 'Pending Approval',
  Approved = 'Approved',
}

export enum UserRole {
  Employee = 'employee',
  Manager = 'manager',
  Admin = 'admin',
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'PTO' | 'Sick Leave' | 'Unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string; // managerId
}

export interface Timesheet {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  sickLeaveHours: number;
  ptoHours: number;
  paidHolidayHours: number;
  totalHours: number;
  status: TimesheetStatus;
  approvedBy?: string; // managerId or name
  isPayrollSent?: boolean;
}

export interface TimePunch {
  id: string;
  userId: string;
  type: 'in' | 'out' | 'break-start' | 'break-end';
  timestamp: string;
}

export interface PayrollRun {
    id: string;
    runDate: string;
    periodStart: string;
    periodEnd: string;
    employeeIds: string[];
    totalAmount: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: UserStatus;
  email: string;
  phone?: string;
  isBlocked?: boolean;
  customStatusMessage?: string;
  settings?: UserSettings;
  skypeName?: string;
  birthday?: string; // Format: YYYY-MM-DD
  skypeCredits?: number;
  skypeNumber?: string;
  isCameraOn?: boolean;
  isMuted?: boolean;
  isHandRaised?: boolean;
  location?: string;
  employeeType?: EmployeeType;
  payType?: PayType;
  jobTitle?: string;
  managerId?: string; // For hierarchy
  role?: UserRole;
  startDate?: string; // Format: YYYY-MM-DD
}

export interface LocationInfo {
    latitude: number;
    longitude: number;
    address?: string;
}

export interface AudioInfo {
    url: string;
    duration: number; // in seconds
}

export interface CallInfo {
    type: 'incoming' | 'outgoing' | 'missed';
    duration: number; // in seconds
    callMethod: 'audio' | 'video';
}

export type TranscriptInfo = {
  title: string;
  entries: {
    speakerId: string;
    speakerName: string;
    text: string;
    translatedText?: string;
    timestamp: string;
  }[];
};

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'contact' | 'location' | 'audio' | 'call' | 'transcript';
  read: boolean;
  replyTo?: string; // ID of the message this one is replying to
  reactions?: Record<string, string[]>; // Map of emoji to user IDs
  isDeleted?: boolean; // True if deleted for everyone
  deletedFor?: string[]; // userIds for whom the message is deleted
  isEdited?: boolean;
  isForwarded?: boolean;
  fileInfo?: {
    name: string;
    size: string;
    url: string;
    type: string; // e.g., 'image/png', 'application/pdf'
  };
  contactInfo?: {
      id: string;
      name: string;
      avatar: string;
  };
  locationInfo?: LocationInfo;
  audioInfo?: AudioInfo;
  callInfo?: CallInfo;
  transcriptInfo?: TranscriptInfo;
  replyInfo?: {
      messageId: string;
      senderName: string;
      content: string;
      type: 'text' | 'image' | 'file' | 'contact' | 'location' | 'audio' | 'call' | 'transcript';
  }
}

export enum RecurrenceFrequency {
    None = 'None',
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
}

export interface MeetingParticipant {
    email: string;
    name?: string; 
    status: 'accepted' | 'declined' | 'pending';
}

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    participants: MeetingParticipant[];
    organizerId: string;
    chatId: string; // Associated group chat for the meeting
    recurrence: RecurrenceFrequency;
    recurrenceEndDate?: string;
    isCancelled?: boolean;
}


export interface Chat {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  name?: string; // For groups
  avatar?: string; // For groups
  messages: Message[];
  meetings?: Meeting[];
  isFavorite?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  pinnedMessages?: string[];
  createdAt?: string;
  description?: string;
  organizerId?: string;
  coverPhoto?: string;
}

export type BackgroundEffect = 'none' | 'blur' | 'wallpaper';

export interface PreJoinSettings {
  isMicOn: boolean;
  isCameraOn: boolean;
  backgroundEffect: BackgroundEffect;
  wallpaperUrl?: string;
}

export interface CallState {
  meeting: Meeting;
  participants: User[];
  initialSettings: PreJoinSettings;
  sessionId: number;
}

export enum ActivityType {
    Mention = 'mention',
    Reaction = 'reaction',
    Reply = 'reply',
    MissedCall = 'missed_call',
    MeetingInvite = 'meeting_invite',
    MeetingCancel = 'meeting_cancel',
}

export interface Activity {
    id: string;
    type: ActivityType;
    actorId: string; // The user who performed the action
    chatId: string; // The chat where it happened
    messageId?: string; // The message it relates to
    meetingId?: string; // The meeting it relates to
    timestamp: string;
    isRead: boolean;
    previewText?: string; // e.g., the message content or reaction emoji
}

export type ActiveFeature = 'activity' | 'chat' | 'calls' | 'contacts' | 'calendar' | 'timesheet' | 'templates' | 'settings';