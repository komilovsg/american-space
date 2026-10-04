# American Space — QR-меню

Гость сканирует QR на столе → сразу открывается меню (без регистрации) → собирает чек → при оформлении вводит ФИО и телефон, стол уже подставлен из QR → платит картой/наличными официанту или через Alif Mobi / DC Bank → заказ уходит на кухню, на номер копятся бонусы (5%, списание до 50% чека). ИИ-помощник подсказывает блюда.

| Часть | Стек | Деплой |
|---|---|---|
| `web/` | Next.js 16, Tailwind 4 | Vercel (Root Directory: `web`) |
| `api/` | FastAPI, psycopg | Vercel Python (Root Directory: `api`) |
| БД | Postgres | Neon, free tier |
| ИИ | Gemini 2.5 Flash-Lite через Vercel AI Gateway | бесплатный месячный кредит, ключ не нужен (OIDC) |

QR для стола: `https://<домен>/?t=<номер стола>`.

## Локально

```bash
# api
cd api && uv venv -p 3.12 && uv pip install -r requirements.txt uvicorn
createdb american_space
DATABASE_URL=postgresql://localhost/american_space .venv/bin/uvicorn main:app --port 8000
.venv/bin/python test_main.py   # проверки логики цен и бонусов

# web
cd web && npm i && npm run dev   # API_URL по умолчанию http://localhost:8000
```

Фронт проксирует `/api/*` на `API_URL` (rewrites в `next.config.ts`), поэтому CORS не нужен.

## Переменные

- api: `DATABASE_URL`, `AI_MODEL`, `AI_BASE_URL` + `AI_GATEWAY_API_KEY` (любой OpenAI-совместимый провайдер: Groq, Google AI Studio), `PAYMENT_MODE=mock`
- web: `API_URL` — адрес задеплоенного api

## API

`GET /menu` · `POST /auth {phone}` · `GET /users/{phone}` · `POST /orders` · `POST /orders/{id}/mock-pay` · `POST /chat`

Цены и бонусы считаются только на сервере.

## До продакшена

- Вход по телефону без SMS/OTP: любой может ввести чужой номер и потратить его бонусы. Нужна проверка кода (SMS или Telegram-бот).
- Alif Mobi / DC Bank сейчас в тестовом режиме (`PAYMENT_MODE=mock`, деньги не списываются). После договора: редирект на банк + webhook, который ставит заказу `paid`; mock-эндпоинт выключить.
- Экран для кухни/официантов со статусами заказов.
