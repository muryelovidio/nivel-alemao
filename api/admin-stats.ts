// api/admin-stats.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const results   = await storage.getQuizResultsBySession("");
    const analytics = await storage.getQuizAnalyticsBySession("");

    res.status(200).json({
      totalQuizzes: results.length,
      results:      results.slice(0, 50),
      analytics:    analytics.slice(0, 100),
      levelDistribution: {
        A1: results.filter(r => r.level === "A1").length,
        A2: results.filter(r => r.level === "A2").length,
        B1: results.filter(r => r.level === "B1").length,
        B2: results.filter(r => r.level === "B2").length,
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
}
