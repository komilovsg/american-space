"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { get, load, post, save, som } from "@/lib/api";

type Line = { id?: string; name?: string; qty?: number; price?: number; comment?: string };
type Order = { id: number; table_no: number; items: Line[]; total: number; bonus_used: number; bonus_earned: number; status: string; created_at: string };
type Profile = { phone: string; bonus: number; orders: Order[] };

const STATUS: Record<string, string> = { new: "Принят", cooking: "Готовится", served: "Подан", paid: "Оплачен" };

export default function Me() {
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function open(p: string) {
    setError("");
    setBusy(true);
    try {
      const u = await post<{ phone: string }>("/auth", { phone: p });
      const data = await get<Profile>(`/users/${encodeURIComponent(u.phone)}`);
      setProfile(data);
      save("as:phone", data.phone);
      save("as:bonus", data.bonus);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const saved = load("as:phone", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore device state from localStorage after hydration
    setPhone(saved);
    if (saved) open(saved);
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 pt-[max(env(safe-area-inset-top),16px)] pb-16">
      <Link href="/" className="inline-block py-2 font-semibold">
        ← К меню
      </Link>

      {!profile ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            open(phone);
          }}
          className="mt-8"
        >
          <h1 className="font-display text-3xl font-black uppercase">Бонусы</h1>
          <p className="mt-2 text-muted">Введите номер, с которого заказывали. Покажем баланс и прошлые заказы.</p>
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+992 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-6 w-full rounded-xl border-2 border-ink bg-card px-4 py-3.5 font-mono text-lg"
          />
          {error && <p role="alert" className="mt-3 text-sm text-ketchup">{error}</p>}
          <button disabled={busy} className="mt-4 w-full rounded-2xl bg-ink py-4 font-semibold text-paper disabled:opacity-60">
            {busy ? "Загружаем…" : "Показать бонусы"}
          </button>
        </form>
      ) : (
        <>
          {/* Loyalty card */}
          <section className="mt-6 overflow-hidden rounded-3xl bg-ink p-6 text-paper">
            <div className="flex items-start justify-between">
              <p className="font-display text-sm font-black uppercase tracking-tight">
                American<span className="text-ketchup">✦</span>Space
              </p>
              <p className="font-mono text-xs text-paper/60">{profile.phone}</p>
            </div>
            <p className="mt-10 font-mono text-xs uppercase tracking-widest text-paper/60">Бонусов на счету</p>
            <p className="font-display text-6xl font-black text-mustard">★ {profile.bonus}</p>
            <p className="mt-4 text-sm text-paper/80">1 бонус = 1 сомони. Возвращаем 5% с каждого заказа, списать можно до половины чека.</p>
          </section>

          <h2 className="mt-10 font-display text-xl font-bold uppercase">Мои заказы</h2>
          {profile.orders.length === 0 ? (
            <p className="mt-3 text-muted">
              Заказов пока нет. <Link href="/" className="font-semibold text-ink underline">Откройте меню</Link>, чтобы сделать первый.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {profile.orders.map((o) => (
                <li key={o.id} className="rounded-2xl bg-card p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold">
                      №{o.id} · стол {o.table_no}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {new Date(o.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {o.items.filter((l) => l.name).map((l) => `${l.name} × ${l.qty}`).join(", ")}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-mono text-sm">
                    <span className="rounded-full bg-paper px-2.5 py-1">{STATUS[o.status] ?? o.status}</span>
                    <span>
                      {som(o.total - o.bonus_used)} <span className="text-muted">· +{o.bonus_earned}★</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => {
              save("as:phone", "");
              save("as:bonus", null);
              setProfile(null);
              setPhone("");
            }}
            className="mt-10 text-sm text-muted underline"
          >
            Это не мой номер
          </button>
        </>
      )}
    </main>
  );
}
