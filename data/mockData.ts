import { User, UserStatus, Chat, RecurrenceFrequency, EmployeeType, PayType, Timesheet, TimesheetStatus, LeaveRequest, LeaveStatus, UserRole, TimePunch, PayrollRun } from '../types';

export const currentUser: User = {
  id: 'admin-1',
  name: 'Sonia W.',
  avatar: 'https://picsum.photos/seed/sonia/100/100',
  status: UserStatus.Online,
  email: 'sonia.w@example.com',
  customStatusMessage: "Managing the team",
  skypeName: 'live:sonia.w_1',
  birthday: '1985-01-20',
  skypeCredits: 25.00,
  skypeNumber: '+1234567891',
  isCameraOn: false,
  isMuted: false,
  isHandRaised: false,
  location: 'New York, NY',
  phone: '+1-555-123-4566',
  jobTitle: 'HR Administrator',
  role: UserRole.Admin,
  startDate: '2018-03-12',
  settings: {
    enableNotifications: true,
    showMessagePreview: true,
    playSound: true,
    showReadReceipts: false,
    showCallWindowInBackground: true,
    onlyRingForContacts: false,
    autoAdjustMic: true,
    micVolume: 80,
    unmuteOnIncoming: false,
    speakerVolume: 80,
    ringOnAdditionalDevice: false,
    autoStartApp: true,
    openInBackground: true,
    openContentIn: 'main',
    startChatsIn: 'main',
    appLanguage: 'English',
    translationLanguage: 'Urdu',
    translationHandling: 'ask',
    neverTranslateLanguages: ['English'],
    keepAppBarVisible: false,
    showSuggestedReplies: true,
    enableSpellCheck: true,
    cloudStorageUsed: 0.4,
    cloudStorageTotal: 5,
    timezone: 'Asia/Karachi',
    theme: 'system',
    alwaysUseDarkThemeForCalls: false,
    skinTonePreference: 'default',
    profilePictureVisibility: 'contacts',
    largeEmoticons: true,
    webLinkPreviews: true,
    textSize: 'normal',
    sendMessageOnEnter: true,
    pasteAsQuote: false,
    autoDownloadPhotos: true,
    autoDownloadFiles: false,
    fileSaveLocation: 'Downloads',
  }
};

