// Calendar screen — month view with driver indicators, tap day to see details

import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useGroup } from '../../src/context/GroupContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Islamic green palette
const DRIVER_COLORS = ['#1B5E20', '#00695C', '#283593', '#E65100', '#4A148C', '#BF360C'];

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeGroup, loading, driveDays, groups, setActiveGroupId } = useGroup();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const driverColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const members = activeGroup?.members || [];
    members.forEach((m, i) => {
      map[m.uid] = DRIVER_COLORS[i % DRIVER_COLORS.length];
    });
    return map;
  }, [activeGroup]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const driveDayMap = useMemo(() => {
    const map: Record<string, { driverUid: string; driverName: string }> = {};
    driveDays.forEach((d) => {
      if (d.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)) {
        const day = parseInt(d.date.split('-')[2], 10);
        map[day] = { driverUid: d.driverUid, driverName: d.driverName };
      }
    });
    return map;
  }, [driveDays, currentMonth, currentYear]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = useCallback((day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    router.push(`/day/${dateStr}`);
  }, [currentMonth, currentYear, router]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  // No active group
  if (!activeGroup) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={styles.emptyIcon}>🚗</Text>
        <Text style={styles.emptyTitle}>No Carpool Group Yet</Text>
        <Text style={styles.emptyText}>Create or join a group to start scheduling carpools</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/(tabs)/groups')}
        >
          <Text style={styles.emptyBtnText}>Go to Groups</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Muslim Carpool</Text>
        <Text style={styles.groupName}>{activeGroup.name}</Text>
      </View>

      {/* Group selector */}
      {groups.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupSelector}>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupChip, g.id === activeGroup.id && styles.groupChipActive]}
              onPress={() => setActiveGroupId(g.id)}
            >
              <Text style={[styles.groupChipText, g.id === activeGroup.id && styles.groupChipTextActive]}>
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaderRow}>
        {DAYS.map((d) => (
          <Text key={d} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <View key={idx} style={styles.emptyCell} />;
          }
          const driver = driveDayMap[day];
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isMyDay = driver && user && driver.driverUid === user.uid;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                driver && { backgroundColor: (driverColorMap[driver.driverUid] || '#1B5E20') + '20' },
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[
                styles.dayNumber,
                isToday && styles.todayNumber,
              ]}>{day}</Text>
              {driver && (
                <View style={[styles.driverDot, { backgroundColor: driverColorMap[driver.driverUid] || '#1B5E20' }]} />
              )}
              {isMyDay && (
                <Text style={styles.myDayBadge}>You</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Drivers:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {activeGroup.members.map((m) => (
            <View key={m.uid} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: driverColorMap[m.uid] || '#1B5E20' }]} />
              <Text style={styles.legendText}>{m.name}{user && m.uid === user.uid ? ' (You)' : ''}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1B5E20' },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  groupName: { fontSize: 14, color: '#C8E6C9', marginTop: 2 },
  groupSelector: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  groupChipActive: { backgroundColor: '#1B5E20' },
  groupChipText: { fontSize: 13, color: '#666' },
  groupChipTextActive: { color: '#fff', fontWeight: '600' },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navBtnText: { fontSize: 28, color: '#1B5E20' },
  monthTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  dayHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  emptyCell: { width: '14.28%', aspectRatio: 1 },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 1,
    position: 'relative',
  },
  todayCell: { borderWidth: 2, borderColor: '#1B5E20' },
  dayNumber: { fontSize: 15, color: '#333' },
  todayNumber: { fontWeight: 'bold', color: '#1B5E20' },
  driverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  myDayBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1B5E20',
    position: 'absolute',
    bottom: 2,
  },
  legend: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 10,
  },
  legendTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginVertical: 2 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 13, color: '#333' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: '#1B5E20', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});