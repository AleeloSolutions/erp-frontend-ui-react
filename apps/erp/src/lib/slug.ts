/**
 * Client-side slug preview for the signup form's domain picker. Mirrors
 * the backend's rule closely enough for a live preview -- the server is
 * always the final authority and re-validates on submit, so exact
 * Unicode parity with Django's slugify() isn't required here.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip accents (combining diacritical marks)
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}
