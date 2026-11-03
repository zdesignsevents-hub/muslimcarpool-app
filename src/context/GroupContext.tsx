// GroupContext — manages carpool groups, drive days, and media
// Branches between Firebase and demo mode

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase/config';
import { isDemoMode, onDemoModeActivated } from '../utils/demoMode';
import { DEMO_GROUPS, DEMO_DRIVE_DAYS, DEMO_MEDIA } from '../utils/demoData';
import { useAuth } from './AuthContext';
import type { CarpoolGroup, DriveDay, MediaItem, Member } from '../types';

interface GroupContextType {
  groups: CarpoolGroup[];
  activeGroup: CarpoolGroup | null;
  setActiveGroupId: (id: string) => void;
  loading: boolean;
  createGroup: (name: string) => Promise<string>;
  joinGroup: (inviteCode: string) => Promise<void>;
  driveDays: DriveDay[];
  assignDriver: (date: string, driverUid: string, driverName: string) => Promise<void>;
  unassignDriver: (date: string) => Promise<void>;
  media: MediaItem[];
  uploadMedia: (date: string, uri: string, type: 'image' | 'video', caption: string) => Promise<void>;
  getDayMedia: (date: string) => MediaItem[];
  getDriverStats: () => { uid: string; name: string; count: number }[];
}

const GroupContext = createContext<GroupContextType>({
  groups: [],
  activeGroup: null,
  setActiveGroupId: () => {},
  loading: true,
  createGroup: async () => '',
  joinGroup: async () => {},
  driveDays: [],
  assignDriver: async () => {},
  unassignDriver: async () => {},
  media: [],
  uploadMedia: async () => {},
  getDayMedia: () => [],
  getDriverStats: () => [],
});

export function useGroup(): GroupContextType {
  return useContext(GroupContext);
}

