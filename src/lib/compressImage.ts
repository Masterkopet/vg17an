// Kompresi foto bukti transfer di sisi BROWSER (sebelum upload).
// Foto kamera HP (5–12 MB) diperkecil ke ±0,5–1,5 MB tanpa donatur perlu melakukan apa pun.

const TARGET_BYTES = 1_500_000; // sasaran ukuran akhir
const MAX_DIM = 1600;           // sisi terpanjang

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("gagal memuat gambar")); };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function compressImage(file: File): Promise<File> {
  // Sudah kecil & format didukung -> tidak perlu diapa-apakan.
  if (file.size <= 800_000 && ["image/jpeg", "image/webp"].includes(file.type)) return file;
  try {
    let source: CanvasImageSource;
    let w = 0;
    let h = 0;
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      source = bmp; w = bmp.width; h = bmp.height;
    } else {
      const img = await loadImage(file);
      source = img; w = img.naturalWidth; h = img.naturalHeight;
    }
    if (!w || !h) return file;

    const scale = Math.min(1, MAX_DIM / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    let q = 0.82;
    let blob = await toBlob(canvas, q);
    while (blob && blob.size > TARGET_BYTES && q > 0.4) {
      q -= 0.12;
      blob = await toBlob(canvas, q);
    }
    if (!blob) return file;

    // Bila kompresi tidak menolong (file asli sudah efisien), pakai aslinya.
    if (blob.size >= file.size && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;

    const name = (file.name.replace(/\.[^.]+$/, "") || "bukti") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // gagal kompres -> biarkan validasi ukuran yang memutuskan
  }
}
