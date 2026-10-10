/** Nama berkas dari judul: huruf kecil tanpa aksen, selain huruf dan angka jadi strip, misalnya "secukupnya". */
export const fileSlug = (text: string, fallback = "lagu") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
