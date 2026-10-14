import {
  type ComponentProps,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  PracticeSession,
  PracticeStats,
  subscribePracticeSessions,
  subscribePracticeStats,
  seedDemoPracticeSessions,
} from "../../services/practiceService";

export default function PracticeHistoryScreen() {
  const {
    user,
  } = useAuth();

  const [
    sessions,
    setSessions,
  ] =
    useState<
      PracticeSession[]
    >([]);

  const [
    stats,
    setStats,
  ] =
    useState<PracticeStats>({
      sessionCount: 0,
      totalSeconds: 0,
      totalMinutes: 0,
      streak: 0,
    });

  const [
    seedingDemo,
    setSeedingDemo,
  ] = useState(false);

  const [
    chartMetric,
    setChartMetric,
  ] = useState<
    "overall" |
    "notes" |
    "timing"
  >("overall");

  async function handleSeedDemo() {
    if (
      !user ||
      seedingDemo
    ) {
      return;
    }

    try {
      setSeedingDemo(true);

      await seedDemoPracticeSessions(
        user.uid
      );
    } catch (error) {
      console.error(
        "Seed demo error:",
        error
      );
    } finally {
      setSeedingDemo(false);
    }
  }

    // =====================================
// AI PROGRESS SUMMARY
// =====================================

const analyzedSessions =
      sessions
        .filter(
          (session) =>
            session.overallScore != null
        )
        .sort(
          (a, b) =>
            a.createdAtMs -
            b.createdAtMs
        );

    const analyzedCount =
      analyzedSessions.length;

const bestScore =
  analyzedCount > 0
    ? Math.max(
        ...analyzedSessions.map(
          (session) =>
            session.overallScore ?? 0
        )
      )
    : null;

const averageOverall =
  analyzedCount > 0
    ? analyzedSessions.reduce(
        (sum, session) =>
          sum +
          (session.overallScore ?? 0),
        0
      ) /
      analyzedCount
    : null;

const averageNoteAccuracy =
  analyzedCount > 0
    ? analyzedSessions.reduce(
        (sum, session) =>
          sum +
          (session.noteAccuracy ?? 0),
        0
      ) /
      analyzedCount
    : null;

const averageTiming =
  analyzedCount > 0
    ? analyzedSessions.reduce(
        (sum, session) =>
          sum +
          (session.timingScore ?? 0),
        0
      ) /
      analyzedCount
    : null;
// =====================================
// PERSONAL BEST / IMPROVEMENT
// =====================================

const latestAnalyzed =
  analyzedCount > 0
    ? analyzedSessions[
        analyzedCount - 1
      ]
    : null;

const previousAnalyzed =
  analyzedCount > 1
    ? analyzedSessions[
        analyzedCount - 2
      ]
    : null;

const latestScore =
  latestAnalyzed?.overallScore ??
  null;

const previousScore =
  previousAnalyzed?.overallScore ??
  null;

const improvement =
  latestScore != null &&
  previousScore != null
    ? latestScore -
      previousScore
    : null;

const previousBest =
  analyzedCount > 1
    ? Math.max(
        ...analyzedSessions
          .slice(
            0,
            -1
          )
          .map(
            (session) =>
              session.overallScore ??
              0
          )
      )
    : null;

const isNewPersonalBest =
  latestScore != null &&
  previousBest != null &&
  latestScore >
    previousBest;

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklySessions = sessions.filter(
    (session) => session.createdAtMs >= startOfWeek.getTime()
  );
  const weeklyAnalyzed = weeklySessions.filter(
    (session) => session.overallScore != null
  );
  const practiceChallengeProgress = Math.min(weeklySessions.length, 3);
  const analyzeChallengeProgress = Math.min(weeklyAnalyzed.length, 2);
  const practiceChallengeDone = practiceChallengeProgress >= 3;
  const analyzeChallengeDone = analyzeChallengeProgress >= 2;
  const scoreChallengeDone = weeklyAnalyzed.some(
    (session) => (session.overallScore ?? 0) >= 70
  );

  const sessionXP = sessions.length * 10;
  const analysisXP = analyzedCount * 15;
  const challengeXP =
    (practiceChallengeDone ? 50 : 0) +
    (analyzeChallengeDone ? 75 : 0) +
    (scoreChallengeDone ? 100 : 0);
  const totalXP = sessionXP + analysisXP + challengeXP;

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeHistory =
      subscribePracticeSessions(
        user.uid,
        setSessions
      );

    const unsubscribeStats =
      subscribePracticeStats(
        user.uid,
        setStats
      );

    return () => {
      unsubscribeHistory();
      unsubscribeStats();
    };
  }, [user?.uid]);

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View>
            <Text
              style={
                styles.title
              }
            >
              Practice History
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Track your progress
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={
            styles.demoButton
          }
          disabled={
            seedingDemo
          }
          onPress={
            handleSeedDemo
          }
        >
          <Ionicons
            name="flask-outline"
            size={17}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.demoButtonText
            }
          >
            {seedingDemo
              ? "Generating..."
              : "Generate Demo Progress"}
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.stats
          }
        >
          <Stat
            value={`${stats.streak}`}
            label="Day Streak"
            icon="flame"
          />

          <Stat
            value={`${stats.totalMinutes}`}
            label="Minutes"
            icon="time"
          />

          <Stat
            value={`${stats.sessionCount}`}
            label="Sessions"
            icon="musical-notes"
          />
        </View>

