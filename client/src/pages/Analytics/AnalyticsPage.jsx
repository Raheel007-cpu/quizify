import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from '../../components/ChartCard/ChartCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import { useToast } from '../../hooks/useToast';
import {
  getAnalyticsOverview,
  getAnalyticsPerformance,
  getAnalyticsSubjects,
} from '../../services/analyticsService';
import styles from './AnalyticsPage.module.css';

const PIE_COLORS = ['#16a34a', '#dc2626', '#d97706'];

function AnalyticsPage() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [ovRes, perfRes, subjRes] = await Promise.all([
          getAnalyticsOverview(),
          getAnalyticsPerformance(),
          getAnalyticsSubjects(),
        ]);
        if (!mounted) return;
        setOverview(ovRes.data);
        setPerformance(perfRes.data);
        setSubjects(subjRes.data.subjects || []);
      } catch (err) {
        if (mounted) {
          showToast(err.message || 'Failed to load analytics.', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const pieData = useMemo(() => {
    return (performance?.answerDistribution || []).filter((d) => d.value > 0);
  }, [performance]);

  const hasDifficultyData = useMemo(() => {
    return (performance?.performanceByDifficulty || []).some(
      (d) => d.attempts > 0
    );
  }, [performance]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Crunching your performance analytics..." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Performance Analytics</h1>
          <p className={styles.subtitle}>
            Track your score progression, subject strengths, and accuracy across
            difficulties.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/reports" className={styles.secondaryBtn}>
            View Reports
          </Link>
          <Link to="/quizzes" className={styles.primaryBtn}>
            Take a Quiz
          </Link>
        </div>
      </div>

      <section className={styles.statsGrid} aria-label="Overall statistics">
        <ScoreCard
          label="Quizzes Attempted"
          value={overview?.totalAttempts ?? 0}
          tone="primary"
        />
        <ScoreCard
          label="Quizzes Passed"
          value={overview?.passedCount ?? 0}
          tone="success"
        />
        <ScoreCard
          label="Quizzes Failed"
          value={overview?.failedCount ?? 0}
          tone="danger"
        />
        <ScoreCard
          label="Average Score"
          value={`${overview?.averageScore ?? 0}%`}
        />
        <ScoreCard
          label="Highest Score"
          value={`${overview?.highestScore ?? 0}%`}
          tone="success"
        />
        <ScoreCard
          label="Questions Answered"
          value={overview?.totalQuestionsAnswered ?? 0}
          subtext={`${overview?.totalCorrect ?? 0} correct`}
        />
      </section>

      <div className={styles.chartsGrid}>
        <ChartCard
          title="Score Over Time"
          subtitle="Percentage achieved per completed attempt"
          hasData={(performance?.scoreOverTime?.length || 0) > 0}
          emptyMessage="Complete a quiz to see your score trend."
        >
          <AreaChart data={performance?.scoreOverTime || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Score']}
              labelFormatter={(_label, payload) =>
                payload?.[0]?.payload?.quizTitle || ''
              }
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#4f46e5"
              fill="#eef2ff"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartCard>

        <ChartCard
          title="Average Score by Subject"
          subtitle="Compare mastery across subjects"
          hasData={subjects.length > 0}
          emptyMessage="Complete quizzes across subjects to compare scores."
        >
          <BarChart data={subjects}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value}%`, 'Avg Score']} />
            <Bar dataKey="averageScore" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Answer Breakdown"
          subtitle="Correct vs Incorrect vs Unanswered questions"
          hasData={pieData.length > 0}
          emptyMessage="No answered questions recorded yet."
        >
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {pieData.map((entry) => {
                const colorIndex =
                  entry.name === 'Correct'
                    ? 0
                    : entry.name === 'Incorrect'
                      ? 1
                      : 2;
                return (
                  <Cell key={entry.name} fill={PIE_COLORS[colorIndex]} />
                );
              })}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Performance by Difficulty"
          subtitle="Average score across Easy, Medium, and Hard quizzes"
          hasData={hasDifficultyData}
          emptyMessage="Complete quizzes to compare difficulty levels."
        >
          <BarChart data={performance?.performanceByDifficulty || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="averageScore"
              name="Avg Score %"
              fill="#4f46e5"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="passRate"
              name="Pass Rate %"
              fill="#16a34a"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>
      </div>

      <ChartCard
        title="Quiz Attempts Over Time"
        subtitle="Daily quiz activity"
        hasData={(performance?.attemptsOverTime?.length || 0) > 0}
        emptyMessage="No quiz attempts recorded yet."
        height={250}
      >
        <BarChart data={performance?.attemptsOverTime || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar
            dataKey="attempts"
            name="Attempts"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ChartCard>
    </div>
  );
}

export default AnalyticsPage;

