import { useNavigate } from 'react-router-dom';
import ExperienceUI from '../views/ExperienceUI';
import { useExperienceData } from '../hooks/useExperienceData';

const ExperienceContainer = () => {
  const { data, loading, error } = useExperienceData();
  const navigate = useNavigate();

  const handleRestart = () => {
    navigate('/guide');
  };

  // Export experience data as markdown for download
  const handleExport = () => {
    if (!data) return;
    let md = `# Professional Experience\n\n`;
    // Summary
    if (data.summary?.text) {
      md += `## Professional Summary\n${data.summary.text}\n\n`;
    }
    // Roles
    data.roles.forEach((role) => {
      md += `## Role: ${role.title} at ${role.company}\n`;
      if (role.start_year || role.end_year) {
        md += `*Duration: ${role.start_year} - ${role.end_year}*\n\n`;
      }
      if (role.experience) {
        md += `${role.experience}\n\n`;
      }
      // Projects
      if (role.projects && role.projects.length > 0) {
        md += `### Projects\n`;
        role.projects.forEach(proj => {
          md += `- **${proj.name}**: ${proj.goal}\n`;
          proj.achievements.forEach(ach => {
            md += `  - Achievement: ${ach}\n`;
          });
          md += `\n`;
        });
      }
      // Skills
      if (role.skills && role.skills.length > 0) {
        md += `### Skills\n${role.skills.join(', ')}\n\n`;
      }
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `experience.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ExperienceUI
      data={data}
      loading={loading}
      error={error}
      onRestart={handleRestart}
      onExport={handleExport}
    />
  );
};

export default ExperienceContainer;
