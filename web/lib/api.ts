export type Item = { id: string; name: string; price: number; weight: string; desc: string; tags?: string[] };
export type Category = { id: string; name: string; items: Item[] };
export type Menu = { currency: string; categories: Category[] };
export type Cart = Record<string, number>;

export const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

export async function get<T>(path: string): Promise<T> {
  return parse<T>(await fetch(`/api${path}`));
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data as T;
  const detail = data?.detail;
  throw new Error(typeof detail === "string" ? detail : "Не получилось. Проверьте интернет и попробуйте ещё раз.");
}

export const som = (n: number) => `${n.toLocaleString("ru-RU")} с.`;

// ponytail: localStorage only remembers the guest's phone/table/cart on this device, the server is the source of truth
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