{/* ================================= */}
{/* PROGRESS SUMMARY                  */}
{/* ================================= */}

<Text
  style={
    styles.sectionTitle
  }
>
  Progress Summary
</Text>

<View
  style={
    styles.progressGrid
  }
>
  <ProgressCard
    label="Best Score"
    value={
      bestScore != null
        ? `${formatScore(
            bestScore
          )}%`
        : "—"
    }
    icon="trophy-outline"
  />

  <ProgressCard
    label="Average Score"
    value={
      averageOverall != null
        ? `${formatScore(
            averageOverall
          )}%`
        : "—"
    }
    icon="stats-chart-outline"
  />

  <ProgressCard
    label="Note Accuracy"
    value={
      averageNoteAccuracy != null
        ? `${formatScore(
            averageNoteAccuracy
          )}%`
        : "—"
    }
    icon="musical-note-outline"
  />

  <ProgressCard
    label="Timing"
    value={
      averageTiming != null
        ? `${formatScore(
            averageTiming
          )}%`
        : "—"
    }
    icon="time-outline"
  />
</View>

<Text
  style={
    styles.analyzedText
  }
>
  {analyzedCount}
  {" / "}
  {stats.sessionCount}
  {" sessions analyzed"}
</Text>

{/* ================================= */}
{/* PROGRESS CHART                    */}
{/* ================================= */}

<Text
  style={
    styles.sectionTitle
  }
>
  Progress Over Time
</Text>

<View
  style={
    styles.metricTabs
  }
>
  <MetricTab
    label="Overall"
    active={
      chartMetric ===
      "overall"
    }
    onPress={() =>
      setChartMetric(
        "overall"
      )
    }
  />

  <MetricTab
    label="Notes"
    active={
      chartMetric ===
      "notes"
    }
    onPress={() =>
      setChartMetric(
        "notes"
      )
    }
  />

  <MetricTab
    label="Timing"
    active={
      chartMetric ===
      "timing"
    }
    onPress={() =>
      setChartMetric(
        "timing"
      )
    }
  />
</View>

