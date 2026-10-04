"use client";

import { useEffect, useState } from "react";
import { load, post, save, som, type Cart, type Item } from "@/lib/api";

type Placed = { id: number; to_pay: number; bonus_used: number; bonus_earned: number; bonus: number };

export default function Ticket({
  cart,
  items,
  table,
  setTable,
  change,
  onOrdered,
}: {
  cart: Cart;
  items: Record<string, Item>;
  table: number | null;
  setTable: (t: number | null) => void;
  change: (id: string, d: number) => void;
  onOrdered: (bonus: number) => void;
}) {
  const [phone, setPhone] = useState("");
  const [balance, setBalance] = useState(0);
  const [useBonus, setUseBonus] = useState(false);
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Placed | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore device state from localStorage after hydration
    setPhone(load("as:phone", ""));
    setBalance(load("as:bonus", 0) ?? 0);
  }, []);

  const lines = Object.entries(cart).filter(([id]) => items[id]);
  const total = lines.reduce((s, [id, q]) => s + items[id].price * q, 0);
  // Mirrors the server rule (api/main.py split_bonus); the server recalculates anyway.
  const bonusOff = useBonus ? Math.min(balance, Math.floor(total * 0.5)) : 0;

  async function checkPhone() {
    if (phone.replace(/\D/g, "").length < 9) return;
    try {
      const u = await post<{ phone: string; bonus: number }>("/auth", { phone });
      setPhone(u.phone);
      setBalance(u.bonus);
      save("as:phone", u.phone);
      save("as:bonus", u.bonus);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await post<Placed>("/orders", {
        phone,
        table,
        payment,
        comment,
        use_bonus: useBonus,
        items: lines.map(([id, qty]) => ({ id, qty })),
      });
      save("as:phone", phone);
      setBalance(res.bonus);
      setUseBonus(false);
      setComment("");
      setPlaced(res);
      onOrdered(res.bonus);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <div className="ticket relative px-6 py-10 text-center">
        <p className="stamp mx-auto inline-block px-4 py-2 text-2xl font-black uppercase">Принят</p>
        <p className="mt-6 font-display text-xl font-bold">Заказ №{placed.id} ушёл на кухню</p>
        <p className="mt-2 text-muted">
          Официант принесёт его к столу {table}. К оплате {som(placed.to_pay)} — {payment === "card" ? "картой через терминал" : "наличными"}.
        </p>
        <div className="ticket-rule my-6" />
        <p className="font-mono text-sm">
          {placed.bonus_used > 0 && <>Списано бонусов: {placed.bonus_used}<br /></>}
          Начислено бонусов: <b>+{placed.bonus_earned}</b>
          <br />
          На счету: <b className="text-ink">★ {placed.bonus}</b>
        </p>
        <button onClick={() => setPlaced(null)} className="mt-8 w-full rounded-2xl border-2 border-ink py-3.5 font-semibold">
          Заказать ещё
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="ticket relative max-h-[80dvh] overflow-y-auto px-5 py-8 lg:max-h-[calc(100dvh-4rem)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Гостевой чек</p>
          <p className="mt-1 font-display text-2xl font-black uppercase">Ваш заказ</p>
        </div>
        {table ? (
          <p className="stamp shrink-0 px-2.5 py-1 text-center leading-none">
            <span className="block text-[10px] font-medium">СТОЛ</span>
            <span className="text-2xl font-black">{String(table).padStart(2, "0")}</span>
          </p>
        ) : (
          <label className="shrink-0 text-right">
            <span className="block font-mono text-xs text-muted">Номер стола</span>
            <input
              required
              type="number"
              min={1}
              max={999}
              inputMode="numeric"
              onChange={(e) => {
                const t = Number(e.target.value) || null;
                setTable(t);
                save("as:table", t);
              }}
              className="mt-1 w-20 rounded-lg border-2 border-ink px-2 py-1.5 text-center font-mono text-lg"
            />
          </label>
        )}
      </div>

      <div className="ticket-rule my-5" />

      {lines.length === 0 ? (
        <p className="py-6 text-center text-muted">
          Чек пуст. Нажмите <b className="text-ink">+</b> у блюда или спросите помощника, что взять.
        </p>
      ) : (
        <ul className="space-y-3 font-mono text-[15px]">
          {lines.map(([id, qty]) => (
            <li key={id} className="flex items-center gap-2">
              <span className="flex items-center">
                <button type="button" aria-label={`Убрать ${items[id].name}`} onClick={() => change(id, -1)} className="h-8 w-7 text-muted hover:text-ink">
                  −
                </button>
                <span className="w-5 text-center">{qty}</span>
                <button type="button" aria-label={`Добавить ${items[id].name}`} onClick={() => change(id, 1)} className="h-8 w-7 text-muted hover:text-ink">
                  +
                </button>
              </span>
              <span className="min-w-0 truncate font-sans">{items[id].name}</span>
              <span className="leader" aria-hidden />
              <span>{items[id].price * qty}</span>
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 && (
        <>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            placeholder="Пожелание кухне: без лука, прожарка medium…"
            className="mt-5 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm placeholder:text-muted"
          />

          <div className="ticket-rule my-5" />

          <label className="block">
            <span className="text-sm font-semibold">Телефон</span>
            <span className="block text-xs text-muted">Сохраним заказ и начислим 5% бонусами</span>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+992 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={checkPhone}
              className="mt-2 w-full rounded-lg border-2 border-ink px-3 py-3 font-mono text-lg"
            />
          </label>

          {balance > 0 && (
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-mustard/20 px-3 py-3">
              <span className="text-sm">
                Списать бонусы <span className="font-mono">★ {balance}</span>
                <span className="block text-xs text-muted">до половины чека</span>
              </span>
              <input type="checkbox" checked={useBonus} onChange={(e) => setUseBonus(e.target.checked)} className="h-5 w-5 accent-ink" />
            </label>
          )}

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Оплата</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              {(
                [
                  ["card", "Картой"],
                  ["cash", "Наличными"],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`cursor-pointer rounded-lg border-2 px-2 py-2.5 text-center font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-mustard ${
                    payment === v ? "border-ink bg-ink text-paper" : "border-line"
                  }`}
                >
                  <input type="radio" name="payment" value={v} checked={payment === v} onChange={() => setPayment(v)} className="sr-only" />
                  {label}
                </label>
              ))}
              {/* ponytail: online payment needs a merchant account (Alif / DC / Payme), wire it into /orders when one exists */}
              <span className="rounded-lg border-2 border-dashed border-line px-2 py-2.5 text-center text-muted">Онлайн скоро</span>
            </div>
            <p className="mt-2 text-xs text-muted">Официант принесёт терминал или сдачу к столу.</p>
          </fieldset>

          <div className="ticket-rule my-5" />

          <dl className="space-y-1 font-mono">
            {bonusOff > 0 && (
              <div className="flex justify-between text-sm text-muted">
                <dt>Бонусы</dt>
                <dd>−{bonusOff}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <dt className="font-display text-lg font-bold uppercase">Итого</dt>
              <dd className="text-2xl font-bold">{som(total - bonusOff)}</dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-ketchup/10 px-3 py-2.5 text-sm text-ketchup">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="mt-5 w-full rounded-2xl bg-ketchup py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Отправляем…" : "Отправить на кухню"}
          </button>
        </>
      )}
    </form>
  );
}