export const contacts: User[] = [
  { id: 'user-1', name: 'Alex Ray', avatar: 'https://picsum.photos/seed/alex/100/100', status: UserStatus.Online, email: 'alex.ray@example.com', phone: '+1-555-123-4567', jobTitle: 'Engineering Manager', role: UserRole.Manager, managerId: 'admin-1', startDate: '2020-02-01' },
  { id: 'user-2', name: 'Casey Smith', avatar: 'https://picsum.photos/seed/casey/100/100', status: UserStatus.Online, email: 'casey.smith@example.com', customStatusMessage: 'Available: Mon - Fri from 8 am till 5 pm', isCameraOn: true, isMuted: false, isHandRaised: false, location: 'Los Angeles, CA', birthday: '1988-11-23', phone: '+1-555-123-4568', jobTitle: 'Product Designer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2021-06-15' },
  { id: 'user-3', name: 'Jordan Lee', avatar: 'https://picsum.photos/seed/jordan/100/100', status: UserStatus.Busy, email: 'jordan.lee@example.com', isCameraOn: false, isMuted: true, isHandRaised: false, location: 'New York, NY', phone: '+1-555-123-4569', jobTitle: 'UX Researcher', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2021-07-20' },
  { id: 'user-4', name: 'Taylor Green', avatar: 'https://picsum.photos/seed/taylor/100/100', status: UserStatus.Offline, email: 'taylor.green@example.com', isCameraOn: false, isMuted: false, isHandRaised: false, location: 'London, UK', phone: '+44-20-7946-0958', jobTitle: 'QA Engineer', employeeType: EmployeeType.Contractor, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2022-01-10' },
  { id: 'user-5', name: 'Morgan Quinn', avatar: 'https://picsum.photos/seed/morgan/100/100', status: UserStatus.Away, email: 'morgan.quinn@example.com', isCameraOn: true, isMuted: true, isHandRaised: false, location: 'Paris, France', birthday: '1995-02-14', phone: '+33-1-44-14-69-00', jobTitle: 'Senior UI Designer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2019-11-05' },
  { id: 'user-6', name: 'Mark Stephens', avatar: 'https://picsum.photos/seed/mark/100/100', status: UserStatus.Online, email: 'mark.stephens@example.com', isCameraOn: false, isMuted: false, isHandRaised: false, location: 'Tokyo, Japan', phone: '+81-3-4567-8901', jobTitle: 'Java Developer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2022-03-01' },
  { id: 'user-7', name: 'Roy Hui', avatar: 'https://picsum.photos/seed/roy/100/100', status: UserStatus.Online, email: 'roy.hui@example.com', isCameraOn: false, isMuted: false, isHandRaised: false, phone: '+1-555-123-4570', jobTitle: 'Visual Basic Programmer', employeeType: EmployeeType.Contractor, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2022-08-22' },
  { id: 'user-8', name: 'Bryan Hofferica', avatar: 'https://picsum.photos/seed/bryan/100/100', status: UserStatus.Online, email: 'bryan.hofferica@example.com', isCameraOn: false, isMuted: true, isHandRaised: false, phone: '+1-555-123-4571', jobTitle: 'Frontend Developer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2020-09-14' },
  { id: 'user-9', name: 'Atul Kulkarni', avatar: 'https://picsum.photos/seed/atul/100/100', status: UserStatus.Online, email: 'atul.kulkarni@example.com', isCameraOn: false, isMuted: true, isHandRaised: false, phone: '+1-555-123-4572', jobTitle: 'Backend Developer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2020-09-14' },
  { id: 'user-10', name: 'Farrukh Kurbanov', avatar: 'https://picsum.photos/seed/farrukh/100/100', status: UserStatus.Online, email: 'farrukh.kurbanov@example.com', isCameraOn: false, isMuted: true, isHandRaised: false, phone: '+1-555-123-4573', jobTitle: 'DevOps Engineer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2021-12-01' },
  { id: 'user-11', name: 'Saqib Ali', avatar: 'https://picsum.photos/seed/saqib/100/100', status: UserStatus.Online, email: 'saqib.ali@example.com', isCameraOn: true, isMuted: false, isHandRaised: false, phone: '+1-555-123-4574', role: UserRole.Employee, managerId: 'user-1', startDate: '2023-01-15' },
  { id: 'user-12', name: 'Akash Nayak', avatar: 'https://picsum.photos/seed/akash/100/100', status: UserStatus.Online, email: 'akash.nayak@example.com', isCameraOn: false, isMuted: true, isHandRaised: false, phone: '+1-555-123-4575', role: UserRole.Employee, managerId: 'user-1', startDate: '2023-02-20' },
  { id: 'user-13', name: 'Raj Krishna', avatar: 'https://picsum.photos/seed/raj/100/100', status: UserStatus.Online, email: 'raj.krishna@example.com', isCameraOn: false, isMuted: true, isHandRaised: false, phone: '+1-555-123-4576', role: UserRole.Employee, managerId: 'user-1', startDate: '2023-03-10' },
  { id: 'user-14', name: 'Huda Rizwan', avatar: 'https://picsum.photos/seed/huda/100/100', status: UserStatus.Online, email: 'huda.rizwan@example.com', isCameraOn: true, isMuted: true, isHandRaised: false, phone: '+1-555-123-4577', role: UserRole.Employee, managerId: 'user-1', startDate: '2023-04-05' },
  { id: 'user-15', name: 'Jamie Lannister', avatar: 'https://picsum.photos/seed/jamie/100/100', status: UserStatus.Online, email: 'jamie.lannister@example.com', phone: '+1-555-123-4578', jobTitle: 'Software Engineer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-05-01' },
  { id: 'user-16', name: 'Cersei Lannister', avatar: 'https://picsum.photos/seed/cersei/100/100', status: UserStatus.Busy, email: 'cersei.lannister@example.com', phone: '+1-555-123-4579', jobTitle: 'Project Manager', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-05-01' },
  { id: 'user-17', name: 'Daenerys Targaryen', avatar: 'https://picsum.photos/seed/daenerys/100/100', status: UserStatus.Away, email: 'daenerys.targaryen@example.com', phone: '+1-555-123-4580', jobTitle: 'Lead Developer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2022-11-10' },
  { id: 'user-18', name: 'Jon Snow', avatar: 'https://picsum.photos/seed/jon/100/100', status: UserStatus.Online, email: 'jon.snow@example.com', phone: '+1-555-123-4581', jobTitle: 'Security Specialist', employeeType: EmployeeType.Contractor, payType: PayType.Hourly, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-06-15' },
  { id: 'user-19', name: 'Sansa Stark', avatar: 'https://picsum.photos/seed/sansa/100/100', status: UserStatus.Offline, email: 'sansa.stark@example.com', phone: '+1-555-123-4582', jobTitle: 'UI/UX Designer', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-07-20' },
  { id: 'user-20', name: 'Arya Stark', avatar: 'https://picsum.photos/seed/arya/100/100', status: UserStatus.DoNotDisturb, email: 'arya.stark@example.com', phone: '+1-555-123-4583', jobTitle: 'Penetration Tester', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-07-20' },
  { id: 'user-21', name: 'Tyrion Lannister', avatar: 'https://picsum.photos/seed/tyrion/100/100', status: UserStatus.Online, email: 'tyrion.lannister@example.com', phone: '+1-555-123-4584', jobTitle: 'Business Analyst', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2021-01-01' },
  { id: 'user-22', name: 'Petyr Baelish', avatar: 'https://picsum.photos/seed/petyr/100/100', status: UserStatus.Away, email: 'petyr.baelish@example.com', phone: '+1-555-123-4585', jobTitle: 'Financial Advisor', employeeType: EmployeeType.Contractor, payType: PayType.Hourly, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-08-01' },
  { id: 'user-23', name: 'Varys', avatar: 'https://picsum.photos/seed/varys/100/100', status: UserStatus.Online, email: 'varys@example.com', phone: '+1-555-123-4586', jobTitle: 'Information Broker', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'admin-1', role: UserRole.Manager, startDate: '2019-01-01' },
  { id: 'user-24', name: 'Brienne of Tarth', avatar: 'https://picsum.photos/seed/brienne/100/100', status: UserStatus.Busy, email: 'brienne.tarth@example.com', phone: '+1-555-123-4587', jobTitle: 'Security Guard', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-23', role: UserRole.Employee, startDate: '2022-09-01' },
  { id: 'user-25', name: 'Samwell Tarly', avatar: 'https://picsum.photos/seed/samwell/100/100', status: UserStatus.Online, email: 'samwell.tarly@example.com', phone: '+1-555-123-4588', jobTitle: 'Data Scientist', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-23', role: UserRole.Employee, startDate: '2023-02-15' },
  { id: 'user-26', name: 'Gilly', avatar: 'https://picsum.photos/seed/gilly/100/100', status: UserStatus.Offline, email: 'gilly@example.com', phone: '+1-555-123-4589', jobTitle: 'Junior Data Scientist', employeeType: EmployeeType.Contractor, payType: PayType.Hourly, managerId: 'user-25', role: UserRole.Employee, startDate: '2023-09-01' },
  { id: 'user-27', name: 'Theon Greyjoy', avatar: 'https://picsum.photos/seed/theon/100/100', status: UserStatus.Away, email: 'theon.greyjoy@example.com', phone: '+1-555-123-4590', jobTitle: 'Intern', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-09-10' },
  { id: 'user-28', name: 'Yara Greyjoy', avatar: 'https://picsum.photos/seed/yara/100/100', status: UserStatus.Online, email: 'yara.greyjoy@example.com', phone: '+1-555-123-4591', jobTitle: 'Logistics Coordinator', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2022-04-01' },
  { id: 'user-29', name: 'Margaery Tyrell', avatar: 'https://picsum.photos/seed/margaery/100/100', status: UserStatus.Busy, email: 'margaery.tyrell@example.com', phone: '+1-555-123-4592', jobTitle: 'Public Relations', employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, managerId: 'user-1', role: UserRole.Employee, startDate: '2023-03-01' },
  { id: 'user-30', name: 'Olenna Tyrell', avatar: 'https://picsum.photos/seed/olenna/100/100', status: UserStatus.Online, email: 'olenna.tyrell@example.com', phone: '+1-555-123-4593', jobTitle: 'Senior Advisor', employeeType: EmployeeType.Contractor, payType: PayType.Salaried, managerId: 'admin-1', role: UserRole.Manager, startDate: '2020-01-01' },
];

const meetingParticipants = [
  { email: 'sonia.w@example.com', name: 'Sonia W.', status: 'accepted' as const },
  { email: 'alex.ray@example.com', name: 'Alex Ray', status: 'accepted' as const },
  { email: 'casey.smith@example.com', name: 'Casey Smith', status: 'accepted' as const },
  { email: 'jordan.lee@example.com', name: 'Jordan Lee', status: 'accepted' as const },
  { email: 'taylor.green@example.com', name: 'Taylor Green', status: 'accepted' as const },
  { email: 'morgan.quinn@example.com', name: 'Morgan Quinn', status: 'accepted' as const },
  { email: 'mark.stephens@example.com', name: 'Mark Stephens', status: 'accepted' as const },
  { email: 'roy.hui@example.com', name: 'Roy Hui', status: 'accepted' as const },
  { email: 'bryan.hofferica@example.com', name: 'Bryan Hofferica', status: 'accepted' as const },
  { email: 'atul.kulkarni@example.com', name: 'Atul Kulkarni', status: 'accepted' as const },
  { email: 'farrukh.kurbanov@example.com', name: 'Farrukh Kurbanov', status: 'accepted' as const },
  { email: 'saqib.ali@example.com', name: 'Saqib Ali', status: 'accepted' as const },
  { email: 'akash.nayak@example.com', name: 'Akash Nayak', status: 'pending' as const },
  { email: 'raj.krishna@example.com', name: 'Raj Krishna', status: 'pending' as const },
  { email: 'huda.rizwan@example.com', name: 'Huda Rizwan', status: 'accepted' as const },
];

export const initialChats: Chat[] = [
  {
    id: 'chat-1',
    type: 'private',
    participants: ['admin-1', 'user-2'],
    messages: [
      { id: 'msg-1-call-0', senderId: 'user-2', type: 'call', content: 'Missed call', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), read: true, callInfo: { type: 'missed', duration: 0, callMethod: 'video' } },
      { id: 'msg-1-1', senderId: 'user-2', content: 'Hey! How is the project going?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'text', read: true, reactions: { '👍': ['admin-1'] } },
      { id: 'msg-1-2', senderId: 'admin-1', content: 'Hey Casey! Going well. Should have an update for you by EOD.', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), type: 'text', read: true, reactions: { '❤️': ['user-2'] } },
      { id: 'msg-1-3', senderId: 'user-2', content: 'Sounds great!', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), type: 'text', read: false, replyTo: 'msg-1-2', replyInfo: { messageId: 'msg-1-2', senderName: 'Sonia W.', content: 'Hey Casey! Going well. Should have an update for you by EOD.', type: 'text' } },
      { id: 'msg-1-call-1', senderId: 'admin-1', type: 'call', content: 'Outgoing call', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), read: true, callInfo: { type: 'outgoing', duration: 125, callMethod: 'audio' } },
    ],
    meetings: [
        {
            id: 'meeting-3',
            title: 'Design Review - Cancelled',
            description: 'This meeting was cancelled.',
            location: 'Virtual',
            startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).getTime() + 3600000).toISOString(),
            participants: [
                { email: 'alex.ray@example.com', name: 'Alex Ray', status: 'accepted' },
                { email: 'casey.smith@example.com', name: 'Casey Smith', status: 'accepted' },
            ],
            organizerId: 'user-2',
            chatId: 'chat-1',
            recurrence: RecurrenceFrequency.None,
            isCancelled: true,
        }
    ],
    isFavorite: true,
  },
  {
    id: 'chat-2',
    type: 'private',
    participants: ['admin-1', 'user-3'],
    messages: [
      { id: 'msg-2-1', senderId: 'user-3', content: 'Can we have a quick call today?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'text', read: true },
      { id: 'msg-2-2', senderId: 'admin-1', content: 'Sure, I am free in an hour.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), type: 'text', read: true },
      { id: 'msg-2-3', senderId: 'user-3', content: 'Great, talk to you then!', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'text', read: false, replyTo: 'msg-2-2', replyInfo: { messageId: 'msg-2-2', senderName: 'Sonia W.', content: 'Sure, I am free in an hour.', type: 'text' } }
    ],
  },
  {
    id: 'chat-3',
    type: 'group',
    organizerId: 'admin-1',
    participants: ['admin-1', 'user-1', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10', 'user-11', 'user-12', 'user-13', 'user-14'],
    name: 'Project Phoenix Team',
    avatar: 'https://picsum.photos/seed/phoenix/100/100',
    coverPhoto: 'https://picsum.photos/seed/phoenix-cover/800/200',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    description: 'A group where community members can talk about anything with each other',
    messages: [
      { id: 'msg-3-1', senderId: 'user-4', content: 'Welcome to the team chat!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'text', read: true },
       { id: 'msg-3-2', senderId: 'user-5', content: 'Excited to start!', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), type: 'text', read: true },
      { id: 'msg-3-3', senderId: 'user-4', content: 'Let\'s get this done! Here is the latest mock for @Sonia W.', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), type: 'text', read: true },
       { id: 'msg-3-4', senderId: 'admin-1', content: 'https://picsum.photos/seed/mockup/400/300', timestamp: new Date(Date.now() - 1000 * 60 * 49).toISOString(), type: 'image', read: true },
       { id: 'msg-3-5', senderId: 'user-4', content: 'Meeting point for lunch.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'location', read: true, locationInfo: { latitude: 34.052235, longitude: -118.243683, address: "Grand Park, Los Angeles" } },
       { id: 'msg-3-6', senderId: 'user-5', content: 'Here is the contact for the new designer.', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'contact', read: false, contactInfo: { id: 'user-3', name: 'Jordan Lee', avatar: 'https://picsum.photos/seed/jordan/100/100' } },
       { id: 'msg-3-7', senderId: 'system', content: 'Sonia W. added Casey Smith.', timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(), type: 'text', read: true },
       { id: 'msg-3-8', senderId: 'admin-1', content: 'Quick update.', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), type: 'audio', read: false, audioInfo: { url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', duration: 1 } },
    ],
    meetings: [
        {
            id: 'meeting-1',
            title: 'Project Phoenix Kick-off',
            description: 'Initial planning session for the project.',
            location: 'Virtual',
            startTime: new Date(new Date().setHours(16, 51, 0, 0)).toISOString(),
            endTime: new Date(new Date().setHours(17, 51, 0, 0)).toISOString(),
            participants: [
                { email: 'alex.ray@example.com', name: 'Alex Ray', status: 'accepted' },
                { email: 'taylor.green@example.com', name: 'Taylor Green', status: 'accepted' },
                 { email: 'morgan.quinn@example.com', name: 'Morgan Quinn', status: 'pending' },
            ],
            organizerId: 'admin-1',
            chatId: 'chat-3',
            recurrence: RecurrenceFrequency.None,
            isCancelled: false,
        },
        {
            id: 'meeting-2',
            title: 'Weekly Stand-up',
            description: 'Regular weekly sync.',
            location: 'Conference Room 3B',
            startTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            endTime: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
            participants: meetingParticipants,
            organizerId: 'user-4',
            chatId: 'chat-3',
            recurrence: RecurrenceFrequency.Weekly,
            isCancelled: false,
        }
    ]
  },
  {
    id: 'chat-4',
    type: 'private',
    participants: ['admin-1', 'user-15'],
    messages: [
      { id: 'msg-4-1', senderId: 'user-15', content: 'Hey, do you have a minute?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: 'text', read: true },
      { id: 'msg-4-2', senderId: 'admin-1', content: 'Yes, what\'s up?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-5',
    type: 'private',
    participants: ['admin-1', 'user-16'],
    messages: [
      { id: 'msg-5-1', senderId: 'user-16', content: 'The report is ready.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-6',
    type: 'private',
    participants: ['admin-1', 'user-17'],
    messages: [
      { id: 'msg-6-1', senderId: 'admin-1', content: 'Can you check the deployment?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), type: 'text', read: false },
    ],
  },
  {
    id: 'chat-7',
    type: 'private',
    participants: ['admin-1', 'user-18'],
    messages: [
      { id: 'msg-7-1', senderId: 'user-18', content: 'Found a vulnerability, sending the report.', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-8',
    type: 'private',
    participants: ['admin-1', 'user-19'],
    messages: [
      { id: 'msg-8-1', senderId: 'admin-1', content: 'The new designs look great!', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), type: 'text', read: true },
      { id: 'msg-8-2', senderId: 'user-19', content: 'Thanks! Glad you like them.', timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-9',
    type: 'private',
    participants: ['admin-1', 'user-20'],
    messages: [
      { id: 'msg-9-1', senderId: 'user-20', content: 'I need access to the test server.', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-10',
    type: 'private',
    participants: ['admin-1', 'user-21'],
    messages: [
      { id: 'msg-10-1', senderId: 'user-21', content: 'Here are the minutes from the meeting.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'text', read: false },
    ],
  },
  {
    id: 'chat-11',
    type: 'private',
    participants: ['admin-1', 'user-22'],
    messages: [
      { id: 'msg-11-1', senderId: 'admin-1', content: 'Following up on the budget proposal.', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-12',
    type: 'group',
    name: 'Management Sync',
    participants: ['admin-1', 'user-1', 'user-23', 'user-30'],
    avatar: 'https://picsum.photos/seed/management/100/100',
    messages: [
      { id: 'msg-12-1', senderId: 'user-1', content: 'Weekly sync reminder for tomorrow at 10 AM.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-13',
    type: 'private',
    participants: ['admin-1', 'user-24'],
    messages: [
      { id: 'msg-13-1', senderId: 'user-24', content: 'Security audit is complete.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-14',
    type: 'private',
    participants: ['admin-1', 'user-25'],
    messages: [
      { id: 'msg-14-1', senderId: 'user-25', content: 'The data analysis is fascinating. I have some initial findings.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-15',
    type: 'private',
    participants: ['admin-1', 'user-26'],
    messages: [
      { id: 'msg-15-1', senderId: 'admin-1', content: 'Welcome to the team, Gilly!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-16',
    type: 'private',
    participants: ['admin-1', 'user-27'],
    messages: [
      { id: 'msg-16-1', senderId: 'user-27', content: 'I have a question about my first assignment.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-17',
    type: 'private',
    participants: ['admin-1', 'user-28'],
    messages: [
      { id: 'msg-17-1', senderId: 'user-28', content: 'Shipping container ETA is tomorrow.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-18',
    type: 'private',
    participants: ['admin-1', 'user-29'],
    messages: [
      { id: 'msg-18-1', senderId: 'user-29', content: 'Press release is scheduled for Friday.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(), type: 'text', read: false },
    ],
  },
  {
    id: 'chat-19',
    type: 'private',
    participants: ['admin-1', 'user-30'],
    messages: [
      { id: 'msg-19-1', senderId: 'user-30', content: 'We need to discuss the quarterly strategy.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), type: 'text', read: true },
    ],
  },
  {
    id: 'chat-20',
    type: 'group',
    name: 'Social Committee',
    participants: ['admin-1', 'user-5', 'user-19', 'user-29'],
    avatar: 'https://picsum.photos/seed/social/100/100',
    messages: [
      { id: 'msg-20-1', senderId: 'user-5', content: 'Any ideas for the summer party?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), type: 'text', read: true },
    ],
  },
];


export const mockTimesheets: Timesheet[] = [
    { id: 'ts-2', employeeId: 'user-2', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 172, overtimeHours: 24, sickLeaveHours: 48, ptoHours: 0, paidHolidayHours: 20, totalHours: 264, status: TimesheetStatus.PendingApproval },
    { id: 'ts-3', employeeId: 'user-3', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 160, overtimeHours: 0, sickLeaveHours: 0, ptoHours: 50, paidHolidayHours: 0, totalHours: 210, status: TimesheetStatus.Pending },
    { id: 'ts-4', employeeId: 'user-4', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 178, overtimeHours: 0, sickLeaveHours: 0, ptoHours: 74, paidHolidayHours: 0, totalHours: 252, status: TimesheetStatus.PendingApproval },
    { id: 'ts-5', employeeId: 'user-5', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 156, overtimeHours: 16, sickLeaveHours: 24, ptoHours: 0, paidHolidayHours: 40, totalHours: 236, status: TimesheetStatus.Approved, approvedBy: 'Alex Ray' },
    { id: 'ts-6', employeeId: 'user-6', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 174, overtimeHours: 0, sickLeaveHours: 0, ptoHours: 64, paidHolidayHours: 0, totalHours: 238, status: TimesheetStatus.Approved, approvedBy: 'Alex Ray' },
    { id: 'ts-7', employeeId: 'user-7', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 163, overtimeHours: 32, sickLeaveHours: 0, ptoHours: 100, paidHolidayHours: 0, totalHours: 295, status: TimesheetStatus.Approved, approvedBy: 'Alex Ray' },
    { id: 'ts-8', employeeId: 'user-8', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 160, overtimeHours: 8, sickLeaveHours: 8, ptoHours: 16, paidHolidayHours: 8, totalHours: 200, status: TimesheetStatus.Approved, approvedBy: 'Alex Ray' },
    { id: 'ts-9', employeeId: 'user-9', periodStart: '2022-06-01', periodEnd: '2022-07-31', regularHours: 160, overtimeHours: 0, sickLeaveHours: 0, ptoHours: 0, paidHolidayHours: 0, totalHours: 160, status: TimesheetStatus.Pending, isPayrollSent: true },
];

export const mockLeaveRequests: LeaveRequest[] = [
    { id: 'lr-1', employeeId: 'user-3', leaveType: 'PTO', startDate: '2024-08-01', endDate: '2024-08-05', reason: 'Vacation', status: LeaveStatus.Pending },
    { id: 'lr-2', employeeId: 'user-4', leaveType: 'Sick Leave', startDate: '2024-07-20', endDate: '2024-07-21', reason: 'Flu', status: LeaveStatus.Approved, approvedBy: 'user-1' },
];

const generateMonthlyPunches = (userId: string): TimePunch[] => {
    const punches: TimePunch[] = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        // No punches on weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Don't generate for future days
        if (date > now) continue;

        const checkInTime = new Date(year, month, day, 9, Math.floor(Math.random() * 15)); // 9:00 - 9:14
        const breakStartTime = new Date(year, month, day, 12, 30 + Math.floor(Math.random() * 15)); // 12:30 - 12:44
        const breakEndTime = new Date(year, month, day, 13, 30 + Math.floor(Math.random() * 15)); // 13:30 - 13:44
        const checkOutTime = new Date(year, month, day, 17, 30 + Math.floor(Math.random() * 30)); // 17:30 - 17:59

        punches.push({ id: `tp-${userId}-${day}-in`, userId, type: 'in', timestamp: checkInTime.toISOString() });
        punches.push({ id: `tp-${userId}-${day}-bs`, userId, type: 'break-start', timestamp: breakStartTime.toISOString() });
        punches.push({ id: `tp-${userId}-${day}-be`, userId, type: 'break-end', timestamp: breakEndTime.toISOString() });
        punches.push({ id: `tp-${userId}-${day}-out`, userId, type: 'out', timestamp: checkOutTime.toISOString() });
    }
    return punches;
};

export const mockTimePunches: TimePunch[] = [
    { id: 'tp-1', userId: 'user-2', type: 'in', timestamp: new Date().toISOString() },
    { id: 'tp-2', userId: 'user-3', type: 'in', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'tp-3', userId: 'user-5', type: 'in', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'tp-4', userId: 'user-6', type: 'out', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    ...generateMonthlyPunches(currentUser.id),
];

export const mockPayrollRuns: PayrollRun[] = [
    { id: 'pr-1', runDate: '2022-06-01T10:00:00Z', periodStart: '2022-04-01', periodEnd: '2022-05-31', employeeIds: ['user-2', 'user-3', 'user-4'], totalAmount: 42500 },
    { id: 'pr-2', runDate: '2022-04-01T10:00:00Z', periodStart: '2022-02-01', periodEnd: '2022-03-31', employeeIds: ['user-2', 'user-3', 'user-4', 'user-5'], totalAmount: 58000 },
];
