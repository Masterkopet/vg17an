// Dijalankan sekali saat server Next.js hidup (Node runtime).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackupScheduler } = await import("./lib/scheduler");
    startBackupScheduler();
  }
}
