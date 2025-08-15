import { Briefcase, Calendar, BookCheck, Hand } from 'lucide-react';
import { Role } from '@shared/types/business';
import AchievementsList from './AchievementsList';

interface RoleItemProps {
  role: Role;
}

const RoleItem = ({ role }: RoleItemProps) => {
  const formatYear = (year: string) => year === 'unknown' ? 'TBD' : year;
  
  return (
    <div className="space-y-4">
      {/* Role Header Row */}
      <div className="flex gap-6">
        <div className="flex-shrink-0 w-8 flex justify-center items-start pt-1">
          <Briefcase className="w-7 h-7 p-1 text-secondary" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-headline font-medium text-primary">{role.title}</h2>
              <div className="text-body text-secondary">{role.company}</div>
            </div>
            <div className="flex items-center gap-2 text-body text-secondary">
              <Calendar className="w-4 h-4" />
              <span>
                {formatYear(role.start_year)} - {formatYear(role.end_year)}
              </span>
            </div>
          </div>
          {role.experience && role.experience !== 'unknown' && (
            <p className="text-body text-secondary leading-relaxed">{role.experience}</p>
          )}
        </div>
      </div>

      {/* Project Rows */}
      {role.projects && role.projects.length > 0 && role.projects.map((project, idx) => (
        <div key={idx} className="flex gap-6">
          <div className="flex-shrink-0 w-8 flex justify-center items-start pt-1">
            <BookCheck className="w-7 h-7 p-1 text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-body-lg font-medium text-primary mb-1">{project.name}</h3>
            <div className="text-body text-secondary mb-2">{project.goal}</div>
            <AchievementsList achievements={project.achievements || []} />
          </div>
        </div>
      ))}

      {/* Skills Row */}
      {role.skills && role.skills.length > 0 && (
        <div className="flex gap-6">
          <div className="flex-shrink-0 w-8 flex justify-center items-start pt-1">
            <Hand className="w-7 h-7 p-1 text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-body-lg font-medium text-primary mb-2">Skills</h3>
            <div className="text-body text-secondary">
              {role.skills.join(' • ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleItem;