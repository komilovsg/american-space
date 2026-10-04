# ponytail: menu lives in code, move to a table when staff need to edit it without a deploy
MENU = {
    "currency": "с.",
    "categories": [
        {
            "id": "burgers",
            "name": "Бургеры",
            "items": [
                {"id": "burger-classic", "name": "Классический", "price": 55, "weight": "320 г",
                 "desc": "Говяжья котлета, чеддер, маринованный огурец, лук, соус American.", "tags": ["хит"]},
                {"id": "burger-double", "name": "Двойной чиз", "price": 79, "weight": "450 г",
                 "desc": "Две котлеты, двойной чеддер, бекон из говядины, горчичный соус.", "tags": ["сытно"]},
                {"id": "burger-bbq", "name": "BBQ Ранчо", "price": 68, "weight": "380 г",
                 "desc": "Котлета, луковые кольца, копчёный BBQ, халапеньо.", "tags": ["остро"]},
                {"id": "burger-chicken", "name": "Хрустящая курица", "price": 52, "weight": "340 г",
                 "desc": "Куриное бедро в панировке, коул-слоу, соус ранч."},
            ],
        },
        {
            "id": "grill",
            "name": "Гриль",
            "items": [
                {"id": "steak-ribeye", "name": "Рибай", "price": 189, "weight": "300 г",
                 "desc": "Мраморная говядина, прожарка на выбор, масло с травами.", "tags": ["шеф советует"]},
                {"id": "ribs-bbq", "name": "Рёбра BBQ", "price": 135, "weight": "550 г",
                 "desc": "Говяжьи рёбра 12 часов в коптильне, глазурь BBQ."},
                {"id": "wings", "name": "Крылья Буффало", "price": 59, "weight": "12 шт",
                 "desc": "Острый соус Буффало, сельдерей, соус блю-чиз.", "tags": ["остро"]},
            ],
        },
        {
            "id": "sides",
            "name": "Гарниры",
            "items": [
                {"id": "fries", "name": "Картофель фри", "price": 18, "weight": "150 г", "desc": "С морской солью и кетчупом.", "tags": ["вег"]},
                {"id": "fries-cheese", "name": "Фри с сыром", "price": 29, "weight": "220 г", "desc": "Сырный соус, халапеньо, зелёный лук.", "tags": ["вег"]},
                {"id": "onion-rings", "name": "Луковые кольца", "price": 22, "weight": "160 г", "desc": "В пивном кляре, соус ранч.", "tags": ["вег"]},
                {"id": "mac-cheese", "name": "Мак-н-чиз", "price": 32, "weight": "250 г", "desc": "Паста в соусе из трёх сыров, хрустящая корочка.", "tags": ["вег"]},
            ],
        },
        {
            "id": "salads",
            "name": "Салаты",
            "items": [
                {"id": "caesar", "name": "Цезарь с курицей", "price": 45, "weight": "260 г", "desc": "Романо, гренки, пармезан, соус цезарь."},
                {"id": "cobb", "name": "Кобб", "price": 49, "weight": "280 г", "desc": "Курица, авокадо, яйцо, томаты, блю-чиз."},
            ],
        },
        {
            "id": "desserts",
            "name": "Десерты",
            "items": [
                {"id": "cheesecake", "name": "Нью-Йорк чизкейк", "price": 35, "weight": "150 г", "desc": "Классический, ягодный соус.", "tags": ["вег"]},
                {"id": "brownie", "name": "Брауни с мороженым", "price": 32, "weight": "180 г", "desc": "Тёплый шоколадный брауни, ванильный шарик.", "tags": ["вег"]},
                {"id": "pancakes", "name": "Панкейки", "price": 34, "weight": "3 шт", "desc": "Кленовый сироп, сливочное масло, ягоды.", "tags": ["вег"]},
            ],
        },
        {
            "id": "drinks",
            "name": "Напитки",
            "items": [
                {"id": "shake-vanilla", "name": "Ванильный шейк", "price": 28, "weight": "400 мл", "desc": "Мороженое, молоко, взбитые сливки.", "tags": ["хит"]},
                {"id": "shake-choco", "name": "Шоколадный шейк", "price": 28, "weight": "400 мл", "desc": "Бельгийский шоколад, взбитые сливки."},
                {"id": "lemonade", "name": "Домашний лимонад", "price": 22, "weight": "500 мл", "desc": "Лимон, мята, тростниковый сахар."},
                {"id": "cola", "name": "Кола", "price": 12, "weight": "330 мл", "desc": "Стекло, со льдом."},
                {"id": "coffee", "name": "Американо", "price": 15, "weight": "250 мл", "desc": "Бесконечная доливка, как в дайнере."},
            ],
        },
    ],
}

ITEMS = {i["id"]: i for c in MENU["categories"] for i in c["items"]}
