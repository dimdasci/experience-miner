interface AchievementsListProps {
  achievements: string[];
}

const AchievementsList = ({ achievements }: AchievementsListProps) => {
  if (!achievements || achievements.length === 0) return null;
  
  return (
    <div className="mt-4">
      <div className="text-body font-medium text-primary mb-3">Achievements:</div>
      <ul className="text-body text-secondary space-y-2">
        {achievements.map((achievement, idx) => (
          <li key={idx} className="relative leading-relaxed">
            <span className="absolute -left-4">•</span>
            {achievement}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AchievementsList;