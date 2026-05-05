"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  onAdd?: () => void;
  addLabel?: string;
  actions?: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  title,
  subtitle,
  count,
  countLabel,
  onAdd,
  addLabel = "Add New",
  actions,
  back,
  onBack,
}: PageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b border-base-300/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {back && (
            <button
              onClick={() => (onBack ? onBack() : history.back())}
              className="btn btn-ghost btn-sm btn-circle"
              title="Back"
            >←</button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-base-content">{title}</h1>
              {typeof count === "number" && (
                <span className="badge badge-primary badge-lg">
                  {count.toLocaleString()} {countLabel || ""}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-base-content/60 mt-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {onAdd && (
            <button onClick={onAdd} className="btn btn-primary gap-1">
              <span className="text-lg leading-none">+</span> {addLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
