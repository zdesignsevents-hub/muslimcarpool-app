// Profile screen — user info, demo badge, sign out

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useGroup } from '../../src/context/GroupContext';
import { isDemoMode } from '../../src/utils/demoMode';
import { isFirebaseConfigured } from '../../src/firebase/config';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logOut } = useAuth();
  const { activeGroup, groups, driveDays, getDriverStats } = useGroup();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logOut();
            // Root layout's useEffect will redirect to login
          },
        },
      ]
    );
  };

  const myStats = getDriverStats().find((s) => user && s.uid === user.uid);
  const myDays = myStats?.count || 0;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {isDemoMode() && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>📱 DEMO MODE</Text>
          </View>
        )}
      </View>

      {/* My stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Carpool Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{myDays}</Text>
            <Text style={styles.statLabel}>Days Driven</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{groups.length}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{driveDays.length}</Text>
            <Text style={styles.statLabel}>Total Group Days</Text>
          </View>
        </View>
      </View>

      {/* Active group info */}
      {activeGroup && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Group</Text>
          <Text style={styles.groupName}>{activeGroup.name}</Text>
          <Text style={styles.groupInfo}>Invite Code: {activeGroup.inviteCode}</Text>
          <Text style={styles.groupInfo}>{activeGroup.members.length} members</Text>
        </View>
      )}

      {/* Firebase status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isFirebaseConfigured() ? styles.statusDotOk : styles.statusDotOff]} />
          <Text style={styles.statusText}>
            {isFirebaseConfigured()
              ? 'Firebase connected ✓'
              : 'Firebase not configured — using demo mode only'}
          </Text>
        </View>
        {!isFirebaseConfigured() && (
          <Text style={styles.setupHint}>
            Add your Firebase credentials in src/firebase/config.ts to enable authentication, real-time sync, and media uploads.
          </Text>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Muslim Carpool v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 14, color: '#C8E6C9', marginTop: 4 },
  demoBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  demoBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginBottom: 12, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' },
  groupName: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  groupInfo: { fontSize: 13, color: '#666', marginBottom: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusDotOk: { backgroundColor: '#4CAF50' },
  statusDotOff: { backgroundColor: '#FF9800' },
  statusText: { fontSize: 14, color: '#333' },
  setupHint: { fontSize: 12, color: '#999', marginTop: 8, lineHeight: 18 },
  signOutBtn: {
    marginHorizontal: 12,
    marginTop: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutBtnText: { color: '#C62828', fontSize: 16, fontWeight: '600' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 20 },
});