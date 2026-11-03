// Groups screen — create, join, view carpool groups

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useGroup } from '../../src/context/GroupContext';
import { isDemoMode } from '../../src/utils/demoMode';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { groups, activeGroup, setActiveGroupId, createGroup, joinGroup, loading } = useGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    try {
      await createGroup(newGroupName.trim());
      setShowCreate(false);
      setNewGroupName('');
      Alert.alert('Success', 'Group created! Share the invite code with other parents.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    try {
      await joinGroup(inviteCode.trim());
      setShowJoin(false);
      setInviteCode('');
      Alert.alert('Success', 'Joined group!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Carpool Groups</Text>
        <Text style={styles.subtitle}>Create or join a group</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1B5E20' }]} onPress={() => setShowCreate(true)}>
          <Text style={styles.actionBtnText}>➕ Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00695C' }]} onPress={() => setShowJoin(true)}>
          <Text style={styles.actionBtnText}>🔑 Join Group</Text>
        </TouchableOpacity>
      </View>

      {/* Groups list */}
      <View style={styles.groupsList}>
        <Text style={styles.listTitle}>Your Groups ({groups.length})</Text>
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create a group or join with an invite code</Text>
          </View>
        ) : (
          groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.groupCard,
                activeGroup?.id === g.id && styles.groupCardActive,
              ]}
              onPress={() => setActiveGroupId(g.id)}
            >
              <View style={styles.groupCardHeader}>
                <Text style={styles.groupName}>{g.name}</Text>
                {activeGroup?.id === g.id && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.groupInvite}>Invite Code: {g.inviteCode}</Text>
              <Text style={styles.groupMembers}>{g.members.length} member{g.members.length !== 1 ? 's' : ''}</Text>
              <View style={styles.memberChips}>
                {g.members.map((m) => (
                  <View key={m.uid} style={styles.memberChip}>
                    <Text style={styles.memberChipText}>{m.name}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group name (e.g., Saturday School Carpool)"
              placeholderTextColor="#999"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowCreate(false); setNewGroupName(''); }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleCreate}
              >
                <Text style={styles.modalBtnConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join modal */}
      <Modal visible={showJoin} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join a Group</Text>
            <Text style={styles.modalHint}>Enter the invite code shared by the group creator</Text>
            <TextInput
              style={[styles.input, { textAlign: 'center', fontSize: 20, letterSpacing: 2 }]}
              placeholder="ENTER CODE"
              placeholderTextColor="#ccc"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowJoin(false); setInviteCode(''); }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleJoin}
              >
                <Text style={styles.modalBtnConfirmText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1B5E20' },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#C8E6C9', marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  groupsList: { paddingHorizontal: 16 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#999', textAlign: 'center' },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  groupCardActive: { borderColor: '#1B5E20', borderWidth: 2 },
  groupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupName: { fontSize: 17, fontWeight: 'bold', color: '#333', flex: 1 },
  activeBadge: { backgroundColor: '#1B5E20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  groupInvite: { fontSize: 13, color: '#666', marginBottom: 4, fontWeight: '500' },
  groupMembers: { fontSize: 13, color: '#999', marginBottom: 8 },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap' },
  memberChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  memberChipText: { fontSize: 12, color: '#1B5E20' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  modalHint: { fontSize: 13, color: '#999', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F0F0F0' },
  modalBtnCancelText: { color: '#666', fontSize: 16, fontWeight: '600' },
  modalBtnConfirm: { backgroundColor: '#1B5E20' },
  modalBtnConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});