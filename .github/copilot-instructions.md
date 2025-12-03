## Repo overview (quick)

- This is a Next.js (App Router) + TypeScript project (Next v15, React 19). The UI lives under `src/app` using the new `app/` folder conventions.
- Styling: Tailwind CSS (see `tailwind.config.js` and `src/app/globals.css`).
- Auth: token stored in `localStorage` and provided via `AuthProvider` in `src/context/AuthContext.tsx`.
- API helper: use `apiFetch` in `src/lib/api.ts`. It reads `NEXT_PUBLIC_API_BASE_URL` and performs token expiry checks; throws on non-OK responses and supports `responseType: 'blob'|'text'`.

## What to know before editing

- Client vs server: many components use `use client` at file top; follow the existing pattern. If you need browser APIs (localStorage, router push, useEffect), make the file a client component.
- Routing: pages are inside `src/app`. Use `next/navigation`'s `useRouter()` for client-side navigation (examples: `router.push('/dashboard/reuniones/nuevo')` in `src/app/dashboard/reuniones/components/ReunionesAdmin.tsx`).
- API conventions: endpoints are appended to the base URL in `apiFetch`. Many list endpoints accept `page` and `page_size` and filter query params (see `ReunionesAdmin.tsx` example building a `URLSearchParams`).
- Auth handling: store token via `AuthProvider.login(token)` or `localStorage.setItem('token', token)`; `apiFetch` will automatically include Authorization header and will remove expired tokens (it throws an Error with the backend message). Respect this flow when adding auth logic.

## Developer workflows (commands)

- Start dev server: `npm run dev` (Next dev). The project uses `package.json` scripts: `dev`, `build`, `start`, `lint`.
- Build: `npm run build` then `npm run start`. Note: `next.config.ts` currently disables ESLint and TypeScript checks during build (`ignoreDuringBuilds: true` and `ignoreBuildErrors: true`) — do not rely on this to skip local checks; run `npm run lint` and `tsc` locally if you need stricter checks.

## Patterns & conventions (project-specific)

- Centralized API helper: Use `src/lib/api.ts` for all network calls. It handles headers, token expiry, and different response types. Avoid creating ad-hoc fetch wrappers.
- Local auth state: `AuthProvider` (in `src/context/AuthContext.tsx`) is the single source of truth for auth state. Wrap `children` with it at the root (`src/app/layout.tsx`). Use `useAuth()` to access login/logout/isAuthenticated.
- UI components: reusable components live in `src/components` (e.g., `AnimatedFilterField`, `Tooltip`). Follow existing props patterns (controlled components with value/onChange).
- Modal and table patterns: look at `ReunionesAdmin.tsx` for modal layout, pagination, and conditional rendering. Keep markup and accessibility consistent with these examples.

## Integration points & external dependencies

- Backend: `NEXT_PUBLIC_API_BASE_URL` should point to the API gateway (default set in `api.ts`). All endpoints prepend this base.
- Libraries to be aware of: `axios` (installed but `fetch` + `apiFetch` is used), `jwt-decode` (used in `api.ts`), `lucide-react` (icons), Tailwind.

## Examples (copy/paste friendly)

- Perform an authenticated GET that expects JSON:

  import { apiFetch } from '@/lib/api'
  const data = await apiFetch<MyType>(`/reunion/reunion/?page=1&page_size=10`)

- Use the auth context in a client component:

  import { useAuth } from '@/context/AuthContext'
  const { login, logout, isAuthenticated } = useAuth()

- Build a search query (pattern used in `ReunionesAdmin.tsx`):

  const q = new URLSearchParams({ page: '1', page_size: '10', ...(title && { titulo: title })}).toString()

## When making changes, prefer:

- Reusing `apiFetch` and `useAuth` rather than duplicating auth or fetch logic.
- Adding client components only when DOM APIs or hooks are required; otherwise prefer server components for performance.
- Keeping visual/copy patterns consistent (buttons use the site brown color (hex 7d4f2b) across dashboard components).

## Quick checks before PR

- Run `npm run dev` and exercise the modified UI path.
- Confirm API calls succeed against `NEXT_PUBLIC_API_BASE_URL` (set in env or `.env.local`).
- Run `npm run lint` and a local `tsc --noEmit` if you changed types.

---
If anything above is unclear or you want specific examples (e.g., how to add a new dashboard page or wire a new API resource), tell me which change you plan and I will add step-by-step guidance and code snippets.
