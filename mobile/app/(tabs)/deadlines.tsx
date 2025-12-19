import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthUser } from '../../src/services/auth';
import { fetchDeadlines, DeadlineDto } from '../../src/services/deadlines';
import { colors, theme } from '../../src/theme';
import dayjs from 'dayjs';

export default function DeadlinesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deadlines, setDeadlines] = useState<DeadlineDto[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const user = await getAuthUser();
      if (!user?.id) return;

      const data = await fetchDeadlines(
        user.id,
        filter === 'all' ? undefined : filter
      );
      setDeadlines(data);
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
    <View style={styles.container}>
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
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
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
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
});

