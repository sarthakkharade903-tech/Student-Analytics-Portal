import { createBrowserClient } from '@supabase/ssr'

// Stored on globalThis so the instance survives Fast Refresh.
// HMR re-evaluates modules but does NOT clear globalThis, so this
// prevents duplicate onAuthStateChange listeners across hot reloads.
// We use bracket notation (globalThis as any) to avoid a `declare global`
// block — global type augmentations force extra TypeScript reprocessing
// on every build pass, which was contributing to the rebuild loop.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any

export function createClient() {
  if (!g.__supabase_client) {
    g.__supabase_client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return g.__supabase_client as ReturnType<typeof createBrowserClient>
}