{analyzedSessions.length <
2 ? (
  <View
    style={
      styles.chartEmpty
    }
  >
    <Ionicons
      name="stats-chart-outline"
      size={30}
      color="#666"
    />

    <Text
      style={
        styles.chartEmptyText
      }
    >
      Analyze at least 2
      sessions to see progress.
    </Text>
  </View>
) : (
  <ProgressChart
    sessions={
      analyzedSessions
    }
    metric={
      chartMetric
    }
  />
)}

        <Text style={styles.sectionTitle}>
          XP Progress
        </Text>

        <View style={styles.xpCard}>
          <View style={styles.xpIcon}>
            <Ionicons name="flash" size={24} color="#FACC15" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.xpLabel}>Total XP</Text>
            <Text style={styles.xpValue}>{totalXP} XP</Text>
            <Text style={styles.xpBreakdown}>
              {sessionXP} practice
              {" • "}
              {analysisXP} AI
              {" • "}
              {challengeXP} challenges
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Weekly Challenges
        </Text>

        <View style={styles.challengeContainer}>
          <WeeklyChallengeCard
            icon="calendar-outline"
            title="Practice Regularly"
            description="Complete 3 practice sessions this week"
            progress={practiceChallengeProgress}
            target={3}
            xp={50}
            completed={practiceChallengeDone}
          />
          <WeeklyChallengeCard
            icon="sparkles-outline"
            title="Use AI Coach"
            description="Analyze 2 practice sessions"
            progress={analyzeChallengeProgress}
            target={2}
            xp={75}
            completed={analyzeChallengeDone}
          />
          <WeeklyChallengeCard
            icon="trophy-outline"
            title="Score Hunter"
            description="Reach an AI score of 70% or higher"
            progress={scoreChallengeDone ? 1 : 0}
            target={1}
            xp={100}
            completed={scoreChallengeDone}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Achievements
        </Text>

        <View style={styles.achievementCard}>
          <View style={styles.achievementIcon}>
            <Ionicons
              name="trophy-outline"
              size={24}
              color="#A78BFA"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.achievementTitle}>
              Personal Best
            </Text>

            <Text style={styles.achievementValue}>
              {bestScore != null
                ? `${formatScore(bestScore)}%`
                : "—"}
            </Text>

            <Text style={styles.achievementDescription}>
              Highest AI practice score recorded so far.
            </Text>
          </View>
        </View>

        {improvement != null && (
          <View style={styles.improvementCard}>
            <Ionicons
              name={
                improvement >= 0
                  ? "trending-up-outline"
                  : "trending-down-outline"
              }
              size={21}
              color={improvement >= 0 ? "#4ADE80" : "#F87171"}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.improvementTitle}>
                Latest Progress
              </Text>

              <Text
                style={[
                  styles.improvementValue,
                  improvement >= 0
                    ? styles.improvementPositive
                    : styles.improvementNegative,
                ]}
              >
                {improvement >= 0 ? "+" : ""}
                {formatScore(improvement)}%
              </Text>

              <Text style={styles.improvementDescription}>
                Compared with your previous analyzed session.
              </Text>
            </View>
          </View>
        )}

        {isNewPersonalBest && (
          <View style={styles.personalBestBadge}>
            <Ionicons
              name="sparkles"
              size={17}
              color="#FACC15"
            />

            <Text style={styles.personalBestBadgeText}>
              New Personal Best!
            </Text>
          </View>
        )}

        <View style={styles.badgeGrid}>
          <AchievementBadge
            icon="sparkles-outline"
            title="First Analysis"
            unlocked={analyzedCount >= 1}
          />
          <AchievementBadge
            icon="musical-note-outline"
            title="50% Score"
            unlocked={bestScore != null && bestScore >= 50}
          />
          <AchievementBadge
            icon="ribbon-outline"
            title="70% Score"
            unlocked={bestScore != null && bestScore >= 70}
          />
          <AchievementBadge
            icon="trophy-outline"
            title="80% Score"
            unlocked={bestScore != null && bestScore >= 80}
          />
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Recent Practice
        </Text>

        {sessions.length ===
        0 ? (
          <View
            style={
              styles.empty
            }
          >
            <Ionicons
              name="musical-notes-outline"
              size={42}
              color="#666"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No practice yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Start practicing a chord
              or score to build your
              history.
            </Text>
          </View>
        ) : (
          sessions.map(
            (session) => (
              <SessionCard
                key={
                  session.id
                }
                session={
                  session
                }
                onPress={() =>
                  router.push(
                    `/practice-session/${session.id}` as any
                  )
                }
              />
            )
          )
        )}
      </ScrollView>
    </View>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: any;
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
      <Ionicons
        name={icon}
        size={20}
        color="#A78BFA"
      />

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function ProgressCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <View
      style={
        styles.progressCard
      }
    >
      <Ionicons
        name={icon}
        size={19}
        color="#A78BFA"
      />

      <Text
        style={
          styles.progressValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.progressLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function MetricTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.metricTab,
        active &&
          styles.metricTabActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.metricTabText,
          active &&
            styles.metricTabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AchievementBadge({
  icon,
  title,
  unlocked,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  unlocked: boolean;
}) {
  return (
    <View
      style={[
        styles.badgeCard,
        !unlocked && styles.badgeCardLocked,
      ]}
    >
      <Ionicons
        name={unlocked ? icon : "lock-closed-outline"}
        size={20}
        color={unlocked ? "#A78BFA" : "#555"}
      />

      <Text
        style={[
          styles.badgeTitle,
          !unlocked && styles.badgeTitleLocked,
        ]}
      >
        {title}
      </Text>

      <Text style={styles.badgeStatus}>
        {unlocked ? "Unlocked" : "Locked"}
      </Text>
    </View>
  );
}

function WeeklyChallengeCard({
  icon,
  title,
  description,
  progress,
  target,
  xp,
  completed,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  progress: number;
  target: number;
  xp: number;
  completed: boolean;
}) {
  const percentage = Math.min(100, (progress / target) * 100);

  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeTop}>
        <View style={styles.challengeIcon}>
          <Ionicons
            name={completed ? "checkmark" : icon}
            size={19}
            color={completed ? "#4ADE80" : "#A78BFA"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle}>{title}</Text>
          <Text style={styles.challengeDescription}>{description}</Text>
        </View>

        <Text style={styles.challengeXP}>+{xp} XP</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%` },
          ]}
        />
      </View>

      <View style={styles.challengeFooter}>
        <Text style={styles.challengeProgress}>{progress}/{target}</Text>
        <Text
          style={[
            styles.challengeStatus,
            completed && styles.challengeCompleted,
          ]}
        >
          {completed ? "Completed" : "In progress"}
        </Text>
      </View>
    </View>
  );
}

function ProgressChart({
  sessions,
  metric,
}: {
  sessions:
    PracticeSession[];

  metric:
    | "overall"
    | "notes"
    | "timing";
}) {
  const chartHeight = 170;

  function getScore(
    session:
      PracticeSession
  ) {
    if (
      metric === "notes"
    ) {
      return (
        session.noteAccuracy ??
        0
      );
    }

    if (
      metric === "timing"
    ) {
      return (
        session.timingScore ??
        0
      );
    }

    return (
      session.overallScore ??
      0
    );
  }

  return (
    <View
      style={
        styles.chartCard
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.chartContent
        }
      >
        {sessions.map(
          (session) => {
            const score =
              getScore(
                session
              );

            const height =
              Math.max(
                4,
                score /
                  100 *
                  chartHeight
              );

            return (
              <View
                key={
                  session.id
                }
                style={
                  styles.chartColumn
                }
              >
                <Text
                  style={
                    styles.chartValue
                  }
                >
                  {formatScore(
                    score
                  )}%
                </Text>

                <View
                  style={[
                    styles.chartTrack,
                    {
                      height:
                        chartHeight,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={
                    styles.chartDate
                  }
                >
                  {formatChartDate(
                    session.createdAtMs
                  )}
                </Text>
              </View>
            );
          }
        )}
      </ScrollView>
    </View>
  );
}

function SessionCard({
  session,
  onPress,
}: {
  session:
    PracticeSession;
  onPress: () => void;
}) {
  const hasAnalysis =
    session.overallScore != null;

  return (
    <TouchableOpacity
      style={
        styles.sessionCard
      }
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={
          styles.sessionTopRow
        }
      >
        <View
          style={
            styles.sessionIcon
          }
        >
          <Ionicons
            name={
              session.sourceType ===
              "chord"
                ? "grid-outline"
                : "document-text-outline"
            }
            size={23}
            color="#A78BFA"
          />
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.sessionTitle
            }
          >
            {session.title}
          </Text>

          <Text
            style={
              styles.sessionMeta
            }
          >
            {formatMinutes(
              session.durationSeconds
            )}

            {session.bpm
              ? ` • ${session.bpm} BPM`
              : ""}

            {session.selfRating
              ? ` • ⭐ ${session.selfRating}/5`
              : ""}

            {" • "}

            {formatDate(
              session.createdAtMs
            )}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color="#666"
        />
      </View>

      {hasAnalysis ? (
        <View
          style={
            styles.analysisRow
          }
        >
          <SessionScore
            label="Overall"
            value={
              session.overallScore!
            }
          />

          <View
            style={
              styles.scoreDivider
            }
          />

          <SessionScore
            label="Notes"
            value={
              session.noteAccuracy ??
              0
            }
          />

          <View
            style={
              styles.scoreDivider
            }
          />

          <SessionScore
            label="Timing"
            value={
              session.timingScore ??
              0
            }
          />
        </View>
      ) : (
        <View
          style={
            styles.notAnalyzedRow
          }
        >
          <Ionicons
            name="sparkles-outline"
            size={14}
            color="#666"
          />

          <Text
            style={
              styles.notAnalyzedText
            }
          >
            AI analysis not available
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SessionScore({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.scoreItem
      }
    >
      <Text
        style={
          styles.scoreValue
        }
      >
        {formatScore(value)}%
      </Text>

      <Text
        style={
          styles.scoreLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function formatScore(
  score: number
) {
  if (
    Number.isInteger(score)
  ) {
    return String(score);
  }

  return score.toFixed(1);
}

function formatChartDate(
  timestamp: number
) {
  const date =
    new Date(
      timestamp
    );

  return `${date.getDate()}/${
    date.getMonth() + 1
  }`;
}

function formatMinutes(
  seconds: number
) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.round(
    seconds / 60
  )} min`;
}

