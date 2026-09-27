import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface UpcomingModuleViewProps {
  tabId: string;
  onBackToOverview: () => void;
}

export const UpcomingModuleView: React.FC<UpcomingModuleViewProps> = ({ tabId, onBackToOverview }) => {
  return (
    <div className="p-8 text-center space-y-4">
      <button
        onClick={onBackToOverview}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white"
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>
      <h2 className="text-xl font-bold">Module: {tabId}</h2>
      <p className="text-xs text-slate-500">All primary intelligence modules are now live.</p>
    </div>
  );
};
