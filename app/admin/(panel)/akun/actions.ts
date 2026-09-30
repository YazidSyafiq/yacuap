"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { PLATFORMS, type SocialItem } from "@/lib/platforms";
import { createPublicClient } from "@/lib/supabase/public";

export type PasswordState = { error?: string; ok?: string; field?: "current" | "next" | "confirm" } | undefined;
export type ProfileState = { error?: string; ok?: string; field?: string } | undefined;

const MIN_LENGTH = 8;
const GENDERS = ["laki-laki", "perempuan"];

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

/** Alamat media sosial boleh ditulis tanpa https://; yang bukan alamat web ditolak. */
function socialUrl(value: string): string | null {
  if (!value) return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireAdmin();

  const fullName = text(formData, "full_name", 80);
  if (!fullName) return { field: "full_name", error: "Nama lengkapnya diisi dulu." };

  const phone = text(formData, "phone", 20);
  if (phone && !/^\+?[0-9\s-]{8,20}$/.test(phone)) {
    return { field: "phone", error: "Nomornya cuma boleh angka, spasi, tanda hubung, dan + di depan." };
  }

  const birthDate = text(formData, "birth_date", 10);
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || new Date(birthDate) > new Date())) {
    return { field: "birth_date", error: "Tanggal lahirnya belum benar." };
  }

  const gender = text(formData, "gender", 20);
  // Media sosial: tiga daftar isian sejajar (platform, username, tautan), satu baris per akun.
  // Baris yang semuanya kosong dilewati. Username disimpan tanpa @ di depan; footer yang menambahkannya.
  const platforms = formData.getAll("social_platform").map(String);
  const usernames = formData.getAll("social_username").map(String);
  const urls = formData.getAll("social_url").map(String);
  const labels = formData.getAll("social_label").map(String);
  const socials: SocialItem[] = [];
  for (let i = 0; i < platforms.length; i += 1) {
    const platform = PLATFORMS.find((item) => item.key === platforms[i])?.key ?? "lainnya";
    const username = (usernames[i] ?? "").trim().replace(/^@+/, "").slice(0, 40);
    const label = (labels[i] ?? "").trim().slice(0, 30);
    const rawUrl = (urls[i] ?? "").trim().slice(0, 200);
    if (!username && !rawUrl && !label) continue;
    const url = socialUrl(rawUrl);
    if (url === null) return { field: `social_url_${i}`, error: "Tautannya belum benar." };
    if (!url) return { field: `social_url_${i}`, error: "Tautannya diisi juga, biar bisa diklik di footer." };
    socials.push({ platform, label: platform === "lainnya" ? label : "", username, url });
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    full_name: fullName,
    nickname: text(formData, "nickname", 40),
    role_label: text(formData, "role_label", 60),
    bio: text(formData, "bio", 280),
    phone,
    city: text(formData, "city", 80),
    birth_place: text(formData, "birth_place", 80),
    birth_date: birthDate || null,
    gender: GENDERS.includes(gender) ? gender : null,
    education: text(formData, "education", 40),
    address: text(formData, "address", 300),
    socials,
  });
  if (error) return { error: "Profilnya gagal disimpan. Coba lagi." };

  // media sosial tampil di footer, jadi halaman publik ikut disegarkan
  revalidatePath("/", "layout");
  return { ok: "Profil tersimpan." };
}

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const { supabase, user } = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { field: "current", error: "Kata sandi yang sekarang diisi dulu." };
  if (next.length < MIN_LENGTH) return { field: "next", error: `Kata sandi baru minimal ${MIN_LENGTH} karakter.` };
  if (next === current) return { field: "next", error: "Kata sandi baru harus beda dari yang sekarang." };
  if (next !== confirm) return { field: "confirm", error: "Ulangan kata sandinya belum sama." };
  if (!user.email) return { error: "Akun ini tidak punya email." };

  // Kata sandi yang sekarang dicek lewat klien terpisah tanpa cookie, supaya sesi yang sedang dipakai tidak terganggu.
  const check = await createPublicClient().auth.signInWithPassword({ email: user.email, password: current });
  if (check.error) return { field: "current", error: "Kata sandi yang sekarang salah." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Kata sandinya gagal diganti. Coba lagi." };

  return { ok: "Kata sandi sudah diganti. Mulai sekarang masuknya pakai yang baru." };
}
