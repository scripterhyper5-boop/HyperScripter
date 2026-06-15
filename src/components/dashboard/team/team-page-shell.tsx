interface TeamPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function TeamPageShell({
  title,
  description,
  children,
}: TeamPageShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