function formatDate(
  timestamp: number
) {
  return new Date(
    timestamp
  ).toLocaleDateString();
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#0B0B0F",
    },

    content: {
      width: "100%",
      maxWidth: 800,

      alignSelf: "center",

      padding: 24,
      paddingTop: 35,
      paddingBottom: 60,
    },

    header: {
      flexDirection: "row",

      alignItems: "center",

      gap: 13,

      marginBottom: 25,
    },

    backButton: {
      width: 44,
      height: 44,

      borderRadius: 14,

      backgroundColor:
        "#17171D",

      alignItems: "center",
      justifyContent: "center",
    },

    title: {
      color: "#FFFFFF",

      fontSize: 25,

      fontWeight: "bold",
    },

    subtitle: {
      color: "#777",

      fontSize: 11,

      marginTop: 3,
    },

    stats: {
      flexDirection: "row",

      gap: 10,
    },

    stat: {
      flex: 1,

      backgroundColor:
        "#17171D",

      borderRadius: 17,

      alignItems: "center",

      paddingVertical: 17,
    },

    statValue: {
      color: "#FFFFFF",

      fontSize: 20,

      fontWeight: "bold",

      marginTop: 5,
    },

    statLabel: {
      color: "#666",

      fontSize: 9,

      marginTop: 2,
    },

    sectionTitle: {
      color: "#FFFFFF",

      fontSize: 17,

      fontWeight: "bold",

      marginTop: 27,
      marginBottom: 13,
    },

    xpCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "#17171D",
      borderRadius: 17,
      padding: 16,
      borderWidth: 1,
      borderColor: "#3B3216",
    },

    xpIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: "#2A2412",
      alignItems: "center",
      justifyContent: "center",
    },

    xpLabel: {
      color: "#888",
      fontSize: 10,
    },

    xpValue: {
      color: "#FACC15",
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 2,
    },

    xpBreakdown: {
      color: "#666",
      fontSize: 9,
      marginTop: 3,
    },

    challengeContainer: {
      gap: 10,
    },

    challengeCard: {
      backgroundColor: "#17171D",
      borderRadius: 16,
      padding: 15,
    },

    challengeTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    challengeIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "#251B3D",
      alignItems: "center",
      justifyContent: "center",
    },

    challengeTitle: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },

    challengeDescription: {
      color: "#666",
      fontSize: 9,
      marginTop: 3,
    },

    challengeXP: {
      color: "#FACC15",
      fontSize: 10,
      fontWeight: "bold",
    },

    progressTrack: {
      height: 7,
      backgroundColor: "#292930",
      borderRadius: 10,
      marginTop: 14,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor: "#7C3AED",
      borderRadius: 10,
    },

    challengeFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 7,
    },

    challengeProgress: {
      color: "#777",
      fontSize: 9,
    },

    challengeStatus: {
      color: "#777",
      fontSize: 9,
    },

    challengeCompleted: {
      color: "#4ADE80",
      fontWeight: "600",
    },

    achievementCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "#17171D",
      borderRadius: 17,
      padding: 16,
      borderWidth: 1,
      borderColor: "#312747",
    },

    achievementIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: "#251B3D",
      alignItems: "center",
      justifyContent: "center",
    },

    achievementTitle: {
      color: "#AAAAAA",
      fontSize: 10,
    },

    achievementValue: {
      color: "#FFFFFF",
      fontSize: 23,
      fontWeight: "bold",
      marginTop: 2,
    },

    achievementDescription: {
      color: "#666",
      fontSize: 9,
      marginTop: 3,
    },

    improvementCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#17171D",
      borderRadius: 15,
      padding: 14,
      marginTop: 10,
    },

    improvementTitle: {
      color: "#AAAAAA",
      fontSize: 10,
    },

    improvementValue: {
      fontSize: 17,
      fontWeight: "bold",
      marginTop: 2,
    },

    improvementPositive: {
      color: "#4ADE80",
    },

    improvementNegative: {
      color: "#F87171",
    },

    improvementDescription: {
      color: "#666",
      fontSize: 9,
      marginTop: 2,
    },

    personalBestBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: "#2A2412",
      borderRadius: 12,
      paddingVertical: 10,
      marginTop: 10,
    },

    personalBestBadgeText: {
      color: "#FACC15",
      fontSize: 11,
      fontWeight: "bold",
    },

    badgeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 10,
    },

    badgeCard: {
      width: "48%",
      backgroundColor: "#17171D",
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },

    badgeCardLocked: {
      opacity: 0.45,
    },

    badgeTitle: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "600",
      marginTop: 6,
    },

    badgeTitleLocked: {
      color: "#777",
    },

    badgeStatus: {
      color: "#666",
      fontSize: 8,
      marginTop: 3,
    },

    sessionCard: {
      backgroundColor:
        "#17171D",

      borderRadius: 16,

      padding: 14,

      marginBottom: 10,
    },

    sessionIcon: {
      width: 47,
      height: 47,

      borderRadius: 13,

      backgroundColor:
        "#251B3D",

      alignItems: "center",
      justifyContent: "center",
    },

    sessionTitle: {
      color: "#FFFFFF",

      fontSize: 13,

      fontWeight: "bold",
    },

    sessionMeta: {
      color: "#666",

      fontSize: 10,

      marginTop: 5,
    },

    sessionType: {
      color: "#A78BFA",

      fontSize: 9,

      textTransform:
        "uppercase",
    },

    empty: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 50,

      alignItems: "center",
    },

    emptyTitle: {
      color: "#FFFFFF",

      fontWeight: "bold",

      marginTop: 12,
    },

    emptyText: {
      color: "#666",

      fontSize: 11,

      textAlign: "center",

      marginTop: 6,

      lineHeight: 17,
    },

    sessionTopRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,
    },

    analysisRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 14,

      paddingTop: 13,

      borderTopWidth: 1,

      borderTopColor:
        "#292930",
    },

    scoreItem: {
      flex: 1,

      alignItems: "center",
    },

    scoreValue: {
      color: "#FFFFFF",

      fontSize: 15,

      fontWeight: "bold",
    },

    scoreLabel: {
      color: "#666",

      fontSize: 9,

      marginTop: 3,
    },

    scoreDivider: {
      width: 1,

      height: 28,

      backgroundColor:
        "#292930",
    },

    notAnalyzedRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,

      marginTop: 12,

      paddingTop: 11,

      borderTopWidth: 1,

      borderTopColor:
        "#292930",
    },

    notAnalyzedText: {
      color: "#666",

      fontSize: 9,
    },

    progressGrid: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 10,
    },

    progressCard: {
      width: "48%",

      backgroundColor:
        "#17171D",

      borderRadius: 16,

      paddingVertical: 16,

      paddingHorizontal: 14,

      alignItems: "center",
    },

    progressValue: {
      color: "#FFFFFF",

      fontSize: 18,

      fontWeight: "bold",

      marginTop: 6,
    },

    progressLabel: {
      color: "#666",

      fontSize: 9,

      marginTop: 3,
    },

    analyzedText: {
      color: "#666",

      fontSize: 10,

      marginTop: 9,

      textAlign: "right",
    },

    demoButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,

      backgroundColor:
        "#251B3D",

      borderRadius: 13,

      paddingVertical: 11,

      marginBottom: 10,
    },

    demoButtonText: {
      color: "#A78BFA",

      fontSize: 11,

      fontWeight: "bold",
    },

    metricTabs: {
      flexDirection: "row",

      backgroundColor:
        "#17171D",

      borderRadius: 14,

      padding: 4,

      marginBottom: 12,
    },

    metricTab: {
      flex: 1,

      paddingVertical: 9,

      alignItems: "center",

      borderRadius: 10,
    },

    metricTabActive: {
      backgroundColor:
        "#7C3AED",
    },

    metricTabText: {
      color: "#777",

      fontSize: 10,

      fontWeight: "600",
    },

    metricTabTextActive: {
      color: "#FFFFFF",
    },

    chartCard: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 16,
    },

    chartContent: {
      alignItems:
        "flex-end",

      gap: 12,

      paddingRight: 8,
    },

    chartColumn: {
      width: 54,

      alignItems:
        "center",
    },

    chartValue: {
      color: "#BBBBBB",

      fontSize: 9,

      marginBottom: 6,
    },

    chartTrack: {
      width: 30,

      backgroundColor:
        "#222229",

      borderRadius: 7,

      justifyContent:
        "flex-end",

      overflow: "hidden",
    },

    chartBar: {
      width: "100%",

      backgroundColor:
        "#7C3AED",

      borderRadius: 7,
    },

    chartDate: {
      color: "#666",

      fontSize: 9,

      marginTop: 7,
    },

    chartEmpty: {
      backgroundColor:
        "#17171D",

      borderRadius: 18,

      padding: 30,

      alignItems:
        "center",
    },

    chartEmptyText: {
      color: "#666",

      fontSize: 10,

      marginTop: 8,

      textAlign: "center",
    },
  });