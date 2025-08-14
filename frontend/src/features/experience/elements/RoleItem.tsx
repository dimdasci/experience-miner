import { Briefcase, Calendar } from 'lucide-react';
import { Role } from '@shared/types/business';
import ProjectsList from './ProjectsList';
import SkillsList from './SkillsList';

interface RoleItemProps {
  role: Role;
}

const RoleItem = ({ role }: RoleItemProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      {/* Role Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">{role.title}</h2>
            <div className="text-lg text-gray-700">{role.company}</div>
          </div>
        </div>
        {(role.start_year !== 'unknown' || role.end_year !== 'unknown') && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {role.start_year !== 'unknown' ? role.start_year : '?'} - {role.end_year !== 'unknown' ? role.end_year : '?'}
            </span>
          </div>
        )}
      </div>

      {/* Role Experience */}
      {role.experience && role.experience !== 'unknown' && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{role.experience}</p>
        </div>
      )}

      {/* Projects Section */}
      <ProjectsList projects={role.projects || []} />

      {/* Skills Section */}
      <SkillsList skills={role.skills || []} />
    </div>
  );
};

export default RoleItem;