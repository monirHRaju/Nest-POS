"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  onAdd,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-base-content/60 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onAdd && (
            <button onClick={onAdd} className="btn btn-primary">
              + Add New
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
