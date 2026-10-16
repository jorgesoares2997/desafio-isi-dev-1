import React from 'react';
import { SearchX, ServerOff } from 'lucide-react';

export { ServerOff };
export const DisconnectedLayersIcon = ServerOff;

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = SearchX,
  title,
  description,
  action,
  className = 'py-16 px-4',
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-5 h-5 text-zinc-500" />;
  };

  const renderActionIcon = () => {
    if (!action?.icon) return null;
    if (React.isValidElement(action.icon)) return action.icon;
    const ActionIconComponent = action.icon as React.ComponentType<{ className?: string }>;
    return <ActionIconComponent className="w-3.5 h-3.5" />;
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Icon Container (Figma: rounded square with subtle border) */}
      <div className="w-12 h-12 rounded-xl bg-zinc-100/80 border border-zinc-200/50 flex items-center justify-center text-zinc-500 mb-4 shadow-2xs">
        {renderIcon()}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-zinc-900 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-[#686872] max-w-md mt-1 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl border border-[#E4E4E7] bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
        >
          {renderActionIcon()}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
