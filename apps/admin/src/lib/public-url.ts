/** Address of the public website (a separate app). Used for "view site" and for links sent to customers. */
export const PUBLIC_URL = (process.env.PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'http://localhost:3100').replace(/\/$/, '');
