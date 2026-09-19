export type FormState = {
  errors?: Record<string, string>;
  values?: Record<string, string | string[]>;
  formError?: string;
  ok?: string;
};

/** FormData to a plain object, keeping repeated `images` fields as an array. */
export function formToObject(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== 'string') continue;
    if (k === 'images') continue;
    out[k] = v;
  }
  out.images = fd.getAll('images').filter((v): v is string => typeof v === 'string');
  return out;
}
