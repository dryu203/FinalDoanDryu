import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../../src/components/Card';
import { getAuthUser } from '../../src/services/auth';
import { fetchResultsMeta } from '../../src/services/results';
import { fetchCurriculumDoc } from '../../src/services/curriculum';
import { colors, theme } from '../../src/theme';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpa, setGpa] = useState<number | null>(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [specialization, setSpecialization] = useState<'dev' | 'design'>('dev');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getAuthUser();
      if (!user?.id) return;

      const [results, curriculum] = await Promise.all([
        fetchResultsMeta(user.id),
        fetchCurriculumDoc(specialization),
      ]);

      if (results.specialization) {
        setSpecialization(results.specialization);
      }

      // Calculate GPA and credits from stats or results
      if (results.stats?.cumGpa4) {
        const gpaValues = Object.values(results.stats.cumGpa4);
        if (gpaValues.length > 0) {
          setGpa(gpaValues[gpaValues.length - 1] as number);
        }
      }

      // Calculate total credits from curriculum
      // Use totals if available, otherwise calculate from semesters
      const credits = curriculum.totals?.totalCreditsCounted || 
        curriculum.semesters.reduce((sum, sem) => 
          sum + sem.courses.reduce((s, c) => s + (c.countInCredits !== false ? c.credit : 0), 0), 0
        );
      setTotalCredits(credits);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brandOrange} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tổng quan</Text>
      </View>

      <View style={styles.gpaCard}>
        <View style={styles.gpaHeader}>
          <Text style={styles.gpaLabel}>GPA Tích lũy</Text>
          <View style={styles.gpaPill}>
            <Text style={styles.gpaPillText}>
              {gpa !== null ? gpa.toFixed(2) : '--'}
            </Text>
          </View>
        </View>
        <Text style={styles.gpaSubtext}>Hệ 4.0</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tín chỉ</Text>
          <Text style={styles.statValue}>{totalCredits}</Text>
          <Text style={styles.statSubtext}>đã tích lũy</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Chuyên ngành</Text>
          <Text style={styles.statValue}>
            {specialization === 'dev' ? 'Dev' : 'Design'}
          </Text>
          <Text style={styles.statSubtext}>
            {specialization === 'dev' ? 'Phát triển ứng dụng' : 'Thiết kế ĐPT'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gpaCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  gpaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  gpaLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  gpaPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.chipOrange.bg,
    borderWidth: 1,
    borderColor: colors.chipOrange.border,
  },
  gpaPillText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: colors.chipOrange.text,
  },
  gpaSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
  },
});

