import { getAllMasters } from "@/lib/queries";
import type { Metadata } from "next";
import { MastersClient } from "@/components/MastersClient";

export const metadata: Metadata = {
  title: "投资大师 — 投资名言",
  description: "浏览巴菲特、芒格、格雷厄姆、林奇、索罗斯等投资大师的名言合集",
};

export const dynamic = "force-dynamic";

export default function MastersPage() {
  const masters = getAllMasters();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "var(--t-text)" }}
        >
          投资大师
        </h1>
        <p
          className="text-lg max-w-2xl"
          style={{ color: "var(--t-text-secondary)" }}
        >
          跨越时空的投资智慧，从他们的思想中汲取力量
        </p>
      </div>

      <MastersClient masters={masters} />
    </div>
  );
}
