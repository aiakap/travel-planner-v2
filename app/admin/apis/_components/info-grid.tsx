interface InfoGridItem {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface InfoGridProps {
  items: InfoGridItem[];
  columns?: 1 | 2 | 3;
}

export function InfoGrid({ items, columns = 2 }: InfoGridProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={item.fullWidth ? "col-span-full" : ""}
        >
          <div className="text-sm text-muted-foreground">{item.label}</div>
          <div className="text-sm font-medium mt-1">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
