export type ApplicationStage =
  | 'application_submitted'
  | 'new'
  | 'contacted'
  | 'interested_review'
  | 'before_meeting'
  | 'meeting_recordings_submitted'
  | 'saturday_meeting'
  | 'attended'
  | 'masterclass_submitted'
  | 'second_meeting'
  | 'agreement_sent'
  | 'agreement_signed'
  | 'chronos_synced'
  | 'joined';

export type ApplicantStatus = 'applying' | 'waiting' | 'approved' | 'rejected' | 'signed' | 'joined' | 'graduated' | 'terminated';
export type UserRole = 'applicant' | 'admin' | 'hr' | 'member' | 'team_lead';

export interface DuplicateCandidate {
  id: string;
  email: string;
  fullName: string;
  score: number;
  reasons: string[];
  reviewId?: string;
  reviewStatus?: 'pending' | 'confirmed_duplicate' | 'different_people' | 'merged';
  reviewNotes?: string;
}

export interface ApplicantProfile {
  id: string;
  email: string;
  alternateEmails?: string[];
  mergedPhoneNumbers?: string[];
  mergedLinkedinUrls?: string[];
  mergedCountries?: string[];
  mergedCities?: string[];
  password: string;
  role: UserRole;
  hrBinaryRole?: boolean;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  stateRegion?: string;
  city: string;
  latitude: number;
  longitude: number;
  linkedinUrl: string;
  education: string;
  source: string;
  referralName?: string;
  cvFileName?: string;
  cvUrl?: string;
  profilePictureUrl?: string;
  roleAppliedFor: string;
  stage: ApplicationStage;
  status: ApplicantStatus;
  joinedAt: string;
  lastVisitedAt: string;
  notes?: string;
  safeSendersConfirmed?: boolean;
  communicationConsent?: boolean;
  duplicateCandidates?: DuplicateCandidate[];
  duplicateNeedsReview?: boolean;
  /** When set, applicant is briefly held on a review step before automatic rollback + Paula message (low-effort path). */
  lowEffortRollbackAfter?: string | null;
  lowEffortReturnStage?: ApplicationStage | null;
  notionTeamMemberPageUrl?: string;
  /** Raw Notion page UUID (no hyphens). Set by the picker; used by Chronos to filter the team directory. */
  notionTeamMemberId?: string | null;
  /** Last time this user was active in the Chronos time-tracking platform (users.updated_at proxy). Null if no Chronos account. */
  chronosLastActiveAt?: string | null;
}

export interface ConversationMessage {
  id: string;
  applicantId: string;
  author: 'applicant' | 'paula' | 'john' | 'oliver';
  text: string;
  createdAt: string;
}

export interface StageStep {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  applicantAction: string;
  adminAction: string;
}

export const demoApplicants: ApplicantProfile[] = [
  {
    id: 'lead-001',
    email: 'ava.ross@example.com',
    password: 'preview123',
    role: 'applicant',
    firstName: 'Ava',
    lastName: 'Ross',
    phoneNumber: '+33 6 44 92 65 18',
    country: 'France',
    stateRegion: 'Île-de-France',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    linkedinUrl: 'https://www.linkedin.com/in/ava-ross/',
    education: 'Master in AI and Robotics',
    source: 'LinkedIn',
    referralName: '',
    cvFileName: 'ava-ross-cv.pdf',
    roleAppliedFor: 'AI Product Intern',
    stage: 'before_meeting',
    status: 'applying',
    joinedAt: '2026-04-06T09:10:00.000Z',
    lastVisitedAt: '2026-04-11T17:20:00.000Z',
    notes: 'Strong motivation, asked detailed questions.',
    safeSendersConfirmed: true,
    communicationConsent: true,
  },
  {
    id: 'lead-002',
    email: 'liam.carter@example.com',
    password: 'preview123',
    role: 'applicant',
    firstName: 'Liam',
    lastName: 'Carter',
    phoneNumber: '+34 600 100 200',
    country: 'Spain',
    stateRegion: 'Catalonia',
    city: 'Barcelona',
    latitude: 41.3874,
    longitude: 2.1686,
    linkedinUrl: 'https://www.linkedin.com/in/liam-carter/',
    education: 'BSc Computer Science',
    source: 'University newsletter',
    cvFileName: 'liam-carter-cv.pdf',
    roleAppliedFor: 'Robotics Research Intern',
    stage: 'agreement_signed',
    status: 'signed',
    joinedAt: '2026-03-28T14:10:00.000Z',
    lastVisitedAt: '2026-04-11T15:40:00.000Z',
    safeSendersConfirmed: true,
    communicationConsent: true,
  },
  {
    id: 'admin-001',
    email: 'hr@flolabsinnovations.com',
    password: 'preview123',
    role: 'admin',
    hrBinaryRole: true,
    firstName: 'Paula',
    lastName: 'Ferry',
    phoneNumber: '+33 1 00 00 00 00',
    country: 'France',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    linkedinUrl: 'https://www.linkedin.com/in/paula-ferry/',
    education: 'HR Operations',
    source: 'Internal',
    roleAppliedFor: 'HR Admin',
    stage: 'chronos_synced',
    status: 'approved',
    joinedAt: '2026-01-15T10:00:00.000Z',
    lastVisitedAt: '2026-04-11T17:45:00.000Z',
    safeSendersConfirmed: true,
    communicationConsent: true,
  },
];

export const demoConversations: ConversationMessage[] = [
  {
    id: 'msg-1',
    applicantId: 'lead-001',
    author: 'paula',
    text: 'Hi Ava, welcome. You are currently in the meeting recordings step. On the right you can see your next action, and here you can ask me anything about the process.',
    createdAt: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'msg-2',
    applicantId: 'lead-001',
    author: 'applicant',
    text: 'Do I need to finish every recording before moving forward?',
    createdAt: '2026-04-10T10:30:00.000Z',
  },
  {
    id: 'msg-3',
    applicantId: 'lead-001',
    author: 'paula',
    text: 'Yes, please go through the full recordings before submitting the form. The answers should reference specific things you noticed in the material.',
    createdAt: '2026-04-10T10:31:00.000Z',
  },
  {
    id: 'msg-4',
    applicantId: 'lead-002',
    author: 'john',
    text: 'Agreement received, thank you. We will now prepare your onboarding and Chronos access.',
    createdAt: '2026-04-09T08:00:00.000Z',
  },
];
