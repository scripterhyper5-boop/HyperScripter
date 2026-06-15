export function AuthFormSkeleton() {
  return (
    <div
      className="saas-card rounded-2xl p-8"
      aria-hidden="true"
    >
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-white/10" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-gray-50" />
      </div>
      <div className="space-y-5">
        <div className="h-10 animate-pulse rounded-md bg-gray-50" />
        <div className="h-10 animate-pulse rounded-md bg-gray-50" />
        <div className="h-10 animate-pulse rounded-md bg-violet/20" />
      </div>
    </div>
  );
}
