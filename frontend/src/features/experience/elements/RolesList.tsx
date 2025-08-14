import { Role } from '@shared/types/business';
import RoleItem from './RoleItem';

interface RolesListProps {
  roles: Role[];
}

const RolesList = ({ roles }: RolesListProps) => {
  if (!roles || roles.length === 0) return null;
  
  return (
    <div className="space-y-6">
      {roles.map((role, i) => (
        <RoleItem key={i} role={role} />
      ))}
    </div>
  );
};

export default RolesList;