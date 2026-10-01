"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Mencatat satu kali baca untuk statistik di dashboard admin.
 * Sekali per tulisan per tab (ditandai di sessionStorage), jadi memuat ulang tidak menambah hitungan.
 * Tidak mengirim apa pun selain alamat tulisannya.
 */
export function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const key = `dibaca:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // penyimpanan diblokir: tetap dicatat, hanya tidak bisa dicegah dobel
    }
    void createClient().rpc("record_post_view", { post_slug: slug });
  }, [slug]);

  return null;
}
