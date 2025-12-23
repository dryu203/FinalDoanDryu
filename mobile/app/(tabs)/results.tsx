import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthUser } from '../../src/services/auth';
import { fetchResultsMeta, saveResults, OverrideData } from '../../src/services/results';
import { fetchCurriculum, ProgressData } from '../../src/services/curriculum';
import { colors, theme } from '../../src/theme';
import { letterFrom10, letterTo10, Letter } from '../../src/lib/grading';
import { fourFrom10 } from '../../src/lib/grading';
import { Card } from '../../src/components/Card';

const GRADE_OPTIONS: Letter[] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

export default function ResultsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialization, setSpecialization] = useState<'dev' | 'design'>('dev');
  const [curriculum, setCurriculum] = useState<ProgressData | null>(null);
  const [override, setOverride] = useState<OverrideData | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [editingCourse, setEditingCourse] = useState<{ code: string; semester: string } | null>(null);
  const [editGradeLetter, setEditGradeLetter] = useState<string>('');

  // Merge curriculum with override
  const data: ProgressData | null = useMemo(() => {
    if (!curriculum || !override) return curriculum;
    
    const merged: ProgressData = {
      specialization: curriculum.specialization,
      semesters: curriculum.semesters.map((sem) => {
        const overSem = override[sem.semester] || {};
        return {
          semester: sem.semester,
          courses: sem.courses.map((c) => {
            const ov = overSem[c.code];
            return {
              ...c,
              grade: ov?.grade,
              status: ov?.status,
            };
          }),
        };
      }),
    };
    return merged;
  }, [curriculum, override]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (data && !selectedSemester && data.semesters.length > 0) {
      setSelectedSemester(data.semesters[0].semester);
    }
  }, [data, selectedSemester]);

  const loadData = async () => {
    try {
      const user = await getAuthUser();
      if (!user?.id) return;

      const resultsData = await fetchResultsMeta(user.id);
      const curriculumData = await fetchCurriculum(resultsData.specialization || 'dev');

      setOverride(resultsData.data || {});
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

  const handleEditGrade = (code: string, semester: string) => {
    const overSem = override?.[semester] || {};
    const courseOverride = overSem[code];
    const currentGrade = courseOverride?.grade;
    const currentLetter = currentGrade !== undefined ? letterFrom10(currentGrade) : undefined;
    setEditingCourse({ code, semester });
    setEditGradeLetter(currentLetter || '');
  };

  const handleSaveGrade = async () => {
    if (!editingCourse) return;

    const user = await getAuthUser();
    if (!user?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      const newOverride = { ...(override || {}) };
      if (!newOverride[editingCourse.semester]) {
        newOverride[editingCourse.semester] = {};
      }

      if (editGradeLetter && editGradeLetter !== '') {
        const grade = letterTo10[editGradeLetter as Letter];
        const status = grade >= 4.0 ? 'passed' : 'failed';
        newOverride[editingCourse.semester][editingCourse.code] = {
          ...newOverride[editingCourse.semester][editingCourse.code],
          grade,
          status,
        };
      } else {
        // Xóa điểm
        const existing = newOverride[editingCourse.semester][editingCourse.code];
        if (existing) {
          const { grade: _, status: __, ...rest } = existing;
          if (Object.keys(rest).length > 0) {
            newOverride[editingCourse.semester][editingCourse.code] = rest;
          } else {
            delete newOverride[editingCourse.semester][editingCourse.code];
          }
        }
      }

      await saveResults(user.id, newOverride);
      setOverride(newOverride);
      setEditingCourse(null);
      setEditGradeLetter('');
      Alert.alert('Thành công', 'Đã lưu điểm môn học');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu điểm');
    }
  };

  const selectedSemesterData = data?.semesters.find((s) => s.semester === selectedSemester);

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
        {/* Semester Picker */}
        {data && data.semesters.length > 0 && (
          <View style={styles.semesterPickerContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.semesterPicker}
              contentContainerStyle={styles.semesterPickerContent}
            >
              {data.semesters.map((sem) => (
                <TouchableOpacity
                  key={sem.semester}
                  style={[
                    styles.semesterButton,
                    selectedSemester === sem.semester && styles.semesterButtonActive,
                  ]}
                  onPress={() => setSelectedSemester(sem.semester)}
                >
                  <Text
                    style={[
                      styles.semesterButtonText,
                      selectedSemester === sem.semester && styles.semesterButtonTextActive,
                    ]}
                  >
                    {sem.semester}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />
          }
        >
          <View style={styles.content}>
            {selectedSemesterData ? (
              selectedSemesterData.courses.map((course, index) => {
                const courseOverride = override?.[selectedSemester]?.[course.code];
                const grade = courseOverride?.grade;
                const gradeLetter = grade !== undefined ? letterFrom10(grade) : undefined;
                const grade4 = grade !== undefined ? fourFrom10(grade) : undefined;
                const isPassed = grade !== undefined && grade >= 4.0;

                return (
                  <Card key={course.code} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={styles.courseHeaderLeft}>
                        <Text style={styles.courseCode}>{course.code}</Text>
                        <View style={styles.courseCreditBadge}>
                          <Text style={styles.courseCreditText}>{course.credit} TC</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditGrade(course.code, selectedSemester)}
                      >
                        <Ionicons name="create-outline" size={20} color={colors.brandOrange} />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.courseName} numberOfLines={2}>
                      {course.name}
                    </Text>

                    <View style={styles.gradeSection}>
                      {grade4 !== undefined ? (
                        <View style={styles.gradeContainer}>
                          <View style={styles.gradeMain}>
                            <Text style={styles.gradeValue}>{grade4.toFixed(2)}</Text>
                            <Text style={styles.gradeLabel}>Điểm hệ 4.0</Text>
                          </View>
                          <View style={[styles.gradeLetterBadge, isPassed ? styles.gradeLetterPassed : styles.gradeLetterFailed]}>
                            <Text style={styles.gradeLetterText}>{gradeLetter}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.noGradeContainer}>
                          <Ionicons name="remove-circle-outline" size={24} color={colors.textMuted} />
                          <Text style={styles.noGrade}>Chưa có điểm</Text>
                        </View>
                      )}
                    </View>
                  </Card>
                );
              })
            ) : (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Edit Grade Modal */}
      <Modal
        visible={!!editingCourse}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setEditingCourse(null);
          setEditGradeLetter('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>
                  {editingCourse
                    ? selectedSemesterData?.courses.find((c) => c.code === editingCourse.code)?.code ||
                      editingCourse.code
                    : ''}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  {editingCourse
                    ? selectedSemesterData?.courses.find((c) => c.code === editingCourse.code)?.name ||
                      ''
                    : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setEditingCourse(null);
                  setEditGradeLetter('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Chọn điểm (thang chữ)</Text>
              <View style={styles.gradeOptions}>
                <TouchableOpacity
                  style={[
                    styles.gradeOption,
                    editGradeLetter === '' && styles.gradeOptionSelected,
                  ]}
                  onPress={() => setEditGradeLetter('')}
                >
                  <Ionicons 
                    name="remove-circle-outline" 
                    size={20} 
                    color={editGradeLetter === '' ? colors.textInverse : colors.textMuted} 
                  />
                  <Text
                    style={[
                      styles.gradeOptionText,
                      editGradeLetter === '' && styles.gradeOptionTextSelected,
                    ]}
                  >
                    Chưa có điểm
                  </Text>
                </TouchableOpacity>
                {GRADE_OPTIONS.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={[
                      styles.gradeOption,
                      editGradeLetter === letter && styles.gradeOptionSelected,
                    ]}
                    onPress={() => setEditGradeLetter(letter)}
                  >
                    <Text
                      style={[
                        styles.gradeOptionText,
                        editGradeLetter === letter && styles.gradeOptionTextSelected,
                      ]}
                    >
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setEditingCourse(null);
                  setEditGradeLetter('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveGrade}
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
  semesterPickerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...theme.shadows.sm,
  },
  semesterPicker: {
    flexGrow: 0,
  },
  semesterPickerContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  semesterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    marginRight: theme.spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  semesterButtonActive: {
    backgroundColor: colors.brandOrange,
    ...theme.shadows.sm,
  },
  semesterButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  semesterButtonTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  courseCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  courseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  courseCode: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  courseCreditBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  courseCreditText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  editButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  courseName: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  gradeSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeMain: {
    flex: 1,
  },
  gradeValue: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '800',
    color: colors.brandOrange,
    marginBottom: 4,
  },
  gradeLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  gradeLetterBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  gradeLetterPassed: {
    backgroundColor: colors.success + '20',
    borderWidth: 2,
    borderColor: colors.success,
  },
  gradeLetterFailed: {
    backgroundColor: colors.error + '20',
    borderWidth: 2,
    borderColor: colors.error,
  },
  gradeLetterText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noGradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  noGrade: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
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
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  modalHeaderLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: colors.brandNavy,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    marginBottom: theme.spacing.lg,
  },
  modalLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  gradeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  gradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    justifyContent: 'center',
  },
  gradeOptionSelected: {
    backgroundColor: colors.brandOrange,
    borderColor: colors.brandOrange,
  },
  gradeOptionText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  gradeOptionTextSelected: {
    color: colors.textInverse,
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
