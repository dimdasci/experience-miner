import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
  return (
    <div className={cn("mt-12 md:mt-16", className)}>
      <div className="text-center">
        <h1 className="text-display font-bold text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-body-lg text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
};

export default SectionHeader;