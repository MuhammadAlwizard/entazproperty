// Runs once when the server starts: applies database migrations (and, if configured, creates the
// first admin). Errors are logged, not fatal, so the site can still show its own error pages.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.AUTO_MIGRATE === '0') return;
  try {
    const { bootstrap } = await import('@enjaz/core');
    await bootstrap();
  } catch (err) {
    console.error('[db] bootstrap gagal:', (err as Error).message);
  }
}
