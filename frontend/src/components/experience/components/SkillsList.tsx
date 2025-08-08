interface SkillsListProps {
  skills: string[];
}

const SkillsList = ({ skills }: SkillsListProps) => {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, sidx) => (
          <span key={sidx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SkillsList;