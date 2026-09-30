export const CATEGORY_SLUGS = ["musik", "pikiran", "absurd"] as const;
export type Category = (typeof CATEGORY_SLUGS)[number];

type CategoryInfo = {
  label: string;
  blurb: string;
};

export const categories: Record<Category, CategoryInfo> = {
  musik: {
    label: "Musik",
    blurb: "Lagu, album, dan apa aja yang nempel di kuping.",
  },
  pikiran: {
    label: "Pikiran",
    blurb: "Isi kepala, ditulis dulu sebelum keburu lupa.",
  },
  absurd: {
    label: "Absurd",
    blurb: "Nggak perlu masuk akal, yang penting ditulis.",
  },
};

export function isCategory(value: string): value is Category {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}
