import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthUser } from '../../src/services/auth';
import {
  fetchDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
  DeadlineDto,
} from '../../src/services/deadlines';
import { colors, theme } from '../../src/theme';
import dayjs from 'dayjs';

export default function DeadlinesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deadlines, setDeadlines] = useState<DeadlineDto[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'ongoing'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<DeadlineDto | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const user = await getAuthUser();
      if (!user?.id) return;

      const statusParam = filter === 'all' ? undefined : filter;
      const data = await fetchDeadlines(user.id, statusParam);
      // Filter out exam deadlines (only show regular deadlines)
      const regularDeadlines = data.filter((d) => !d.isExam);
      setDeadlines(regularDeadlines);
    } catch (error) {
      console.error('Load deadlines error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAdd = () => {
    setEditingDeadline(null);
    setFormTitle('');
    setFormNote('');
    setFormEndDate('');
    setIsModalVisible(true);
  };

  const handleEdit = (deadline: DeadlineDto) => {
    setEditingDeadline(deadline);
    setFormTitle(deadline.title);
    setFormNote(deadline.note || '');
    setFormEndDate(deadline.endAt ? dayjs(deadline.endAt).format('YYYY-MM-DDTHH:mm') : '');
    setIsModalVisible(true);
  };

  const handleDelete = (deadline: DeadlineDto) => {
    Alert.alert(
      'Xóa deadline',
      `Bạn có chắc chắn muốn xóa "${deadline.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await getAuthUser();
              if (!user?.id) return;
              await deleteDeadline(user.id, deadline._id);
              await loadData();
              Alert.alert('Thành công', 'Đã xóa deadline');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa deadline');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }

    try {
      const user = await getAuthUser();
      if (!user?.id) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      const payload: any = {
        title: formTitle.trim(),
        note: formNote.trim() || undefined,
      };

      if (formEndDate) {
        payload.endAt = new Date(formEndDate).toISOString();
      }

      if (editingDeadline) {
        await updateDeadline(user.id, editingDeadline._id, payload);
        Alert.alert('Thành công', 'Đã cập nhật deadline');
      } else {
        await createDeadline(user.id, payload);
        Alert.alert('Thành công', 'Đã tạo deadline mới');
      }

      setIsModalVisible(false);
      await loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu deadline');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'overdue':
        return colors.error;
      case 'ongoing':
        return colors.brandOrange;
      default:
        return colors.textMuted;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brandOrange} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'ongoing' && styles.filterActive]}
              onPress={() => setFilter('ongoing')}
            >
              <Text style={[styles.filterText, filter === 'ongoing' && styles.filterTextActive]}>
                Đang diễn ra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'upcoming' && styles.filterActive]}
              onPress={() => setFilter('upcoming')}
            >
              <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
                Sắp tới
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'overdue' && styles.filterActive]}
              onPress={() => setFilter('overdue')}
            >
              <Text style={[styles.filterText, filter === 'overdue' && styles.filterTextActive]}>
                Quá hạn
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />
          }
        >
          <View style={styles.content}>
            {deadlines.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>Không có deadline</Text>
              </View>
            ) : (
              deadlines.map((deadline) => (
                <View key={deadline._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{deadline.title}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(deadline.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {deadline.status === 'upcoming'
                          ? 'Sắp tới'
                          : deadline.status === 'overdue'
                          ? 'Quá hạn'
                          : deadline.status === 'completed'
                          ? 'Hoàn thành'
                          : 'Đang diễn ra'}
                      </Text>
                    </View>
                  </View>
                  {deadline.courseCode && (
                    <View style={styles.courseCodeContainer}>
                      <Text style={styles.courseCode}>{deadline.courseCode}</Text>
                    </View>
                  )}
                  <View style={styles.dateRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.dateText}>Hạn: {formatDate(deadline.endAt)}</Text>
                  </View>
                  {deadline.note && <Text style={styles.note}>{deadline.note}</Text>}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(deadline)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.brandOrange} />
                      <Text style={styles.actionButtonText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(deadline)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDeadline ? 'Sửa deadline' : 'Thêm deadline mới'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tiêu đề *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Nhập tiêu đề deadline"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hạn chót</Text>
                <TextInput
                  style={styles.formInput}
                  value={formEndDate}
                  onChangeText={setFormEndDate}
                  placeholder="YYYY-MM-DDTHH:mm (ví dụ: 2024-12-31T23:59)"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.formHint}>
                  Định dạng: YYYY-MM-DDTHH:mm (ví dụ: 2024-12-31T23:59)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formNote}
                  onChangeText={setFormNote}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.surfaceMuted,
  },
  filterActive: {
    backgroundColor: colors.brandOrange,
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  addButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: colors.brandNavy,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textInverse,
    fontWeight: '700',
  },
  courseCodeContainer: {
    marginBottom: theme.spacing.sm,
  },
  courseCode: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  note: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.surfaceMuted,
  },
  deleteButton: {
    backgroundColor: colors.error + '15',
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: colors.brandOrange,
  },
  deleteButtonText: {
    color: colors.error,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: colors.textMuted,
    marginTop: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    marginBottom: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  formTextArea: {
    height: 100,
  },
  formHint: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surfaceMuted,
  },
  modalButtonSave: {
    backgroundColor: colors.brandOrange,
  },
  modalButtonCancelText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalButtonSaveText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
