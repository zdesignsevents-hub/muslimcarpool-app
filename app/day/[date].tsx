// Day Detail screen — shows/assigns driver, media gallery, upload images/videos

import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
// expo-video VideoView is used for playback — we use a simplified display for thumbnails
import { useAuth } from '../../src/context/AuthContext';
import { useGroup } from '../../src/context/GroupContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / NUM_COLUMNS);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeGroup, driveDays, assignDriver, unassignDriver, getDayMedia, uploadMedia } = useGroup();

  const [uploading, setUploading] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const dateObj = useMemo(() => {
    if (!date) return new Date();
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [date]);

  const dateLabel = useMemo(() => {
    return `${DAYS[dateObj.getDay()]}, ${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`;
  }, [dateObj]);

  const currentDriver = useMemo(() => {
    return driveDays.find((d) => d.date === date);
  }, [driveDays, date]);

  const dayMedia = useMemo(() => {
    if (!date) return [];
    return getDayMedia(date);
  }, [getDayMedia, date]);

  const handleAssignMe = async () => {
    if (!user || !activeGroup) return;
    try {
      await assignDriver(date, user.uid, user.displayName);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAssignOther = async (memberUid: string, memberName: string) => {
    try {
      await assignDriver(date, memberUid, memberName);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUnassign = async () => {
    Alert.alert(
      'Remove Driver',
      'Remove the driver assignment for this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => unassignDriver(date) },
      ]
    );
  };

  const pickMedia = async (type: 'image' | 'video') => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert('Permission needed', 'Please grant media library access to upload photos and videos.');
      return;
    }

    try {
      const pickerResult = type === 'image'
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            quality: 0.7,
          });

      if (pickerResult.canceled || !pickerResult.assets?.length) return;

      const asset = pickerResult.assets[0];
      setPendingMedia({ uri: asset.uri, type });
      setCaption('');
      setShowCaptionModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpload = async () => {
    if (!pendingMedia) return;
    setUploading(true);
    try {
      await uploadMedia(date, pendingMedia.uri, pendingMedia.type, caption);
      setShowCaptionModal(false);
      setPendingMedia(null);
      setCaption('');
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!activeGroup) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999' }}>No active group</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Driver section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 Driver</Text>
        {currentDriver ? (
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {currentDriver.driverName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.driverName}>{currentDriver.driverName}</Text>
                {user && currentDriver.driverUid === user.uid && (
                  <Text style={styles.driverBadge}>That's you!</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={handleUnassign} style={styles.unassignBtn}>
              <Text style={styles.unassignBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.noDriver}>No driver assigned yet</Text>
            <TouchableOpacity style={styles.assignMeBtn} onPress={handleAssignMe}>
              <Text style={styles.assignMeBtnText}>✋ I'll drive this day</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assign other member */}
        {!currentDriver && activeGroup.members.length > 1 && (
          <View style={styles.assignOtherContainer}>
            <Text style={styles.assignOtherLabel}>Or assign someone else:</Text>
            {activeGroup.members
              .filter((m) => !user || m.uid !== user.uid)
              .map((m) => (
                <TouchableOpacity
                  key={m.uid}
                  style={styles.memberRow}
                  onPress={() => handleAssignOther(m.uid, m.name)}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.assignArrow}>→</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>

      {/* Media section */}
      <View style={styles.section}>
        <View style={styles.mediaHeader}>
          <Text style={styles.sectionTitle}>📸 Photos & Videos</Text>
          <View style={styles.uploadBtns}>
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#1B5E20' }]} onPress={() => pickMedia('image')}>
              <Text style={styles.uploadBtnText}>📷 Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#00695C' }]} onPress={() => pickMedia('video')}>
              <Text style={styles.uploadBtnText}>🎥 Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {dayMedia.length === 0 ? (
          <View style={styles.emptyMedia}>
            <Text style={styles.emptyMediaIcon}>🖼️</Text>
            <Text style={styles.emptyMediaText}>No photos or videos for this day yet</Text>
            <Text style={styles.emptyMediaSubtext}>Upload moments from the carpool!</Text>
          </View>
        ) : (
          <View style={styles.mediaGrid}>
            {dayMedia.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.mediaCell}
                onPress={() => setSelectedMedia(item.uri)}
              >
                {item.type === 'image' ? (
                  <ExpoImage source={item.uri} style={styles.mediaThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.mediaThumb, { backgroundColor: '#000' }]}>
                    <Text style={styles.videoIcon}>▶</Text>
                  </View>
                )}
                {item.caption ? (
                  <Text style={styles.mediaCaption} numberOfLines={1}>{item.caption}</Text>
                ) : null}
                <Text style={styles.mediaUploader} numberOfLines={1}>{item.uploaderName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Caption modal */}
      <Modal visible={showCaptionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a caption</Text>
            {pendingMedia?.type === 'image' ? (
              <ExpoImage source={pendingMedia.uri} style={styles.modalPreview} contentFit="cover" />
            ) : (
              <View style={[styles.modalPreview, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.videoIcon}>▶</Text>
              </View>
            )}
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowCaptionModal(false); setPendingMedia(null); }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnUpload]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnUploadText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-screen media viewer */}
      <Modal visible={!!selectedMedia} transparent animationType="fade">
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMedia(null)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          {selectedMedia && (
            <ExpoImage
              source={selectedMedia}
              style={styles.fullscreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1B5E20',
  },
  backBtn: { padding: 4 },
  backBtnText: { color: '#fff', fontSize: 16 },
  dateLabel: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  driverName: { fontSize: 16, fontWeight: '600', color: '#333' },
  driverBadge: { fontSize: 12, color: '#1B5E20', fontWeight: '600', marginTop: 2 },
  unassignBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  unassignBtnText: { color: '#C62828', fontSize: 13, fontWeight: '600' },
  noDriver: { fontSize: 14, color: '#999', marginBottom: 12 },
  assignMeBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  assignMeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  assignOtherContainer: { marginTop: 16 },
  assignOtherLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: { color: '#1B5E20', fontSize: 15, fontWeight: 'bold' },
  memberName: { flex: 1, fontSize: 14, color: '#333' },
  assignArrow: { fontSize: 18, color: '#999' },
  mediaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  uploadBtns: { flexDirection: 'row' },
  uploadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyMedia: { alignItems: 'center', paddingVertical: 30 },
  emptyMediaIcon: { fontSize: 48, marginBottom: 8 },
  emptyMediaText: { fontSize: 14, color: '#666', marginBottom: 4 },
  emptyMediaSubtext: { fontSize: 12, color: '#999' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  mediaCell: {
    width: CELL_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadgeText: { color: '#fff', fontSize: 10 },
  videoIcon: { color: '#fff', fontSize: 24 },
  mediaCaption: { fontSize: 11, color: '#333', paddingHorizontal: 4, paddingTop: 4 },
  mediaUploader: { fontSize: 10, color: '#999', paddingHorizontal: 4, paddingBottom: 4 },
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
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  modalPreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    width: '100%',
    marginBottom: 16,
    minHeight: 60,
    color: '#333',
  },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F0F0F0' },
  modalBtnCancelText: { color: '#666', fontSize: 16, fontWeight: '600' },
  modalBtnUpload: { backgroundColor: '#1B5E20' },
  modalBtnUploadText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: { width: '100%', height: '70%' },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 18 },
});