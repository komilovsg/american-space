import { API_URL, type Menu } from "@/lib/api";
import MenuApp from "./menu-app";

export default async function Page({ searchParams }: PageProps<"/">) {
  const { t } = await searchParams;
  const table = Number(Array.isArray(t) ? t[0] : t) || null;
  const menu: Menu | null = await fetch(`${API_URL}/menu`, { next: { revalidate: 300 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (!menu) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold">Меню не загрузилось</p>
          <p className="mt-2 text-muted">Обновите страницу или позовите официанта.</p>
        </div>
      </main>
    );
  }
  return <MenuApp menu={menu} tableFromQr={table} />;
}
