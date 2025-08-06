import React, { useState } from 'react';
import TopicsList from '../views/TopicsList';
import { useTopics } from '../hooks/useTopics';
import { apiService } from '../../../services/apiService';
import { UserJourneyLogger } from '../../../utils/logger';

interface ChooseTopicContainerProps {
  onTopicSelect: (step: string, interviewId?: string) => void;
}

const ChooseTopicContainer: React.FC<ChooseTopicContainerProps> = ({ onTopicSelect }) => {
  const { topics, loading, error, reload } = useTopics();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSelect = async (topicId: string) => {
    if (selecting) return;
    setSelecting(topicId);
    setLocalError(null);
    try {
      const resp = await apiService.selectTopic(topicId);
      if (resp.success) {
        const interviewId = resp.responseObject.interview.id;
        onTopicSelect('interview', String(interviewId));
      } else if (!(resp.isDuplicate || resp.statusCode === 429)) {
        setLocalError(resp.message || 'Failed to select topic');
      }
    } catch (err) {
      setLocalError('Failed to select topic');
      UserJourneyLogger.logError(err as Error, {
        action: 'select_topic_failed',
        component: 'ChooseTopicContainer',
        topicId
      });
    } finally {
      setSelecting(null);
    }
  };

  return (
    <TopicsList
      topics={topics}
      loading={loading}
      error={localError ?? error}
      selecting={selecting}
      onReload={reload}
      onSelect={handleSelect}
    />
  );
};

export default ChooseTopicContainer;
