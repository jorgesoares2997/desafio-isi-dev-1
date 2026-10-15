import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-[#E4E4E7] flex items-center justify-center text-[#686872] mb-4 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-zinc-900 tracking-tight">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-[#686872] max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold rounded-lg transition active:scale-95 shadow-xs"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
