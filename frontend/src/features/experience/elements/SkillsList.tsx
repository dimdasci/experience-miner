interface SkillsListProps {
  skills: string[];
}

const SkillsList = ({ skills }: SkillsListProps) => {
  if (!skills || skills.length === 0) return null;

  return (
    <div>
      <h3 className="text-body-lg font-medium text-primary mb-2">Skills</h3>
      <div className="text-body text-secondary">
        {skills.join(' • ')}
      </div>
    </div>
  );
};

export default SkillsList;