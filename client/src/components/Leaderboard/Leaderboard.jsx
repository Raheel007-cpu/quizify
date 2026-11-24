import styles from './Leaderboard.module.css';

const RANK_BADGES = {
  1: styles.rankGold,
  2: styles.rankSilver,
  3: styles.rankBronze,
};

function Leaderboard({ rankings = [], emptyMessage = 'No scores recorded yet.' }) {
  if (rankings.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Quizzes Completed</th>
            <th>Passed</th>
            <th>Avg Score</th>
            <th className={styles.alignRight}>Points</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((row) => (
            <tr
              key={row.userId}
              className={row.isCurrentUser ? styles.currentUserRow : ''}
            >
              <td>
                <span
                  className={`${styles.rankPill} ${
                    RANK_BADGES[row.rank] || styles.rankDefault
                  }`}
                >
                  #{row.rank}
                </span>
              </td>
              <td>
                <div className={styles.userCell}>
                  <strong>{row.name}</strong>
                  {row.isCurrentUser && (
                    <span className={styles.youTag}>You</span>
                  )}
                </div>
              </td>
              <td>{row.quizzesCompleted}</td>
              <td>{row.quizzesPassed}</td>
              <td>{row.averagePercentage}%</td>
              <td className={`${styles.alignRight} ${styles.pointsCell}`}>
                {row.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
