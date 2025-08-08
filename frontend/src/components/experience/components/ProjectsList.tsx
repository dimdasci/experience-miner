import { Target } from 'lucide-react';
import { Project } from '../../../types/business';
import AchievementsList from './AchievementsList';

interface ProjectsListProps {
  projects: Project[];
}

const ProjectsList = ({ projects }: ProjectsListProps) => {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-orange-600" />
        <h3 className="font-semibold text-gray-900">Projects</h3>
      </div>
      <div className="space-y-3">
        {projects.map((proj, idx) => (
          <div key={idx} className="p-4 bg-orange-50 rounded">
            <div className="font-medium mb-2">{proj.name}</div>
            <div className="text-sm text-gray-600 mb-3">{proj.goal}</div>
            <AchievementsList achievements={proj.achievements || []} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsList;