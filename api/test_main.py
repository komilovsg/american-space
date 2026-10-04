# run: python test_main.py  (pure logic, no DB)
from fastapi import HTTPException

from main import LineIn, normalize_phone, price_lines, split_bonus, strip_ids

assert normalize_phone("90 123 45 67".replace(" ", "")[:9]) == "+992901234567"
assert normalize_phone("+992 (90) 123-45-67") == "+992901234567"
try:
    normalize_phone("123")
    raise AssertionError("short phone accepted")
except HTTPException:
    pass

items, total = price_lines([LineIn(id="fries", qty=2), LineIn(id="cola", qty=1)])
assert total == 18 * 2 + 12 and items[0]["price"] == 18
try:
    price_lines([LineIn(id="free-lunch", qty=1)])
    raise AssertionError("unknown item accepted")
except HTTPException:
    pass

assert split_bonus(100, 0, True) == (0, 5)
assert split_bonus(100, 80, True) == (50, 2)  # capped at half the bill
assert split_bonus(100, 80, False) == (0, 5)
assert strip_ids("Возьмите Картофель фри [fries].") == "Возьмите Картофель фри."
assert strip_ids("В [burger-classic] есть чеддер") == "В Классический есть чеддер"
assert strip_ids("К рибаю [steak-ribeye] возьмите") == "К рибаю возьмите"
print("ok")
