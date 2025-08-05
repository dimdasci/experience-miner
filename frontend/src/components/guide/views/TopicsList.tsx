import React from 'react';
import { Topic } from '../../../types/business';
import { Button } from '../../ui/button';

interface TopicsListProps {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  selecting: string | null;
  onReload: () => void;
  onSelect: (topicId: string) => void;
}

const TopicsList: React.FC<TopicsListProps> = ({ topics, loading, error, selecting, onReload, onSelect }) => {
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading topics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Topics
        </h1>
        <p className="text-gray-600 text-lg">
          Choose any topic to start - you can do them in any order. More topics will appear as you dive deeper into your career story.
        </p>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
          <button onClick={onReload} className="mt-2 text-red-600 hover:text-red-800 underline">
            Try again
          </button>
        </div>
      )}

      <div className="space-y-6">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white border rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
                <p className="text-gray-600 mb-2">{topic.motivational_quote}</p>
                <p className="text-sm text-gray-500">{topic.questions.length} questions</p>
              </div>
              <Button onClick={() => onSelect(topic.id)} disabled={selecting === topic.id} className="ml-4">
                {selecting === topic.id ? 'Starting...' : 'Start Interview'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicsList;
