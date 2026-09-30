"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { FormError, invalidField } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { PLATFORMS, type PlatformKey, type SocialItem } from "@/lib/platforms";
import { updateProfile } from "./actions";

export type ProfileValues = {
  fullName: string;
  nickname: string;
  roleLabel: string;
  email: string;
  phone: string;
  bio: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  education: string;
  city: string;
  address: string;
  socials: SocialItem[];
};

type SocialRow = SocialItem & { id: number };

const EDUCATION = ["SD", "SMP", "SMA/SMK", "D1–D3", "S1/D4", "S2", "S3"];
const BIO_MAX = 280;

/** Satu kelompok isian: judul kecil, keterangan, lalu isinya. Kelompok berikutnya dipisah garis. */
function Group({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-line [&:not(:first-child)]:pt-6">
      <legend className="sr-only">{title}</legend>
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-muted">{note}</p>
      </div>
      {children}
    </fieldset>
  );
}

export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const [bioLength, setBioLength] = useState(profile.bio.length);
  // baris media sosial diberi id sendiri supaya React tidak tertukar saat ada yang dihapus di tengah
  const [socials, setSocials] = useState<SocialRow[]>(() => profile.socials.map((item, i) => ({ ...item, id: i })));
  const addSocial = () =>
    setSocials((rows) => [...rows, { id: Date.now(), platform: "instagram", label: "", username: "", url: "" }]);
  const removeSocial = (id: number) => setSocials((rows) => rows.filter((row) => row.id !== id));
  const updateSocial = (id: number, patch: Partial<SocialItem>) =>
    setSocials((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const wrong = (field: string) => state?.field === field;
  const fieldError = (field: string) => (wrong(field) ? <FormError variant="field">{state?.error}</FormError> : null);

  return (
    <form action={action} className="flex flex-col gap-6">
      <Group title="Data Diri" note="Nama dan sebutan tampil di halaman ini. Email dipakai buat masuk.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input id="full_name" name="full_name" required maxLength={80} defaultValue={profile.fullName} className={cn(wrong("full_name") && invalidField)} />
            {fieldError("full_name")}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">Nama Panggilan</Label>
            <Input id="nickname" name="nickname" maxLength={40} defaultValue={profile.nickname} placeholder="Misalnya: Yazid" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role_label">Sebutan</Label>
            <Input id="role_label" name="role_label" maxLength={60} defaultValue={profile.roleLabel} placeholder="Misalnya: Yang nulis" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} readOnly disabled className="bg-bg text-muted" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="phone">Nomor WhatsApp / Telepon</Label>
            <Input id="phone" name="phone" type="tel" inputMode="tel" maxLength={20} defaultValue={profile.phone} placeholder="08xxxxxxxxxx" className={cn(wrong("phone") && invalidField)} />
            {fieldError("phone")}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">Bio Singkat</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={BIO_MAX}
            defaultValue={profile.bio}
            onChange={(event) => setBioLength(event.target.value.length)}
            placeholder="Satu dua kalimat soal kamu."
          />
          <p className="text-right text-xs tabular-nums text-muted">
            {bioLength}/{BIO_MAX}
          </p>
        </div>
      </Group>

      <Group title="Identitas Diri" note="Buat catatan sendiri aja, nggak ditampilkan di situs.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <Select id="gender" name="gender" defaultValue={profile.gender}>
              <option value="">Pilih...</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birth_place">Tempat Lahir</Label>
            <Input id="birth_place" name="birth_place" maxLength={80} defaultValue={profile.birthPlace} placeholder="Kota/kabupaten" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birth_date">Tanggal Lahir</Label>
            <Input id="birth_date" name="birth_date" type="date" defaultValue={profile.birthDate} className={cn(wrong("birth_date") && invalidField)} />
            {fieldError("birth_date")}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="education">Pendidikan Terakhir</Label>
            <Select id="education" name="education" defaultValue={profile.education}>
              <option value="">Pilih...</option>
              {EDUCATION.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Group>

      <Group title="Alamat" note="Tempat tinggal sekarang. Juga nggak ditampilkan di situs.">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">Kota</Label>
          <Input id="city" name="city" maxLength={80} defaultValue={profile.city} placeholder="Kota/kabupaten, provinsi" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Alamat Lengkap</Label>
          <Textarea id="address" name="address" rows={2} maxLength={300} defaultValue={profile.address} placeholder="Nama jalan, RT/RW, patokan" />
        </div>
      </Group>

      <Group title="Media Sosial" note="Ini yang tampil di footer situs. Boleh lebih dari satu, dan yang tautannya kosong nggak ditampilkan.">
        <div className="flex flex-col gap-4">
          {socials.map((social, i) => {
            const platform = PLATFORMS.find((item) => item.key === social.platform) ?? PLATFORMS[0];
            return (
              <div key={social.id} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`social_platform_${i}`}>Platform</Label>
                    <Select
                      id={`social_platform_${i}`}
                      name="social_platform"
                      value={social.platform}
                      onChange={(event) => updateSocial(social.id, { platform: event.target.value as PlatformKey })}
                    >
                      {PLATFORMS.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {social.platform === "lainnya" ? (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`social_label_${i}`}>Nama Platform</Label>
                      <Input id={`social_label_${i}`} name="social_label" maxLength={30} defaultValue={social.label} placeholder="Misalnya: Letterboxd" />
                    </div>
                  ) : (
                    <>
                      <input type="hidden" name="social_label" value="" />
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`social_username_${i}`}>Username</Label>
                        <Input id={`social_username_${i}`} name="social_username" maxLength={40} defaultValue={social.username} placeholder="namaakun" />
                      </div>
                    </>
                  )}
                  {social.platform === "lainnya" ? (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`social_username_${i}`}>Username</Label>
                      <Input id={`social_username_${i}`} name="social_username" maxLength={40} defaultValue={social.username} placeholder="namaakun" />
                    </div>
                  ) : null}
                  <div className={cn("flex flex-col gap-1.5", social.platform !== "lainnya" && "sm:col-span-2")}>
                    <Label htmlFor={`social_url_${i}`}>Tautan</Label>
                    <Input
                      id={`social_url_${i}`}
                      name="social_url"
                      inputMode="url"
                      maxLength={200}
                      defaultValue={social.url}
                      placeholder={platform.urlHint}
                      className={cn(wrong(`social_url_${i}`) && invalidField)}
                    />
                    {fieldError(`social_url_${i}`)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSocial(social.id)}
                  className="self-start text-sm font-medium text-muted hover:text-danger"
                >
                  Hapus akun ini
                </button>
              </div>
            );
          })}
          <Button type="button" variant="secondary" size="sm" onClick={addSocial}>
            Tambah akun
          </Button>
        </div>
      </Group>

      <div className="flex flex-col gap-4 border-t border-line pt-6">
        {state?.error && !state.field ? <FormError>{state.error}</FormError> : null}
        {state?.ok ? (
          <p role="status" className="rounded-[10px] border border-line bg-bg px-3.5 py-2.5 text-sm font-medium">
            {state.ok}
          </p>
        ) : null}
        <SubmitButton>Simpan perubahan</SubmitButton>
      </div>
    </form>
  );
}
