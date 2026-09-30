import type { Metadata } from "next";
import { FormCard } from "@/components/admin/form-card";
import { CapIcon, CheckBadgeIcon, MailIcon, PhoneIcon, PinIcon, ShieldIcon, UserIcon } from "@/components/admin/icons";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AuthorPhoto } from "@/components/site/author-photo";
import { requireAdmin } from "@/lib/auth";
import { type SocialItem } from "@/lib/platforms";
import { site } from "@/lib/site";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Akun Saya" };

type ProfileRow = {
  full_name: string;
  nickname: string;
  role_label: string;
  bio: string;
  phone: string;
  city: string;
  birth_place: string;
  birth_date: string | null;
  gender: string | null;
  education: string;
  address: string;
  socials: SocialItem[] | null;
};

/**
 * Akun saya, diadaptasi dari Portal Parerejo.
 * Kiri: ringkasan (foto, nama, sebutan, kontak) dan ganti kata sandi. Kanan: formulir profil lengkap.
 */
export default async function AdminAccountPage() {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  const profile = data as ProfileRow | null;

  const fullName = profile?.full_name || site.author;
  const roleLabel = profile?.role_label || "Yang nulis";
  const facts = [
    { icon: MailIcon, text: user.email ?? "" },
    { icon: PhoneIcon, text: profile?.phone ?? "" },
    { icon: PinIcon, text: profile?.city ?? "" },
    { icon: CapIcon, text: profile?.education ?? "" },
  ].filter((fact) => fact.text);

  return (
    <div className="flex flex-col gap-7">
      <AdminPageHeader title="Akun Saya" note="Data diri kamu dan keamanan akunnya. Akunnya cuma satu, ya punya kamu." />

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex flex-col items-center text-center">
              <AuthorPhoto size={96} />
              <p className="mt-4 text-xl font-semibold">{fullName}</p>
              <p className="mt-0.5 text-sm text-muted">{roleLabel}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-surface">
                <CheckBadgeIcon className="size-3.5" />
                Admin
              </span>
              {profile?.bio ? <p className="mt-4 text-sm leading-relaxed text-muted">{profile.bio}</p> : null}
            </div>
            <ul className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-sm text-muted">
              {facts.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-ink" />
                  <span className="min-w-0 truncate">{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <FormCard title="Ganti Kata Sandi" icon={ShieldIcon} note="Kata sandi buat masuk ke sini.">
            <PasswordForm />
          </FormCard>
        </div>

        <FormCard title="Profil" icon={UserIcon} note="Data diri kamu dan media sosial yang tampil di footer." className="min-w-0">
          <ProfileForm
            profile={{
              fullName,
              nickname: profile?.nickname ?? site.authorShort,
              roleLabel: profile?.role_label ?? "",
              email: user.email ?? "",
              phone: profile?.phone ?? "",
              bio: profile?.bio ?? "",
              gender: profile?.gender ?? "",
              birthPlace: profile?.birth_place ?? "",
              birthDate: profile?.birth_date ?? "",
              education: profile?.education ?? "",
              city: profile?.city ?? "",
              address: profile?.address ?? "",
              socials: Array.isArray(profile?.socials) ? profile.socials : [],
            }}
          />
        </FormCard>
      </div>
    </div>
  );
}
