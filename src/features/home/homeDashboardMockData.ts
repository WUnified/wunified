export interface HomeDashboardNotification {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  unread: boolean;
}

export interface HomeDashboardEvent {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  attendeeLabel: string;
}

export interface HomeOrganizationActivity {
  id: string;
  organization: string;
  activity: string;
  timeLabel: string;
  initials: string;
}

// Presentation-only samples for dashboard sections without an API yet.
// Keep these fixtures out of feature API, hook, and database modules.
export const HOME_DASHBOARD_MOCK_NOTIFICATIONS: HomeDashboardNotification[] = [
  {
    id: 'mock-notification-rsvp',
    title: 'Your RSVP is confirmed',
    detail: 'You are on the list for the Shockers Fall Social.',
    timeLabel: '12m ago',
    unread: true,
  },
  {
    id: 'mock-notification-organization',
    title: 'New from Campus Garden Club',
    detail: 'The volunteer signup for Saturday is open.',
    timeLabel: '1h ago',
    unread: true,
  },
  {
    id: 'mock-notification-community',
    title: 'A new campus conversation',
    detail: 'A student shared an update on the community board.',
    timeLabel: 'Yesterday',
    unread: false,
  },
];

export const HOME_DASHBOARD_MOCK_EVENTS: HomeDashboardEvent[] = [
  {
    id: 'mock-event-fall-social',
    title: 'Shockers Fall Social',
    dateLabel: 'NOV 14',
    timeLabel: '4:00 PM',
    location: 'RSC North Patio',
    attendeeLabel: 'Campus community',
  },
  {
    id: 'mock-event-org-fair',
    title: 'Student Organization Fair',
    dateLabel: 'NOV 20',
    timeLabel: '11:00 AM',
    location: 'RSC Beggs Ballroom',
    attendeeLabel: 'Meet campus clubs',
  },
];

export const HOME_DASHBOARD_MOCK_ORGANIZATION_ACTIVITY: HomeOrganizationActivity[] = [
  {
    id: 'mock-organization-garden',
    organization: 'Campus Garden Club',
    activity: 'Shared a harvest-day update',
    timeLabel: '35m ago',
    initials: 'CG',
  },
  {
    id: 'mock-organization-robotics',
    organization: 'WSU Robotics Club',
    activity: 'Posted photos from build night',
    timeLabel: '2h ago',
    initials: 'WR',
  },
];
