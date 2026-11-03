// Demo data — realistic enough to show all app features

export const DEMO_USER = {
  uid: 'demo-me',
  displayName: 'Ahmed Hassan',
  email: 'ahmed@example.com',
};

export interface DemoMember {
  uid: string;
  name: string;
  email: string;
}

export interface DemoGroup {
  id: string;
  name: string;
  inviteCode: string;
  members: DemoMember[];
  createdAt: Date;
}

export const DEMO_GROUPS: DemoGroup[] = [
  {
    id: 'demo-group-1',
    name: 'Saturday School Carpool',
    inviteCode: 'MSAQ42',
    members: [
      { uid: 'demo-me', name: 'Ahmed Hassan', email: 'ahmed@example.com' },
      { uid: 'demo-2', name: 'Fatima Noor', email: 'fatima@example.com' },
      { uid: 'demo-3', name: 'Omar Khalil', email: 'omar@example.com' },
      { uid: 'demo-4', name: 'Aisha Rahman', email: 'aisha@example.com' },
    ],
    createdAt: new Date(2026, 8, 1),
  },
];

export interface DemoDriveDay {
  id: string;
  date: string; // YYYY-MM-DD
  driverUid: string;
  driverName: string;
  groupId: string;
}

// Generate drive days for current month — assign different parents to different weekdays
function getCurrentMonthDriveDays(): DemoDriveDay[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: DemoDriveDay[] = [];

  const drivers = [
    { uid: 'demo-me', name: 'Ahmed Hassan' },
    { uid: 'demo-2', name: 'Fatima Noor' },
    { uid: 'demo-3', name: 'Omar Khalil' },
    { uid: 'demo-4', name: 'Aisha Rahman' },
  ];

  let driverIdx = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    // School days: Saturday and Sunday (weekend Islamic school)
    if (dow === 6 || dow === 0) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const driver = drivers[driverIdx % drivers.length];
      days.push({
        id: `dd-${dateStr}`,
        date: dateStr,
        driverUid: driver.uid,
        driverName: driver.name,
        groupId: 'demo-group-1',
      });
      driverIdx++;
    }
  }
  return days;
}

export const DEMO_DRIVE_DAYS = getCurrentMonthDriveDays();

export interface DemoMedia {
  id: string;
  date: string;
  groupId: string;
  uploaderUid: string;
  uploaderName: string;
  type: 'image' | 'video';
  uri: string;
  caption: string;
  createdAt: Date;
}

export const DEMO_MEDIA: DemoMedia[] = [
  {
    id: 'dm-1',
    date: getCurrentMonthDriveDays()[0]?.date || '',
    groupId: 'demo-group-1',
    uploaderUid: 'demo-2',
    uploaderName: 'Fatima Noor',
    type: 'image',
    uri: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
    caption: 'Kids ready for school! 🚗',
    createdAt: new Date(),
  },
  {
    id: 'dm-2',
    date: getCurrentMonthDriveDays()[1]?.date || '',
    groupId: 'demo-group-1',
    uploaderUid: 'demo-3',
    uploaderName: 'Omar Khalil',
    type: 'image',
    uri: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
    caption: 'Beautiful morning drive ☀️',
    createdAt: new Date(),
  },
];