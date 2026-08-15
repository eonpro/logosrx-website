/**
 * Cache tags for admin list/overview reads. Mutations call `updateTag`
 * so the next load is fresh (read-your-own-writes), matching catalog +
 * merchandising. Short `revalidate` windows on the cached loaders are a
 * backstop when a write path forgets to expire the tag.
 */
export const ADMIN_OVERVIEW_TAG = "admin-overview";
export const ADMIN_CLINICS_LIST_TAG = "admin-clinics-list";
