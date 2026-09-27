import React from 'react';

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: string;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ title, description, icon = '🔍', onAction, actionLabel }) => (
  <div className="bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] rounded-xl p-10 text-center flex flex-col items-center justify-center my-6">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
      {title}
    </h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
      {description}
    </p>
    {onAction && actionLabel && (
      <button
        onClick={onAction}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Failed to load live data',
  message = 'Could not establish connection to the FastAPI service.',
  onRetry,
}) => (
  <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center my-4 flex flex-col items-center">
    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 text-lg font-bold">
      !
    </div>
    <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-1">
      {title}
    </h4>
    <p className="text-xs text-rose-600/80 dark:text-rose-300/70 max-w-md mb-4">
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
      >
        Retry Connection
      </button>
    )}
  </div>
);
