import ExperienceContainer from '../experience/containers/ExperienceContainer';

const ExperienceScreen = () => {

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 lg:p-6">
        <ExperienceContainer />
      </div>
    </div>
  );
};

export default ExperienceScreen;