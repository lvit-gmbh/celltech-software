interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({
  title = "No data found",
  description,
}: EmptyStateProps) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

