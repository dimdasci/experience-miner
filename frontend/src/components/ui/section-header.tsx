import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-display font-bold text-primary mb-2">{title}</h1>
      {subtitle && <p className="text-body-lg text-secondary">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;