"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { dishPhoto, load, save, som, type Cart, type Item, type Menu } from "@/lib/api";
import Chat from "./chat";
import Ticket from "./ticket";

export default function MenuApp({ menu, tableFromQr }: { menu: Menu; tableFromQr: number | null }) {
  const [cart, setCart] = useState<Cart>({});
  const [table, setTable] = useState<number | null>(tableFromQr);
  const [bonus, setBonus] = useState<number | null>(null);
  const [active, setActive] = useState(menu.categories[0].id);
  const ticketRef = useRef<HTMLDialogElement>(null);
  const chatRef = useRef<HTMLDialogElement>(null);
  const dishRef = useRef<HTMLDialogElement>(null);
  const [dish, setDish] = useState<Item | null>(null);
  const openDish = (item: Item) => {
    setDish(item);
    dishRef.current?.showModal();
  };

  const items = useMemo(() => Object.fromEntries(menu.categories.flatMap((c) => c.items.map((i) => [i.id, i]))), [menu]);

  // Restore this device's cart/table/bonus after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore device state from localStorage after hydration
    setCart(load<Cart>("as:cart", {}));
    if (tableFromQr) save("as:table", tableFromQr);
    else setTable(load<number | null>("as:table", null));
    setBonus(load<number | null>("as:bonus", null));
  }, [tableFromQr]);
  useEffect(() => {
    save("as:cart", cart);
  }, [cart]);

  // Highlight the category currently on screen.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    menu.categories.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [menu]);

  const change = (id: string, delta: number) =>
    setCart((c) => {
      const qty = (c[id] ?? 0) + delta;
      const next = { ...c };
      if (qty > 0) next[id] = qty;
      else delete next[id];
      return next;
    });

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((sum, [id, q]) => sum + (items[id]?.price ?? 0) * q, 0);

  const ticket = (
    <Ticket
      cart={cart}
      items={items}
      table={table}
      setTable={setTable}
      change={change}
      onOrdered={(b) => {
        setCart({});
        setBonus(b);
        save("as:bonus", b);
      }}
    />
  );

  return (
    <div className="mx-auto max-w-[1280px] lg:grid lg:grid-cols-[200px_minmax(0,1fr)_380px] lg:gap-10 lg:px-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur lg:col-span-3 lg:static lg:bg-transparent">
        <div className="flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2 lg:px-0 lg:pt-8 lg:pb-6">
          <div className="min-w-0">
            <p className="font-display text-[15px] font-black tracking-tight uppercase leading-none lg:text-2xl">
              American<span className="text-ketchup">✦</span>Space
            </p>
            <p className="mt-1 font-mono text-xs text-muted">{table ? `стол ${table} · заказ прямо отсюда` : "бургеры · гриль · шейки"}</p>
          </div>
          <Link
            href="/me"
            className="shrink-0 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-sm font-medium hover:bg-ink hover:text-paper"
          >
            <span className="text-mustard">★</span> {bonus ?? "Бонусы"}
          </Link>
        </div>
        {/* Category chips, mobile/tablet */}
        <nav aria-label="Разделы меню" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {menu.categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active === c.id ? "bg-ink text-paper" : "bg-card text-ink"
              }`}
            >
              {c.name}
            </a>
          ))}
        </nav>
      </header>

      {/* Category rail, desktop */}
      <nav aria-label="Разделы меню" className="hidden lg:block">
        <ul className="sticky top-8 space-y-1">
          {menu.categories.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className={`block py-1.5 font-display text-lg font-medium transition-colors ${active === c.id ? "text-ketchup" : "text-muted hover:text-ink"}`}
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Menu board */}
      <main className="px-4 pb-40 lg:px-0 lg:pb-24">
        {menu.categories.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-32 pt-6 first:pt-2 lg:scroll-mt-8">
            <h2 className="mb-1 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">{c.name}</h2>
            <ul>
              {c.items.map((item) => (
                <Row key={item.id} item={item} qty={cart[item.id] ?? 0} change={change} open={openDish} eager={c === menu.categories[0]} />
              ))}
            </ul>
          </section>
        ))}
      </main>

      {/* Ticket, desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-8">{ticket}</div>
      </aside>

      {/* Bottom bar, mobile/tablet */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-gradient-to-t from-paper via-paper/95 to-transparent lg:hidden">
        <button
          onClick={() => chatRef.current?.showModal()}
          className="rounded-2xl border-2 border-ink bg-card px-4 py-3.5 font-semibold"
        >
          Помочь выбрать
        </button>
        <button
          onClick={() => ticketRef.current?.showModal()}
          className="flex flex-1 items-center justify-between rounded-2xl bg-ink px-4 py-3.5 font-semibold text-paper"
        >
          <span>Чек{count ? ` · ${count}` : ""}</span>
          <span className="font-mono">{som(total)}</span>
        </button>
      </div>

      {/* Chat button, desktop */}
      <button
        onClick={() => chatRef.current?.showModal()}
        className="fixed bottom-8 left-8 z-30 hidden rounded-2xl bg-ink px-5 py-3.5 font-semibold text-paper shadow-lg lg:block"
      >
        Помочь выбрать
      </button>

      <Sheet refObj={ticketRef} label="Ваш чек">
        {ticket}
      </Sheet>
      <Sheet refObj={dishRef} label={dish?.name ?? "Блюдо"}>
        {dish && (
          <div className="overflow-hidden rounded-3xl bg-card">
            <Image src={dishPhoto(dish.id)} alt={dish.name} width={640} height={640} sizes="(min-width: 640px) 448px, 100vw" className="aspect-[4/3] w-full object-cover sm:aspect-square" />
            <div className="p-5">
              <div className="flex items-end gap-2">
                <h3 className="font-display text-2xl font-bold leading-tight">{dish.name}</h3>
                <span className="leader" aria-hidden />
                <span className="font-mono text-2xl font-semibold">{dish.price}</span>
              </div>
              <p className="mt-2 text-muted">{dish.desc}</p>
              <Meta item={dish} />
              <div className="mt-5 flex items-center gap-3">
                <Stepper item={dish} qty={cart[dish.id] ?? 0} change={change} big />
                <button onClick={() => dishRef.current?.close()} className="ml-auto font-semibold text-muted underline">
                  К меню
                </button>
              </div>
            </div>
          </div>
        )}
      </Sheet>
      <Sheet refObj={chatRef} label="Помощник по меню" wide>
        <Chat items={items} cart={cart} change={change} />
      </Sheet>
    </div>
  );
}

function Row({
  item,
  qty,
  change,
  open,
  eager,
}: {
  item: Item;
  qty: number;
  change: (id: string, d: number) => void;
  open: (item: Item) => void;
  eager: boolean;
}) {
  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-0 sm:gap-5">
      <button onClick={() => open(item)} aria-label={`Подробнее: ${item.name}`} className="shrink-0 overflow-hidden rounded-2xl">
        <Image
          src={dishPhoto(item.id)}
          alt=""
          width={256}
          height={256}
          sizes="(min-width: 640px) 144px, 112px"
          loading={eager ? "eager" : "lazy"}
          className="size-28 bg-line object-cover transition-transform duration-300 hover:scale-105 sm:size-36"
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <button onClick={() => open(item)} className="flex items-end gap-2 text-left">
          <h3 className="text-[17px] font-semibold leading-tight sm:text-lg">{item.name}</h3>
          <span className="leader" aria-hidden />
          <span className="font-mono text-[17px] font-semibold">{item.price}</span>
        </button>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">{item.desc}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Meta item={item} />
          <Stepper item={item} qty={qty} change={change} />
        </div>
      </div>
    </li>
  );
}

function Meta({ item }: { item: Item }) {
  return (
    <p className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-xs text-muted">
      <span>{item.weight}</span>
      {item.tags?.map((t) => (
        <span key={t} className={t === "остро" ? "text-ketchup" : t === "хит" || t === "шеф советует" ? "text-ink" : ""}>
          {t}
        </span>
      ))}
    </p>
  );
}

function Stepper({ item, qty, change, big }: { item: Item; qty: number; change: (id: string, d: number) => void; big?: boolean }) {
  if (!qty)
    return (
      <button
        aria-label={`Добавить ${item.name}`}
        onClick={() => change(item.id, 1)}
        className={`shrink-0 rounded-full border-2 border-ink font-semibold leading-none transition-colors hover:bg-ink hover:text-paper ${
          big ? "bg-ink px-6 py-3.5 text-paper" : "grid h-10 w-10 place-items-center text-xl"
        }`}
      >
        {big ? `В чек · ${som(item.price)}` : "+"}
      </button>
    );
  return (
    <div className="flex shrink-0 items-center rounded-full bg-ink text-paper">
      <button aria-label={`Убрать ${item.name}`} onClick={() => change(item.id, -1)} className={`${big ? "h-12 w-12" : "h-10 w-10"} text-xl leading-none`}>
        −
      </button>
      <span className="w-5 text-center font-mono font-semibold" aria-live="polite">
        {qty}
      </span>
      <button aria-label={`Добавить ещё ${item.name}`} onClick={() => change(item.id, 1)} className={`${big ? "h-12 w-12" : "h-10 w-10"} text-xl leading-none`}>
        +
      </button>
    </div>
  );
}

function Sheet({
  refObj,
  label,
  wide,
  children,
}: {
  refObj: React.RefObject<HTMLDialogElement | null>;
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <dialog
      ref={refObj}
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && refObj.current?.close()}
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none bg-transparent p-0 sm:m-auto sm:max-w-md ${wide ? "lg:max-w-lg" : ""}`}
    >
      <div className="px-2 pb-[max(env(safe-area-inset-bottom),8px)] sm:p-0">
        <button
          onClick={() => refObj.current?.close()}
          className="mx-auto mb-2 block rounded-full bg-paper px-4 py-1.5 text-sm font-semibold"
        >
          Закрыть
        </button>
        {children}
      </div>
    </dialog>
  );
}
