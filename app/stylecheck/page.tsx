import { Shell } from "@/components/Shell";

export default function Stylecheck() {
  return (
    <Shell>
      <div className="bg-white/80 shadow-soft rounded-xl2 p-6">
        <h1 className="text-2xl font-semibold">Stylecheck</h1>
        <p className="mt-2 text-black/60">
          Als dit er zacht, rond en mooi uitziet, dan laadt Tailwind goed.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl2 shadow-soft bg-blush p-6">
            <div className="font-semibold">Blush</div>
            <div className="text-sm text-black/60 mt-1">#FFE8F9</div>
          </div>

          <div className="rounded-xl2 shadow-soft bg-skywash p-6">
            <div className="font-semibold">Skywash</div>
            <div className="text-sm text-black/60 mt-1">#E5FBFF</div>
          </div>

          <div className="rounded-xl2 shadow-soft bg-white/80 p-6 border border-black/10">
            <div className="font-semibold">Card</div>
            <div className="text-sm text-black/60 mt-1">Rondingen + zachte schaduw</div>
            <button className="mt-4 px-4 py-3 rounded-xl2 bg-blush hover:opacity-90">
              Voorbeeld knop
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
