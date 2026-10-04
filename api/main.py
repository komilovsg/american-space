import os
import re
from contextlib import contextmanager

import httpx
import psycopg
from fastapi import FastAPI, HTTPException
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

from menu import MENU, ITEMS

BONUS_RATE = 0.05  # 5% of the paid amount comes back as bonuses
BONUS_MAX_SHARE = 0.5  # bonuses can cover at most half of the bill
AI_MODEL = os.getenv("AI_MODEL", "anthropic/claude-haiku-4.5")

app = FastAPI(title="American Space API")

SCHEMA = """
create table if not exists users (
  phone text primary key,
  bonus integer not null default 0 check (bonus >= 0),
  created_at timestamptz not null default now()
);
create table if not exists orders (
  id serial primary key,
  phone text not null references users(phone),
  table_no integer not null,
  items jsonb not null,
  total integer not null,
  bonus_used integer not null default 0,
  bonus_earned integer not null default 0,
  payment text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists orders_phone_idx on orders(phone, created_at desc);
"""
_schema_ready = False


@contextmanager
def db():
    global _schema_ready
    with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row) as conn:
        if not _schema_ready:
            conn.execute(SCHEMA)  # ponytail: create-if-missing on cold start, switch to migrations when schema starts changing
            _schema_ready = True
        yield conn


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 9:  # local Tajik number without country code
        digits = "992" + digits
    if not 11 <= len(digits) <= 15:
        raise HTTPException(422, "Введите номер полностью, например +992 90 123 45 67")
    return "+" + digits


class PhoneIn(BaseModel):
    phone: str


class LineIn(BaseModel):
    id: str
    qty: int = Field(ge=1, le=50)


class OrderIn(BaseModel):
    phone: str
    table: int = Field(ge=1, le=999)
    items: list[LineIn] = Field(min_length=1, max_length=50)
    use_bonus: bool = False
    payment: str = Field(pattern="^(card|cash)$")
    comment: str = Field(default="", max_length=300)


class ChatMsg(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(max_length=1000)


class ChatIn(BaseModel):
    messages: list[ChatMsg] = Field(min_length=1, max_length=20)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/menu")
def menu():
    return MENU


@app.post("/auth")
def auth(body: PhoneIn):
    phone = normalize_phone(body.phone)
    with db() as conn:
        user = conn.execute(
            "insert into users (phone) values (%s) on conflict (phone) do update set phone = excluded.phone returning phone, bonus",
            (phone,),
        ).fetchone()
    return user


@app.get("/users/{phone}")
def profile(phone: str):
    phone = normalize_phone(phone)
    with db() as conn:
        user = conn.execute("select phone, bonus from users where phone = %s", (phone,)).fetchone()
        if not user:
            raise HTTPException(404, "Номер не найден. Оформите первый заказ.")
        user["orders"] = conn.execute(
            "select id, table_no, items, total, bonus_used, bonus_earned, payment, status, created_at "
            "from orders where phone = %s order by created_at desc limit 30",
            (phone,),
        ).fetchall()
    return user


def price_lines(lines: list[LineIn]) -> tuple[list[dict], int]:
    """Prices come from the server menu only, never from the client."""
    priced, total = [], 0
    for line in lines:
        item = ITEMS.get(line.id)
        if not item:
            raise HTTPException(422, f"Позиции {line.id} нет в меню")
        priced.append({"id": item["id"], "name": item["name"], "price": item["price"], "qty": line.qty})
        total += item["price"] * line.qty
    return priced, total


def split_bonus(total: int, balance: int, use_bonus: bool) -> tuple[int, int]:
    used = min(balance, int(total * BONUS_MAX_SHARE)) if use_bonus else 0
    earned = int((total - used) * BONUS_RATE)
    return used, earned


@app.post("/orders")
def create_order(body: OrderIn):
    phone = normalize_phone(body.phone)
    items, total = price_lines(body.items)
    if body.comment:
        items.append({"comment": body.comment.strip()})
    with db() as conn, conn.transaction():
        conn.execute("insert into users (phone) values (%s) on conflict do nothing", (phone,))
        balance = conn.execute("select bonus from users where phone = %s for update", (phone,)).fetchone()["bonus"]
        used, earned = split_bonus(total, balance, body.use_bonus)
        order = conn.execute(
            "insert into orders (phone, table_no, items, total, bonus_used, bonus_earned, payment) "
            "values (%s, %s, %s, %s, %s, %s, %s) returning id, total, bonus_used, bonus_earned, status, created_at",
            (phone, body.table, Jsonb(items), total, used, earned, body.payment),
        ).fetchone()
        bonus = conn.execute(
            "update users set bonus = bonus - %s + %s where phone = %s returning bonus", (used, earned, phone)
        ).fetchone()["bonus"]
    return {**order, "to_pay": total - used, "bonus": bonus}


def menu_for_prompt() -> str:
    rows = []
    for cat in MENU["categories"]:
        rows.append(f"## {cat['name']}")
        rows += [f"- [{i['id']}] {i['name']} — {i['price']} с. {i['desc']} {' '.join(i.get('tags', []))}" for i in cat["items"]]
    return "\n".join(rows)


SYSTEM = (
    "Ты официант-помощник ресторана American Space. Помогаешь гостю выбрать блюда только из меню ниже. "
    "Отвечай коротко (до 4 предложений), дружелюбно, на языке гостя. Учитывай бюджет, аллергии и голод. "
    "Когда советуешь блюдо, пиши его id в квадратных скобках, например [burger-classic], чтобы гость мог добавить его в чек. "
    "Не выдумывай блюда и цены. Цены в сомони (с.).\n\nМЕНЮ:\n"
)


@app.post("/chat")
def chat(body: ChatIn):
    key = os.getenv("AI_GATEWAY_API_KEY") or os.getenv("VERCEL_OIDC_TOKEN")
    if not key:
        raise HTTPException(503, "Помощник пока не подключен. Позовите официанта — он подскажет.")
    try:
        res = httpx.post(
            "https://ai-gateway.vercel.sh/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": AI_MODEL,
                "max_tokens": 400,
                "messages": [{"role": "system", "content": SYSTEM + menu_for_prompt()}]
                + [m.model_dump() for m in body.messages],
            },
            timeout=30,
        )
        res.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(502, "Помощник не ответил. Спросите ещё раз через минуту.")
    reply = res.json()["choices"][0]["message"]["content"]
    ids = [i for i in dict.fromkeys(re.findall(r"\[([a-z0-9-]+)\]", reply)) if i in ITEMS]
    return {"reply": re.sub(r"\s*\[([a-z0-9-]+)\]", "", reply), "items": ids}
