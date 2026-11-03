// Stats screen — carpool day counts per parent, charts

import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useGroup } from '../../src/context/GroupContext';
import { isDemoMode } from '../../src/utils/demoMode';

const COLORS = ['#1B5E20', '#00695C', '#283593', '#E65100', '#4A148C', '#BF360C'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeGroup, loading, getDriverStats, driveDays } = useGroup();
  const { width } = useWindowDimensions();

  const stats = useMemo(() => getDriverStats(), [getDriverStats]);
  const totalDays = driveDays.length;
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999' }}>Loading...</Text>
      </View>
    );
  }

  if (!activeGroup) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Stats Yet</Text>
        <Text style={styles.emptyText}>Join a carpool group to see driver statistics</Text>
      </View>
    );
  }

  // Include members with 0 days
  const fullStats = activeGroup.members.map((m, i) => {
    const found = stats.find((s) => s.uid === m.uid);
    return {
      uid: m.uid,
      name: m.name,
      count: found?.count || 0,
      color: COLORS[i % COLORS.length],
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Driver Statistics</Text>
        <Text style={styles.groupName}>{activeGroup.name}</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{totalDays}</Text>
          <Text style={styles.summaryLabel}>Total Days</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{activeGroup.members.length}</Text>
          <Text style={styles.summaryLabel}>Members</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>
            {totalDays > 0 ? Math.round(totalDays / activeGroup.members.length * 10) / 10 : 0}
          </Text>
          <Text style={styles.summaryLabel}>Avg/Person</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carpool Days per Parent</Text>
        {fullStats.map((s) => {
          const barWidth = (s.count / maxCount) * (width - 100);
          const isMe = user && s.uid === user.uid;
          return (
            <View key={s.uid} style={styles.barRow}>
              <Text style={[styles.barLabel, isMe && styles.barLabelMe]} numberOfLines={1}>
                {s.name}{isMe ? ' (You)' : ''}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: Math.max(barWidth, 4), backgroundColor: s.color }]} />
                <Text style={styles.barCount}>{s.count}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
        {fullStats.map((s, idx) => {
          const medals = ['🥇', '🥈', '🥉'];
          const isMe = user && s.uid === user.uid;
          return (
            <View key={s.uid} style={[styles.rankRow, isMe && styles.rankRowMe]}>
              <Text style={styles.rankMedal}>{idx < 3 ? medals[idx] : `${idx + 1}.`}</Text>
              <View style={[styles.rankAvatar, { backgroundColor: s.color }]}>
                <Text style={styles.rankAvatarText}>{s.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.rankName, isMe && styles.rankNameMe]} numberOfLines={1}>
                {s.name}{isMe ? ' (You)' : ''}
              </Text>
              <Text style={styles.rankCount}>{s.count} {s.count === 1 ? 'day' : 'days'}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1B5E20' },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  groupName: { fontSize: 14, color: '#C8E6C9', marginTop: 2 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 16, gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20' },
  summaryLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  barLabel: { width: 90, fontSize: 13, color: '#333', flexShrink: 1 },
  barLabelMe: { fontWeight: 'bold', color: '#1B5E20' },
  barTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
  },
  barCount: { position: 'absolute', right: 8, fontSize: 13, fontWeight: 'bold', color: '#333' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rankRowMe: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8 },
  rankMedal: { fontSize: 20, width: 36, textAlign: 'center' },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankAvatarText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  rankName: { flex: 1, fontSize: 14, color: '#333' },
  rankNameMe: { fontWeight: 'bold', color: '#1B5E20' },
  rankCount: { fontSize: 13, color: '#666', fontWeight: '600' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' },
});