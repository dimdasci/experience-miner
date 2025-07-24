import { Button } from '../ui/button';

const ExperiencePage = () => {
  // Mock data for professional summary
  const mockData = {
    professionalSummary: [
      'Experienced software engineer with 8+ years in full-stack development',
      'Led cross-functional teams in delivering scalable web applications'
    ],
    skills: [
      'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'
    ],
    companies: [
      'NNNNN', 'XXXXXX XXX', 'YYYYYY', 'ZZZZZZZZ'
    ],
    roles: [
      {
        title: 'Project Manager',
        company: 'NNNNN',
        period: '02.2023-06.2025',
        achievements: [
          'Led development of customer portal reducing support tickets by 40%',
          'Implemented CI/CD pipeline improving deployment frequency by 300%',
          'Mentored 5 junior developers in modern web development practices'
        ]
      }
    ],
    projects: [
      'Customer Portal Redesign - Led UI/UX overhaul resulting in 25% increase in user engagement',
      'Real-time Analytics Dashboard - Built data visualization platform processing 1M+ events daily'
    ],
    achievements: [
      'Employee of the Year 2024 for outstanding technical leadership',
      'Successfully delivered 15+ projects on time and under budget'
    ]
  };

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting professional summary...');
    // In real implementation, this would generate downloadable resume/CV
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Professional Summary
          </h1>
          <p className="text-gray-600">
            Your extracted career insights and achievements
          </p>
        </div>
        <Button 
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Professional Summary */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Summary</h2>
          <div className="space-y-3">
            {mockData.professionalSummary.map((_, index) => (
              <div key={index} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {mockData.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Companies */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Companies</h2>
          <div className="space-y-2">
            {mockData.companies.map((company, index) => (
              <div key={index} className="text-gray-700">{company}</div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Roles</h2>
          {mockData.roles.map((role, index) => (
            <div key={index} className="mb-4">
              <h3 className="font-medium text-gray-900">
                {role.title} at {role.company}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{role.period}</p>
              <ul className="space-y-1">
                {role.achievements.map((achievement, achIndex) => (
                  <li key={achIndex} className="text-sm text-gray-600 flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="bg-white border rounded-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Projects</h2>
          <div className="space-y-3">
            {mockData.projects.map((_, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white border rounded-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
          <div className="space-y-3">
            {mockData.achievements.map((achievement, index) => (
              <div key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">About Experience</h4>
        <p className="text-green-700 text-sm">
          This section displays all your processed career insights extracted from interviews. 
          You can export this information for resume building or interview preparation.
        </p>
      </div>
    </div>
  );
};

export default ExperiencePage;