export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`bg-zinc-200/70 rounded animate-pulse ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-10 bg-zinc-200/80 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-9 bg-zinc-100 rounded-md flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4 animate-pulse shadow-xs">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-zinc-200 rounded w-1/3" />
            <div className="h-6 w-12 bg-zinc-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
            <div className="h-4 bg-zinc-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
