import { DashboardNav } from "@/components/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Salon dashboard</h1>
        <p className="mt-2 text-sm text-black/60">
          Beheer medewerkers, diensten, tijden en deals.
        </p>

        <div className="mt-4">
          <DashboardNav />
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}