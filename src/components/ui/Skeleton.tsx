export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl bg-dark-100 border border-gray-700 p-4 animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-700 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-dark-100 border border-gray-700 animate-pulse">
      <div className="w-10 h-10 bg-gray-700 rounded-xl mb-4" />
      <div className="h-6 w-24 bg-gray-700 rounded mb-2" />
      <div className="h-4 w-16 bg-gray-700 rounded" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl p-6 bg-dark-100 border border-gray-700 animate-pulse">
      <div className="h-4 w-32 bg-gray-700 rounded mb-6" />
      <div className="h-48 bg-gray-700 rounded" />
    </div>
  );
}