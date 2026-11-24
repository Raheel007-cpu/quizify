import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { startQuizAttempt } from '../../services/attemptService';

function StartQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const begin = async () => {
      try {
        const res = await startQuizAttempt(Number(id));
        navigate(`/quiz/${res.data.attempt.id}`, {
          replace: true,
          state: { initialData: res.data },
        });
      } catch (err) {
        setError(err.message || 'Could not start this quiz.');
      }
    };

    begin();
  }, [id, navigate]);

  if (error) {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '3rem auto',
          padding: '2rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '0.6rem' }}>
          Unable to Start Quiz
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          {error}
        </p>
        <Link
          to={`/quizzes/${id}`}
          style={{ color: 'var(--color-primary)', fontWeight: 600 }}
        >
          &larr; Back to Quiz Details
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <LoadingSpinner label="Preparing your randomized quiz questions..." />
    </div>
  );
}

export default StartQuizPage;