// Module-level state for demo mode (persists across re-renders)
let _demoDriveDays = [...DEMO_DRIVE_DAYS];
let _demoMedia = [...DEMO_MEDIA];
const _demoListeners: Set<() => void> = new Set();
function notifyDemoListeners() { _demoListeners.forEach((fn) => fn()); }

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CarpoolGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [driveDays, setDriveDays] = useState<DriveDay[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;

  // Load groups
  useEffect(() => {
    if (isDemoMode()) {
      setGroups(DEMO_GROUPS as CarpoolGroup[]);
      setActiveGroupId(DEMO_GROUPS[0]?.id || null);
      setLoading(false);
      return;
    }
    if (!isFirebaseConfigured() || !user) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'groups'), where('memberUids', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const result: CarpoolGroup[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        result.push({
          id: docSnap.id,
          name: data.name,
          inviteCode: data.inviteCode,
          memberUids: data.memberUids || [],
          members: data.members || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
      });
      setGroups(result);
      if (result.length > 0 && !activeGroupId) {
        setActiveGroupId(result[0].id);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.uid]);

  // Demo mode listener
  useEffect(() => {
    const unsub = onDemoModeActivated(() => {
      if (isDemoMode()) {
        setGroups(DEMO_GROUPS as CarpoolGroup[]);
        setActiveGroupId(DEMO_GROUPS[0]?.id || null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Load drive days for active group
  useEffect(() => {
    if (!activeGroupId) {
      setDriveDays([]);
      return;
    }
    if (isDemoMode()) {
      setDriveDays(_demoDriveDays.filter((d) => d.groupId === activeGroupId));
      return;
    }
    if (!isFirebaseConfigured()) {
      setDriveDays([]);
      return;
    }
    const q = query(
      collection(db, 'driveDays'),
      where('groupId', '==', activeGroupId)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const result: DriveDay[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        result.push({
          id: docSnap.id,
          date: data.date,
          driverUid: data.driverUid,
          driverName: data.driverName,
          groupId: data.groupId,
          notes: data.notes,
        });
      });
      setDriveDays(result);
    });
    return unsubscribe;
  }, [activeGroupId]); // fixed: removed isDemoMode() from deps — it's a function call that creates new value
  useEffect(() => {
    const listener = () => {
      if (isDemoMode() && activeGroupId) {
        setDriveDays(_demoDriveDays.filter((d) => d.groupId === activeGroupId));
      }
    };
    _demoListeners.add(listener);
    return () => { _demoListeners.delete(listener); };
  }, [activeGroupId]);

  // Load media for active group
  useEffect(() => {
    if (!activeGroupId) {
      setMedia([]);
      return;
    }
    if (isDemoMode()) {
      setMedia(_demoMedia.filter((m) => m.groupId === activeGroupId));
      return;
    }
    if (!isFirebaseConfigured()) {
      setMedia([]);
      return;
    }
    const q = query(
      collection(db, 'media'),
      where('groupId', '==', activeGroupId)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const result: MediaItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        result.push({
          id: docSnap.id,
          date: data.date,
          groupId: data.groupId,
          uploaderUid: data.uploaderUid,
          uploaderName: data.uploaderName,
          type: data.type,
          uri: data.uri,
          caption: data.caption || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
      });
      setMedia(result);
    });
    return unsubscribe;
  }, [activeGroupId]); // fixed: removed isDemoMode() from deps

  // Demo media listener
  useEffect(() => {
    const listener = () => {
      if (isDemoMode() && activeGroupId) {
        setMedia(_demoMedia.filter((m) => m.groupId === activeGroupId));
      }
    };
    _demoListeners.add(listener);
    return () => { _demoListeners.delete(listener); };
  }, [activeGroupId]);

  const createGroup = async (name: string): Promise<string> => {
    const currentUser = user || (isDemoMode() ? { uid: DEMO_GROUPS[0].members[0].uid, displayName: DEMO_GROUPS[0].members[0].name, email: DEMO_GROUPS[0].members[0].email } : null);
    if (!currentUser) throw new Error('Not authenticated');

    if (isDemoMode()) {
      const inviteCode = 'DEMO' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newGroup: CarpoolGroup = {
        id: 'demo-group-' + Date.now(),
        name,
        inviteCode,
        memberUids: [currentUser.uid],
        members: [{ uid: currentUser.uid, name: (currentUser as any).displayName || currentUser.email, email: currentUser.email }],
        createdAt: new Date(),
      };
      setGroups((prev) => [...prev, newGroup]);
      setActiveGroupId(newGroup.id);
      return newGroup.id;
    }

    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const docRef = await addDoc(collection(db, 'groups'), {
      name,
      inviteCode,
      memberUids: [currentUser.uid],
      members: [{ uid: currentUser.uid, name: (currentUser as any).displayName || currentUser.email, email: currentUser.email }],
      createdAt: new Date(),
    });
    setActiveGroupId(docRef.id);
    return docRef.id;
  };

  const joinGroup = async (inviteCode: string): Promise<void> => {
    const currentUser = user || (isDemoMode() ? { uid: DEMO_GROUPS[0].members[0].uid, displayName: DEMO_GROUPS[0].members[0].name, email: DEMO_GROUPS[0].members[0].email } : null);
    if (!currentUser) throw new Error('Not authenticated');

    if (isDemoMode()) {
      const newGroup: CarpoolGroup = {
        id: 'demo-group-' + Date.now(),
        name: 'Joined Carpool Group',
        inviteCode,
        memberUids: [currentUser.uid],
        members: [{ uid: currentUser.uid, name: (currentUser as any).displayName || currentUser.email, email: currentUser.email }],
        createdAt: new Date(),
      };
      setGroups((prev) => [...prev, newGroup]);
      setActiveGroupId(newGroup.id);
      return;
    }

    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid invite code');
    const groupDoc = snap.docs[0];
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      memberUids: [...(groupDoc.data().memberUids || []), currentUser.uid],
      members: [...(groupDoc.data().members || []), { uid: currentUser.uid, name: (currentUser as any).displayName || currentUser.email, email: currentUser.email }],
    });
    setActiveGroupId(groupDoc.id);
  };

  const assignDriver = async (date: string, driverUid: string, driverName: string) => {
    if (!activeGroupId) return;

    if (isDemoMode()) {
      const existing = _demoDriveDays.find((d) => d.date === date && d.groupId === activeGroupId);
      if (existing) {
        existing.driverUid = driverUid;
        existing.driverName = driverName;
      } else {
        _demoDriveDays.push({
          id: `dd-${date}`,
          date,
          driverUid,
          driverName,
          groupId: activeGroupId,
        });
      }
      setDriveDays(_demoDriveDays.filter((d) => d.groupId === activeGroupId));
      notifyDemoListeners();
      return;
    }

    if (!isFirebaseConfigured()) return;
    const existing = driveDays.find((d) => d.date === date && d.groupId === activeGroupId);
    if (existing) {
      await updateDoc(doc(db, 'driveDays', existing.id), { driverUid, driverName });
    } else {
      await addDoc(collection(db, 'driveDays'), {
        date,
        driverUid,
        driverName,
        groupId: activeGroupId,
      });
    }
  };

  const unassignDriver = async (date: string) => {
    if (!activeGroupId) return;

    if (isDemoMode()) {
      _demoDriveDays = _demoDriveDays.filter((d) => !(d.date === date && d.groupId === activeGroupId));
      setDriveDays(_demoDriveDays.filter((d) => d.groupId === activeGroupId));
      notifyDemoListeners();
      return;
    }

    if (!isFirebaseConfigured()) return;
    const existing = driveDays.find((d) => d.date === date && d.groupId === activeGroupId);
    if (existing) {
      await deleteDoc(doc(db, 'driveDays', existing.id));
    }
  };

  const uploadMedia = async (date: string, uri: string, type: 'image' | 'video', caption: string) => {
    const currentUser = user || (isDemoMode() ? { uid: DEMO_GROUPS[0].members[0].uid, displayName: DEMO_GROUPS[0].members[0].name, email: DEMO_GROUPS[0].members[0].email } : null);
    if (!currentUser || !activeGroupId) throw new Error('Not authenticated or no active group');

    if (isDemoMode()) {
      _demoMedia.push({
        id: `dm-${Date.now()}`,
        date,
        groupId: activeGroupId,
        uploaderUid: currentUser.uid,
        uploaderName: (currentUser as any).displayName || currentUser.email,
        type,
        uri,
        caption,
        createdAt: new Date(),
      });
      setMedia(_demoMedia.filter((m) => m.groupId === activeGroupId));
      notifyDemoListeners();
      return;
    }

    if (!isFirebaseConfigured()) return;
    // Upload file to Firebase Storage
    const filename = `media/${activeGroupId}/${date}/${Date.now()}-${type}.${type === 'image' ? 'jpg' : 'mp4'}`;
    const fileRef = storageRef(storage, filename);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(fileRef, blob);
    const downloadUrl = await getDownloadURL(fileRef);

    await addDoc(collection(db, 'media'), {
      date,
      groupId: activeGroupId,
      uploaderUid: currentUser.uid,
      uploaderName: (currentUser as any).displayName || currentUser.email,
      type,
      uri: downloadUrl,
      caption,
      createdAt: new Date(),
    });
  };

  const getDayMedia = useCallback((date: string): MediaItem[] => {
    return media.filter((m) => m.date === date).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [media]);

  const getDriverStats = useCallback(() => {
    const stats: Record<string, { uid: string; name: string; count: number }> = {};
    driveDays.forEach((d) => {
      if (!stats[d.driverUid]) {
        stats[d.driverUid] = { uid: d.driverUid, name: d.driverName, count: 0 };
      }
      stats[d.driverUid].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [driveDays]);

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        setActiveGroupId,
        loading,
        createGroup,
        joinGroup,
        driveDays,
        assignDriver,
        unassignDriver,
        media,
        uploadMedia,
        getDayMedia,
        getDriverStats,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}