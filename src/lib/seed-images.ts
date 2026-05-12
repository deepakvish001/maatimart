import farm1 from "@/assets/farm-1.jpg";
import farm2 from "@/assets/farm-2.jpg";
import farm3 from "@/assets/farm-3.jpg";
import pTomatoes from "@/assets/p-tomatoes.jpg";
import pSpinach from "@/assets/p-spinach.jpg";
import pBrinjal from "@/assets/p-brinjal.jpg";
import pChilies from "@/assets/p-chilies.jpg";
import pOnions from "@/assets/p-onions.jpg";
import pMangoes from "@/assets/p-mangoes.jpg";
import pTurmeric from "@/assets/p-turmeric.jpg";
import heroFarm from "@/assets/hero-farm.jpg";

const map: Record<string, string> = {
  "/seed/farm-1.jpg": farm1,
  "/seed/farm-2.jpg": farm2,
  "/seed/farm-3.jpg": farm3,
  "/seed/p-tomatoes.jpg": pTomatoes,
  "/seed/p-spinach.jpg": pSpinach,
  "/seed/p-brinjal.jpg": pBrinjal,
  "/seed/p-chilies.jpg": pChilies,
  "/seed/p-onions.jpg": pOnions,
  "/seed/p-mangoes.jpg": pMangoes,
  "/seed/p-turmeric.jpg": pTurmeric,
};

export const heroImage = heroFarm;

export function resolveImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/seed/")) return map[url] ?? null;
  return url;
}
