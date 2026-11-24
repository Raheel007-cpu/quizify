import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from '../../components/ChartCard/ChartCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { getAdminAnalytics } from '../../services/analyticsService';
import styles from './AdminPages.module.css';

function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAdminAnalytics();
        if (mounted) {
          setData(res.data);
        }
      } catch (err) {
        if (mounted) {
          showToast(err.message || 'Failed to load admin analytics.', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  if (loading) {
    return <LoadingSpinner label="Loading platform analytics..." />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Analytics</h1>
          <p className={styles.subtitle}>
            User registrations, quiz activity, subject averages, and top
            engagement metrics.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1.1rem',
        }}
      >
        <ChartCard
          title="User Registrations"
          subtitle="Accounts created over time"
          hasData={(data?.userRegistrations?.length || 0) > 0}
          emptyMessage="No user registrations recorded yet."
        >
          <LineChart data={data?.userRegistrations || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="registrations"
              name="Registrations"
              stroke="#4f46e5"
              strokeWidth={2.5}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Quiz Attempts Over Time"
          subtitle="Completed quiz attempts by date"
          hasData={(data?.quizAttemptsOverTime?.length || 0) > 0}
          emptyMessage="No quiz attempts recorded yet."
        >
          <BarChart data={data?.quizAttemptsOverTime || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="attempts"
              name="Attempts"
              fill="#0ea5e9"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Average Score by Subject"
          subtitle="Platform-wide subject performance"
          hasData={(data?.averageScoresBySubject?.length || 0) > 0}
          emptyMessage="No subject attempts recorded yet."
        >
          <BarChart data={data?.averageScoresBySubject || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
            <Bar
              dataKey="averageScore"
              name="Avg Score"
              fill="#16a34a"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Popular Quizzes"
          subtitle="Most attempted quizzes across learners"
          hasData={(data?.popularQuizzes?.length || 0) > 0}
          emptyMessage="No quiz attempts recorded yet."
        >
          <BarChart data={data?.popularQuizzes || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="title"
              width={130}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar
              dataKey="attempts"
              name="Attempts"
              fill="#6366f1"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ChartCard>
      </div>

      <section className={styles.card}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.85rem' }}>
          Most Active Users
        </h2>
        {(data?.mostActiveUsers?.length || 0) === 0 ? (
          <div className={styles.emptyState}>
            No completed user attempts recorded yet.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Completed Attempts</th>
                  <th>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {data.mostActiveUsers.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.attempts}</td>
                    <td>{u.averageScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminAnalyticsPage;

