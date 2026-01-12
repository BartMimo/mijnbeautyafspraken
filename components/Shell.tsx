export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-skywash/40 via-white to-blush/40">
      {children}
    </div>
  );
}