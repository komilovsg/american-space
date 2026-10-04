"use client";

import { useEffect, useRef, useState } from "react";
import { post, type Cart, type Item } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string; items?: string[] };

const STARTERS = ["Что взять до 60 сомони?", "Хочу что-то без мяса", "Что самое популярное?", "Голодные, нас трое"];

export default function Chat({
  items,
  cart,
  change,
}: {
  items: Record<string, Item>;
  cart: Cart;
  change: (id: string, d: number) => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  async function send(content: string) {
    content = content.trim();
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const res = await post<{ reply: string; items: string[] }>("/chat", {
        messages: next.slice(-12).map(({ role, content }) => ({ role, content })),
      });
      setMsgs([...next, { role: "assistant", content: res.reply, items: res.items }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[80dvh] flex-col overflow-hidden rounded-3xl bg-card lg:h-[70dvh]">
      <div className="border-b border-line px-5 py-4">
        <p className="font-display text-lg font-bold">Помощник по меню</p>
        <p className="text-sm text-muted">Подскажет блюда под бюджет, вкус и компанию</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border-2 border-ink px-3.5 py-2 text-sm font-medium hover:bg-ink hover:text-paper">
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-10 flex justify-end" : "mr-6"}>
            <div className={`rounded-2xl px-4 py-2.5 leading-snug ${m.role === "user" ? "bg-ink text-paper" : "bg-paper"}`}>
              <p className="whitespace-pre-line">{m.content}</p>
              {!!m.items?.length && (
                <ul className="mt-3 space-y-2">
                  {m.items.map((id) => (
                    <li key={id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
                      <span className="min-w-0 flex-1 truncate font-medium">{items[id].name}</span>
                      <span className="font-mono text-sm">{items[id].price}</span>
                      <button
                        onClick={() => change(id, 1)}
                        className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-paper"
                        aria-label={`Добавить ${items[id].name} в чек`}
                      >
                        {cart[id] ? `+ ещё (${cart[id]})` : "+ в чек"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="mr-6 inline-block rounded-2xl bg-paper px-4 py-2.5 text-muted">Смотрю меню…</p>}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Например: острое и недорого"
          aria-label="Сообщение помощнику"
          className="min-w-0 flex-1 rounded-xl border-2 border-line px-3 py-2.5 focus:border-ink"
        />
        <button disabled={busy || !text.trim()} className="rounded-xl bg-ink px-4 font-semibold text-paper disabled:opacity-40">
          Спросить
        </button>
      </form>
    </div>
  );
}
