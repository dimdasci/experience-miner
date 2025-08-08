interface AchievementsListProps {
  achievements: string[];
}

const AchievementsList = ({ achievements }: AchievementsListProps) => {
  if (!achievements || achievements.length === 0) return null;
  
  return (
    <div>
      <div className="text-xs font-semibold text-orange-700 mb-2">Achievements:</div>
      <ul className="text-sm text-gray-700 space-y-1">
        {achievements.map((achievement, idx) => (
          <li key={idx}>• {achievement}</li>
        ))}
      </ul>
    </div>
  );
};

export default AchievementsList;