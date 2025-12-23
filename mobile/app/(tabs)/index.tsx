import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/Card';
import { getAuthUser } from '../../src/services/auth';
import { fetchResultsMeta, OverrideData } from '../../src/services/results';
import { fetchCurriculumDoc, CurriculumDoc, SemesterData } from '../../src/services/curriculum';
import { fetchDeadlines } from '../../src/services/deadlines';
import { colors, theme } from '../../src/theme';
import { fourFrom10 } from '../../src/lib/grading';

type ProgressData = {
  specialization: 'dev' | 'design';
  semesters: Array<{
    semester: string;
    courses: Array<{
      code: string;
      name: string;
      credit: number;
      grade?: number;
      status?: 'passed' | 'failed' | 'in-progress';
      countInGpa?: boolean;
      countInCredits?: boolean;
    }>;
  }>;
};

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialization, setSpecialization] = useState<'dev' | 'design'>('dev');
  const [curriculum, setCurriculum] = useState<CurriculumDoc | null>(null);
  const [override, setOverride] = useState<OverrideData | null>(null);
  const [deadlineStats, setDeadlineStats] = useState<{ total: number; completed: number; ongoing: number } | null>(null);
  const [failedCoursesOpen, setFailedCoursesOpen] = useState(false);
  const router = useRouter();

  // Merge curriculum with override data
  const data: ProgressData | null = useMemo(() => {
    if (!curriculum || !override) return null;
    
    const merged: ProgressData = {
      specialization: curriculum.specialization as 'dev' | 'design',
      semesters: curriculum.semesters.map((sem) => {
        const overSem = override[sem.semester] || {};
        return {
          semester: sem.semester,
          courses: sem.courses.map((c) => {
            const ov = overSem[c.code];
            return {
              code: c.code,
              name: c.name,
              credit: c.credit,
              grade: ov?.grade,
              status: ov?.status,
              countInGpa: c.countInGpa !== false,
              countInCredits: c.countInCredits !== false,
            };
          }),
        };
      }),
    };
    return merged;
  }, [curriculum, override]);

  // Calculate GPA per semester
  const perSemesterStats = useMemo(() => {
    if (!data) return [];
    return data.semesters.map((sem) => {
      let sumW = 0;
      let sumC = 0;
      for (const c of sem.courses) {
        if (c.countInGpa === false) continue;
        if (c.grade === undefined) continue;
        const g4 = fourFrom10(c.grade);
        if (g4 === undefined) continue;
        sumW += g4 * (c.credit || 0);
        sumC += (c.credit || 0);
      }
      return { sem: sem.semester, gpa4: sumC > 0 ? Number((sumW / sumC).toFixed(2)) : undefined };
    });
  }, [data]);

  // Cumulative GPA (chỉ tính các học phần ĐẠT >= 4.0)
  const cumulativeGpa4 = useMemo(() => {
    const out: (number | undefined)[] = [];
    if (!data) return out;
    let sumW = 0;
    let sumC = 0;
    for (const sem of data.semesters) {
      for (const c of sem.courses) {
        if (c.countInGpa === false) continue;
        if (c.grade === undefined) continue;
        if (c.grade < 4.0) continue; // Chỉ tính các học phần ĐẠT
        const g4 = fourFrom10(c.grade);
        if (g4 === undefined) continue;
        sumW += g4 * (c.credit || 0);
        sumC += (c.credit || 0);
      }
      out.push(sumC > 0 ? Number((sumW / sumC).toFixed(2)) : undefined);
    }
    return out;
  }, [data]);

  const overallCumGpa4 = useMemo(() => {
    return cumulativeGpa4.length ? cumulativeGpa4[cumulativeGpa4.length - 1] : undefined;
  }, [cumulativeGpa4]);

  // Tính tín chỉ đã tích lũy (chỉ tính các môn đã đạt >= 4.0)
  const earnedCredits = useMemo(() => {
    if (!data) return 0;
    let earned = 0;
    for (const sem of data.semesters) {
      for (const c of sem.courses) {
        const countCredit = c.countInCredits !== false;
        if (countCredit) {
          const isPassed = (c.status === 'passed') || (c.grade !== undefined && c.grade >= 4.0);
          if (isPassed) {
            earned += c.credit || 0;
          }
        }
      }
    }
    return earned;
  }, [data]);

  // Failed courses
  const failedCourses = useMemo(() => {
    const out: { code: string; name: string; credit: number; sem: string }[] = [];
    if (!data) return out;
    for (const sem of data.semesters) {
      for (const c of sem.courses) {
        const credit = c.credit || 0;
        const isFailed = (c.status === 'failed') || (c.grade !== undefined && c.grade < 4.0);
        if (isFailed) {
          out.push({ code: c.code, name: c.name, credit, sem: sem.semester });
        }
      }
    }
    return out;
  }, [data]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getAuthUser();
      if (!user?.id) return;

      const [results, deadlines] = await Promise.all([
        fetchResultsMeta(user.id),
        fetchDeadlines(user.id).catch(() => []),
      ]);

      const curriculumData = await fetchCurriculumDoc(results.specialization || 'dev');

      setSpecialization(results.specialization || 'dev');
      setOverride(results.data || {});
      setCurriculum(curriculumData);

      // Calculate deadline stats
      const total = deadlines.length;
      const completed = deadlines.filter((d) => d.status === 'completed').length;
      const ongoing = deadlines.filter((d) => d.status === 'ongoing').length;
      setDeadlineStats({ total, completed, ongoing });
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

  const deadlineProgress = deadlineStats && deadlineStats.total > 0
    ? Math.round((deadlineStats.completed / deadlineStats.total) * 100)
    : 0;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tổng quan</Text>
        </View>

        {/* Overall GPA Card */}
        <View style={styles.gpaCard}>
          <View style={styles.gpaHeader}>
            <Text style={styles.gpaLabel}>GPA Tích lũy</Text>
            <View style={styles.gpaPill}>
              <Text style={styles.gpaPillText}>
                {overallCumGpa4 !== undefined ? overallCumGpa4.toFixed(2) : '--'}
              </Text>
            </View>
          </View>
          <Text style={styles.gpaSubtext}>Hệ 4.0</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tín chỉ</Text>
            <Text style={styles.statValue}>
              {earnedCredits}
            </Text>
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

        {/* GPA Chart Card */}
        {perSemesterStats.length > 0 && (
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>GPA các học kỳ (thang 4)</Text>
            </View>
            <View style={styles.chartContainer}>
              {perSemesterStats.map((stat, idx) => {
                const maxGpa = 4.0;
                const height = stat.gpa4 !== undefined ? (stat.gpa4 / maxGpa) * 120 : 0;
                return (
                  <View key={stat.sem} style={styles.chartBarContainer}>
                    <Text style={styles.chartBarValue}>
                      {stat.gpa4 !== undefined ? stat.gpa4.toFixed(2) : '-'}
                    </Text>
                    <View style={styles.chartBarWrapper}>
                      <View 
                        style={[
                          styles.chartBar,
                          { height: Math.max(6, height) },
                          stat.gpa4 === undefined && styles.chartBarEmpty
                        ]} 
                      />
                    </View>
                    <Text style={styles.chartBarLabel} numberOfLines={1}>
                      {stat.sem}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Failed Courses Card */}
        <Card style={styles.failedCard}>
          <TouchableOpacity 
            style={styles.failedHeader}
            onPress={() => setFailedCoursesOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.failedHeaderLeft}>
              <Text style={styles.failedTitle}>Nợ môn</Text>
              <View style={styles.failedBadge}>
                <Text style={styles.failedBadgeText}>{failedCourses.length} môn</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          {failedCourses.length === 0 ? (
            <Text style={styles.failedEmpty}>Không có nợ môn</Text>
          ) : (
            <View style={styles.failedPreview}>
              {failedCourses.slice(0, 3).map((fc, idx) => (
                <View key={`${fc.sem}-${fc.code}`} style={styles.failedItem}>
                  <Text style={styles.failedCode}>{fc.code}</Text>
                  <Text style={styles.failedName} numberOfLines={1}>{fc.name}</Text>
                  <Text style={styles.failedCredit}>{fc.credit} TC</Text>
                </View>
              ))}
              {failedCourses.length > 3 && (
                <Text style={styles.failedMore}>... và {failedCourses.length - 3} môn khác</Text>
              )}
            </View>
          )}
        </Card>

        {/* Deadline Stats Card */}
        <Card style={styles.deadlineCard}>
          <View style={styles.deadlineHeader}>
            <Ionicons name="notifications-outline" size={24} color={colors.brandOrange} />
            <Text style={styles.deadlineTitle}>Deadline</Text>
          </View>
          {!deadlineStats || deadlineStats.total === 0 ? (
            <Text style={styles.deadlineEmpty}>Chưa có deadline</Text>
          ) : (
            <>
              <View style={styles.deadlineBody}>
                <View style={styles.deadlineProgressWrap}>
                  <View style={styles.deadlineProgressCircle}>
                    <Text style={styles.deadlineProgressPercent}>{deadlineProgress}%</Text>
                    <Text style={styles.deadlineProgressLabel}>Hoàn thành</Text>
                  </View>
                </View>
                <View style={styles.deadlineKPIs}>
                  <View style={styles.deadlineKPI}>
                    <Text style={styles.deadlineKPILabel}>Đang diễn ra</Text>
                    <Text style={[styles.deadlineKPIValue, deadlineStats.ongoing > 0 && styles.deadlineKPIValueActive]}>
                      {deadlineStats.ongoing}
                    </Text>
                  </View>
                  <View style={styles.deadlineKPI}>
                    <Text style={styles.deadlineKPILabel}>Tổng số</Text>
                    <Text style={styles.deadlineKPIValue}>{deadlineStats.total}</Text>
                  </View>
                  <View style={styles.deadlineKPI}>
                    <Text style={styles.deadlineKPILabel}>Đã hoàn thành</Text>
                    <Text style={styles.deadlineKPIValueGradient}>{deadlineStats.completed}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deadlineFooter}
                onPress={() => router.push('/(tabs)/deadlines')}
                activeOpacity={0.7}
              >
                <Text style={styles.deadlineLink}>Quản lý deadline</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brandOrange} />
              </TouchableOpacity>
            </>
          )}
        </Card>
      </ScrollView>

      {/* Failed Courses Modal */}
      <Modal
        visible={failedCoursesOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFailedCoursesOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nợ môn (tất cả các kỳ)</Text>
            <TouchableOpacity onPress={() => setFailedCoursesOpen(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {failedCourses.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>Không có nợ môn</Text>
            </View>
          ) : (
            <FlatList
              data={failedCourses}
              keyExtractor={(item) => `${item.sem}-${item.code}`}
              renderItem={({ item }) => (
                <View style={styles.modalFailedItem}>
                  <View style={styles.modalFailedLeft}>
                    <Text style={styles.modalFailedCode}>{item.code}</Text>
                    <Text style={styles.modalFailedName}>{item.name}</Text>
                  </View>
                  <View style={styles.modalFailedRight}>
                    <Text style={styles.modalFailedCredit}>{item.credit} TC</Text>
                    <Text style={styles.modalFailedSem}>{item.sem}</Text>
                  </View>
                </View>
              )}
              style={styles.modalList}
            />
          )}
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
    marginBottom: theme.spacing.md,
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
  chartCard: {
    marginBottom: theme.spacing.md,
  },
  chartHeader: {
    marginBottom: theme.spacing.md,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    minHeight: 180,
    paddingVertical: theme.spacing.sm,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  chartBarWrapper: {
    width: 28,
    height: 120,
    backgroundColor: '#eef2ff',
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  chartBar: {
    width: '100%',
    backgroundColor: colors.brandNavy,
    minHeight: 6,
  },
  chartBarEmpty: {
    opacity: 0.2,
  },
  chartBarLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  failedCard: {
    marginBottom: theme.spacing.md,
  },
  failedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  failedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  failedTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  failedBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  failedBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textInverse,
  },
  failedEmpty: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
  },
  failedPreview: {
    gap: theme.spacing.xs,
  },
  failedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  failedCode: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: colors.brandNavy,
    minWidth: 60,
  },
  failedName: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: colors.textPrimary,
  },
  failedCredit: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
  },
  failedMore: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  deadlineCard: {
    marginBottom: theme.spacing.md,
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  deadlineTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deadlineEmpty: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
  },
  deadlineBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    minHeight: 100,
  },
  deadlineProgressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineProgressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    borderWidth: 8,
    borderColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadlineProgressPercent: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.brandNavy,
  },
  deadlineProgressLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  deadlineKPIs: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  deadlineKPI: {
    gap: 4,
  },
  deadlineKPILabel: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
  },
  deadlineKPIValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deadlineKPIValueActive: {
    color: colors.brandOrange,
  },
  deadlineKPIValueGradient: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: '#16a34a',
  },
  deadlineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deadlineLink: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: colors.brandOrange,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
  },
  modalList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  modalFailedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  modalFailedLeft: {
    flex: 1,
    gap: 4,
  },
  modalFailedCode: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  modalFailedName: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textPrimary,
  },
  modalFailedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  modalFailedCredit: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modalFailedSem: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
  },
});
