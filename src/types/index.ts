// Shared type definitions

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
}

export interface Member {
  uid: string;
  name: string;
  email: string;
}

export interface CarpoolGroup {
  id: string;
  name: string;
  inviteCode: string;
  memberUids: string[];
  members: Member[];
  createdAt: Date;
}

export interface DriveDay {
  id: string;
  date: string; // YYYY-MM-DD
  driverUid: string;
  driverName: string;
  groupId: string;
  notes?: string;
}

export interface MediaItem {
  id: string;
  date: string; // YYYY-MM-DD
  groupId: string;
  uploaderUid: string;
  uploaderName: string;
  type: 'image' | 'video';
  uri: string;
  caption: string;
  createdAt: Date;
}