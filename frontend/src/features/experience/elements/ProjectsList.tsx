import { Project } from '@shared/types/business';
import AchievementsList from './AchievementsList';

interface ProjectsListProps {
  projects: Project[];
}

const ProjectsList = ({ projects }: ProjectsListProps) => {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="space-y-4">
        {projects.map((proj, idx) => (
          <div key={idx}>
            <h3 className="text-body-lg font-medium text-primary mb-1">{proj.name}</h3>
            <div className="text-body text-secondary mb-2">{proj.goal}</div>
            <AchievementsList achievements={proj.achievements || []} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsList;