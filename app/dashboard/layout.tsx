import { Shell } from "@/components/Shell";
import { DashboardNav } from "@/components/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
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
    </Shell>
  );
}