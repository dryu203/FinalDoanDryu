import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getAuthUser } from '../../src/services/auth';
import { fetchResultsMeta } from '../../src/services/results';
import { fetchCurriculum } from '../../src/services/curriculum';
import { colors, theme } from '../../src/theme';

export default function ResultsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialization, setSpecialization] = useState<'dev' | 'design'>('dev');
  const [curriculum, setCurriculum] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const user = await getAuthUser();
      if (!user?.id) return;

      const [resultsData, curriculumData] = await Promise.all([
        fetchResultsMeta(user.id),
        fetchCurriculum(specialization),
      ]);

      setResults(resultsData);
      setCurriculum(curriculumData);
      if (resultsData.specialization) {
        setSpecialization(resultsData.specialization);
      }
    } catch (error) {
      console.error('Load results error:', error);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
    >
      <View style={styles.content}>
        {curriculum?.semesters.map((semester: any) => (
          <View key={semester.semester} style={styles.semesterCard}>
            <Text style={styles.semesterTitle}>{semester.semester}</Text>
            {semester.courses.map((course: any, index: number) => {
              const result = results?.data?.[semester.semester]?.[course.code];
              const grade4 = result?.grade !== undefined ? result.grade / 2.5 : null;
              return (
                <View 
                  key={course.code} 
                  style={[
                    styles.courseRow,
                    index === semester.courses.length - 1 && styles.courseRowLast
                  ]}
                >
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseCode}>{course.code}</Text>
                    <Text style={styles.courseName}>{course.name}</Text>
                  </View>
                  {grade4 !== null ? (
                    <View style={styles.gradeContainer}>
                      <Text style={styles.courseGrade}>
                        {grade4.toFixed(2)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noGrade}>--</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
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
  semesterCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  semesterTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.brandOrange,
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
  },
  courseRowLast: {
    borderBottomWidth: 0,
  },
  courseInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  courseCode: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: colors.brandNavy,
    marginBottom: 2,
  },
  courseName: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  gradeContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  courseGrade: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: colors.brandOrange,
  },
  noGrade: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

