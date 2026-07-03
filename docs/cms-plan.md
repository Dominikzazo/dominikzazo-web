# CMS / Admin plán — dominikzazo.sk

Návrh jednoduchého CMS, cez ktorý Dominik (netechnický majiteľ) upravuje obsah webu cez UI namiesto úpravy kódu.

Filozofia zostáva rovnaká ako pri Clerk integrácii: **tenký wrapper v `lib/`**, minimálny vendor lock, žiadne ťažké závislosti. Presne tak, ako `lib/members/session.ts` obaľuje Clerk (`getMember()`), tak aj úložisko obsahu obalíme jednou vrstvou `lib/cms/*`, aby sa backend dal vymeniť zmenou jedného súboru.

---

## 0. Súčasný stav (čo nahrádzame)

Obsah je dnes **hardcoded v React komponentoch**:

| Kde | Čo | Tvar dát |
|-----|-----|----------|
| `components/sections/Citam.tsx` | zoznam kníh (`BOOKS: Book[]`) | title, author, status, year, note, tags[] |
| `components/HandwrittenMap.tsx` | mapové piny (`MAP_CITIES_SVG: MapCity[]`) | name, lon, lat, status, emoji, note |
| `components/sections/Cestovanie.tsx` | mapové piny + Tokio extra (`ALL_PLACES`) | to isté ako MapCity |
| `components/sections/*.tsx` (Home, Maj, Myslienky, Projekty, OMne) | generické texty homepage | rôzne |
| `app/clenska/obsah/page.tsx` | premium placeholdery (`ESSAYS`, PDF blok) | title, description |

Auth je hotový: `proxy.ts` (clerkMiddleware chráni `/clenska/obsah(.*)`), `lib/members/session.ts` (`getMember()`), webhook `app/api/members/register-webhook`. Fonty a farby v `app/layout.tsx` + `app/globals.css`: cream `#fafaf8`, gold `#c9a96e`, text `#1a1a1a`, Lora / Inter / Caveat cez CSS premenné.

Cieľom je presunúť tieto dáta do úložiska a servírovať ich cez `lib/cms/`, bez rozbitia existujúcich stránok.

---

## 1. Dátový model / schéma

Dva balíky obsahu: **verejný** a **premium (Kruh)**. Každý typ má stabilné `id`, `order` (radenie v UI) a časové značky.

### 1.1 Verejný obsah

**Book (kniha — `Citam`)**
```ts
interface Book {
  id: string
  title: string
  author: string
  status: 'práve čítam' | 'prečítané' | 'chcem čítať'
  year: number | null
  note: string | null
  tags: string[]
  order: number
  updatedAt: string
}
```

**Place (mapový pin + karta — `Cestovanie` / `HandwrittenMap`)**
```ts
interface Place {
  id: string
  name: string
  lon: number          // zemepisná dĺžka (mapa počíta x)
  lat: number          // zemepisná šírka (mapa počíta y)
  status: 'home' | 'visited' | 'last' | 'wishlist'
  emoji: string
  note: string
  onMap: boolean       // false = mimo záberu SVG mapy (napr. Tokio), zobrazí sa len ako karta
  order: number
  updatedAt: string
}
```
> Poznámka: projekcia `mp(lon, lat)` a farby `DOT_COLOR` v `HandwrittenMap.tsx` ostávajú v kóde (sú to konštanty renderu, nie obsah). CMS dodá len pole pinov.

**Section (generický homepage blok)** — voliteľný, editovateľné texty vybraných sekcií:
```ts
interface Section {
  id: string           // 'home' | 'maj' | 'o-mne' | ...
  slug: string
  title: string
  body: string         // markdown alebo plain text
  order: number
  published: boolean
  updatedAt: string
}
```
> Sekcie ako Home/OMne majú veľa custom layoutu. Fáza 1 ich necháva v kóde; CMS spravuje len jednoduché textové polia, ktoré do nich komponenty načítajú. Nesnažíme sa robiť page-builder.

### 1.2 Premium obsah (Kruh)

**Category** — usporiadanie premium obsahu:
```ts
interface Category {
  id: string
  name: string         // napr. „Eseje", „Materiály", „Videá"
  slug: string
  order: number
}
```

**PremiumItem** — jeden diskriminovaný typ pre video / PDF / článok:
```ts
interface PremiumItem {
  id: string
  categoryId: string
  type: 'video' | 'pdf' | 'article'
  title: string
  excerpt: string             // krátky popis do zoznamu
  order: number
  published: boolean
  updatedAt: string

  // article
  body?: string               // markdown, len type === 'article'

  // pdf / video — odkaz na médium v Blobe (private)
  mediaKey?: string           // pathname/kľúč v Blob store (nie verejná URL!)
  mediaSize?: number          // bajty
  pages?: number              // pdf, voliteľné
  durationSec?: number        // video, voliteľné
  posterKey?: string          // video náhľad, voliteľné
}
```

Kľúčové: pri PDF/videu ukladáme **len `mediaKey`** (interný kľúč), nikdy nie verejnú URL. Servírovanie ide cez gated route (viď §5).

---

## 2. Voľba úložiska

Požiadavky: Vercel Hobby, netechnický editor, silná preferencia „no vendor lock, keep it thin", už existuje tenký wrapper nad Clerk.

| Možnosť | Klady | Zápory |
|---------|-------|--------|
| **(a) DB cez Vercel Marketplace — Neon Postgres** | Štruktúrované, relačné (kategórie ↔ položky), Hobby free tier stačí, dobré pre editovanie z UI, transakcie, jednoduché migrácie. Auto-provisioning env cez Marketplace. | Vyžaduje SQL/ORM vrstvu; ďalší vendor (ale dáta sú štandardný Postgres → prenosné, nízky lock-in). |
| **(a') DB — Upstash Redis** | Extrémne jednoduché, rýchle, KV. | Zlé na relačné dotazy/radenie/kategórie; obsah ako „dokumenty" v KV je krehké pri raste. Skôr cache než CMS. |
| **(b) Súbory MDX + git commity** | Zero runtime vendor, verzované v gite, „content as code". | Editovanie **vyžaduje git commit → netechnický človek to nezvládne z UI** bez postavenia git-write API (GitHub App/token). Krehké, veľa práce. Nevhodné pre médiá. |
| **(c) Headless CMS (Sanity/Payload)** | Hotové admin UI, kategórie, médiá. | Silný vendor lock (Sanity) alebo ťažká infra (Payload = vlastná DB + server). Proti „keep it thin". Ďalší login pre Dominika mimo webu. |

### ✅ Odporúčanie: Neon Postgres (Vercel Marketplace) + tenký `lib/cms/` wrapper

Dôvody:
- **Relačný model sedí** (Category ↔ PremiumItem, radenie, filtre podľa statusu/typu).
- **Nízky lock-in**: štandardný Postgres, dáta sa dajú kedykoľvek vyexportovať a presunúť. Presne ako pri Clerk — obalíme ho tenkou vrstvou.
- **Hobby-friendly**: Neon free tier (autoscale-to-zero) bohato stačí na osobný web; env premenné napojí Marketplace automaticky.
- **Admin UI si postavíme vlastné** (jednoduché formuláre v brande webu), takže Dominik needituje kód ani sa nelogeuje do cudzieho nástroja.

**Tenký wrapper — kľúčový princíp.** Celá appka volá `lib/cms/*`, nikdy nie DB priamo:

```
lib/cms/
  types.ts        // Book, Place, Section, Category, PremiumItem (zdroj pravdy pre typy)
  db.ts           // jediné miesto s Neon klientom (@neondatabase/serverless)
  books.ts        // listBooks(), getBook(), upsertBook(), deleteBook(), reorder()
  places.ts       // listPlaces(), ...
  sections.ts     // getSection(slug), ...
  premium.ts      // listCategories(), listItems(categoryId), upsertItem(), ...
  media.ts        // wrapper nad Vercel Blob (put/del/signed serve)
```

Ak raz vymeníme Neon za iné úložisko, meníme len `db.ts` + telá funkcií, nie volajúci kód. Rovnaká zmluva ako `getMember()`.

**Ľahká alternatíva pre Fázu 1 (voliteľné):** kým sa nezavedie DB, ten istý interface `lib/cms/*` môže mať dočasnú implementáciu čítajúcu z JSON súboru v repo. Interface ostáva; mení sa len backing store. Toto umožní postaviť admin UI a migráciu ešte pred provisioningom DB.

---

## 3. Úložisko médií (PDF, videá) — Vercel Blob

- **Verejné assety** (napr. obálky kníh, ak pribudnú) → Blob s `access: 'public'`, priama CDN URL. OK.
- **Premium médiá (PDF/video pre Kruh)** → **musia byť gated**. Vercel Blob je ale technicky vždy verejný cez unguessable URL — nemá per-request auth. Preto:
  - Ukladáme s **náhodným, neuhádnuteľným pathname** (`addRandomSuffix`), a URL **nikdy nevraciame klientovi priamo**.
  - Servírujeme cez vlastnú Next route (`/clenska/media/[id]`), ktorá **najprv overí členstvo** (`getMember()`), a až potom fetchne blob na serveri a streamne ho (proxy), alebo presmeruje na krátkodobú URL. Viď §5.
- **Limity Hobby:**
  - Blob má na Hobby štedrý storage/prenos free tier, ale **veľké videá (stovky MB, GB) prenos rýchlo minú** a serverless funkcia má limit na dobu behu/veľkosť odpovede.
  - **Odporúčanie:** PDF a krátke audio/video (do ~pár desiatok MB) drž v Blobe. **Dlhé/HD videá NE-hostuj sám** — daj ich na privátny/unlisted YouTube alebo Vimeo a v `PremiumItem` ulož len embed odkaz (typ `video` s `mediaKey` = URL embedu). Gating potom = nezverejniť odkaz nečlenom (stránka je aj tak za Clerk middleware). Ušetrí to prenos aj náklady a je to v duchu „keep it thin".

---

## 4. Admin UI na `/clenska/admin` — len pre Dominika

### 4.1 Gating (kto sa dostane dnu)

Route `/clenska/obsah` je dnes za Clerk pre **každého člena**. Admin musí byť **len Dominik**. Dve možnosti:

| Mechanizmus | Klady | Zápory |
|-------------|-------|--------|
| **Email allowlist v `getMember()`** | Zero setup, žiadne Clerk metadata, ihneď funguje, ľahko čitateľné | Zmena admina = redeploy (u 1 človeka nevadí) |
| **Clerk `publicMetadata.role = 'admin'`** | Flexibilné bez redeployu, škáluje na viac adminov | Treba nastaviť metadata v Clerk dashboarde, viac pohyblivých častí |

**✅ Odporúčanie: email allowlist** (pri jednom netechnickom majiteľovi je to najtenšie riešenie). Rozšírime existujúci wrapper — pridáme do `Member` flag `isAdmin`:

```ts
// lib/members/session.ts (rozšírenie)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'zazodominik@gmail.com')
  .split(',').map(e => e.trim().toLowerCase())

// v getMember() po zistení emailu:
isAdmin: email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false
```

Ochrana v troch vrstvách:
1. **`proxy.ts`** — pridaj `/clenska/admin(.*)` do `isProtected` (vynúti prihlásenie).
2. **Layout `app/clenska/admin/layout.tsx`** — `const m = await getMember(); if (!m.isAdmin) redirect('/clenska')`.
3. **Každá admin API mutácia** — na začiatku znova `if (!(await getMember()).isAdmin) return 403`. Nikdy nespoliehaj len na skrytie UI.

> `publicMetadata.role` necháme ako budúcu možnosť — wrapper `isAdmin` skryje, ktorý mechanizmus sa reálne používa, takže prechod je bezbolestný.

### 4.2 Obrazovky (v brande webu)

Vizuál drží existujúci štýl: cream `#fafaf8`, gold `#c9a96e`, Lora nadpisy, Inter text, `Card`/`Tag` komponenty, zaoblené rohy (radius ~22), jemné tiene. Žiadny „dashboard" pocit — pokojné, minimalistické.

- **`/clenska/admin`** — rozcestník: dlaždice „Knihy", „Cestovanie / Mapa", „Sekcie", „Kruh — kategórie", „Kruh — obsah". Počty položiek.
- **Knihy** — tabuľka/zoznam s drag-to-reorder (alebo `order` input), tlačidlá Upraviť/Zmazať, „+ Pridať knihu". Formulár: title, author, status (select), year, note (textarea), tags (chip input).
- **Cestovanie / Mapa** — zoznam pinov; formulár: name, lon, lat, status (select), emoji, note, `onMap` checkbox. Voliteľne malý náhľad mapy s pinom, aby videl, kam padne.
- **Sekcie** — jednoduchý editor textových polí (title/body) pre povolené sekcie.
- **Kruh — kategórie** — CRUD kategórií + radenie.
- **Kruh — obsah** — zoznam `PremiumItem` filtrovateľný podľa kategórie/typu. Formulár podľa typu:
  - `article` → title, excerpt, body (markdown/textarea), kategória, published.
  - `pdf` → title, excerpt, **upload PDF** (drag&drop → Blob, uloží `mediaKey`), pages, kategória.
  - `video` → title, excerpt, buď upload (krátke) alebo embed URL, poster, kategória.
- **Media upload** — komponent, čo cez server action / route pošle súbor do Blobu (private), vráti `mediaKey`. Progress bar, validácia typu/veľkosti.

Formuláre = React Server Components + **Server Actions** (žiadne extra API vrstvy kde to netreba), mutácie idú cez `lib/cms/*`, po uložení `revalidatePath()` verejných stránok.

---

## 5. Ako premium obsah zostáva gated (server-side)

Nič, čo je len pre členov, sa nikdy nesmie dostať k neprihlásenému:

1. **Stránka `/clenska/obsah`** už je za `clerkMiddleware` + druhá poistka `getMember().isAuthed` v page. Zoznam premium položiek načíta cez `lib/cms/premium.ts` **na serveri** (RSC). Do klienta ide len title/excerpt/typ — **nikdy `mediaKey` ani Blob URL**.

2. **Servírovanie súboru** — route `app/clenska/media/[id]/route.ts`:
   ```
   const m = await getMember()
   if (!m.isAuthed) return new Response('Unauthorized', { status: 401 })
   const item = await getPremiumItem(id)        // z DB podľa id, nie podľa mediaKey
   if (!item || !item.published) return 404
   // fetchni blob na serveri podľa item.mediaKey a streamni späť
   const res = await fetch(blobUrlFor(item.mediaKey))   // server-side, URL sa nikdy neposiela klientovi
   return new Response(res.body, { headers: { 'Content-Type': ..., 'Content-Disposition': 'inline' }})
   ```
   Klient teda drží len `/clenska/media/<id>` (interné, gated), nie samotnú Blob URL.

3. **Middleware** — pridaj aj `/clenska/media(.*)` do `isProtected` v `proxy.ts`, aby ani priamy request na route neprešiel bez prihlásenia.

4. **Video cez YouTube/Vimeo (odporúčané pri veľkých):** unlisted odkaz sa vloží až v RSC pre prihláseného člena. Nie je to kryptograficky nepriestrelné (kto má odkaz, pozrie), ale pri osobnom brande je to primeraný kompromis a šetrí prenos. Pre skutočne citlivé PDF použi Blob-proxy route vyššie.

> Zlaté pravidlo: gating rob **na serveri pred servírovaním bajtov**, nie skrývaním v CSS/JS. UI viditeľnosť je len kozmetika.

---

## 6. Migračná cesta (bez rozbitia stránok)

Cieľ: presun hardcoded dát do CMS tak, aby stránky fungovali počas celého prechodu.

1. **Extrahuj typy do `lib/cms/types.ts`** — `Book`, `Place` (= dnešný `MapCity` + `onMap`). Komponenty prestanú definovať vlastné interface a budú importovať odtiaľ. Žiadna zmena správania.
2. **Seed dáta** — jednorazový skript / SQL insert, ktorý nasype existujúce `BOOKS` a `MAP_CITIES_SVG` (+ Tokio ako `onMap:false`) do DB (alebo do JSON, ak sa ide Fáza-1-JSON cestou). Presné hodnoty už existujú v kóde, len ich prekopírujeme.
3. **Prepni komponenty na čítanie z `lib/cms/`:**
   - `Citam.tsx` je dnes server-friendly (žiadny `use client`) → zmeníš na `async` RSC a `const books = await listBooks()`. Render zostáva identický.
   - `Cestovanie.tsx` je `use client` (má `useState` filter/hover). Riešenie: rodič (RSC) načíta `places` cez `lib/cms/places.ts` a pošle ich do klientského `Cestovanie` ako prop. `HandwrittenMap` dostane piny (tie s `onMap:true`) tiež ako prop namiesto importu konštanty.
4. **Over paritu** — vedľa seba porovnaj starú a novú stránku; keď sedia, zmaž hardcoded polia z komponentov.
5. **Premium** — `app/clenska/obsah/page.tsx` prejde z `ESSAYS`/PDF placeholderov na `listItems()` podľa kategórií. Placeholder texty ostanú ako seed prvej kategórie „Eseje".

Každý krok je samostatne deployovateľný a reverzibilný.

---

## 7. Fázovaný plán

### Fáza 1 — Minimal viable admin (najmenšie užitočné)
Cieľ: Dominik vie z UI upraviť **knihy a mapu** — najčastejšie meniaci sa verejný obsah.

- `lib/cms/types.ts` + `lib/cms/{books,places}.ts` s implementáciou (Neon **alebo** dočasný JSON store — interface rovnaký).
- Provisioning Neon cez Vercel Marketplace (ak DB cesta) + `db.ts`.
- Rozšír `getMember()` o `isAdmin` (email allowlist, `ADMIN_EMAILS`).
- `proxy.ts`: chráň `/clenska/admin(.*)`.
- `app/clenska/admin/layout.tsx` (admin gate) + rozcestník.
- Obrazovky **Knihy** a **Cestovanie/Mapa** (list + create/edit/delete, Server Actions).
- Migrácia: extrahuj typy, seedni existujúce knihy/piny, prepni `Citam` + `Cestovanie` na čítanie z CMS.
- Po uložení `revalidatePath('/')`.

Výsledok: verejný web (knihy, mapa) je plne editovateľný bez kódu.

### Fáza 2 — Kruh premium obsah
- `lib/cms/{premium,media}.ts`, tabuľky `Category` + `PremiumItem`.
- Vercel Blob (private) napojený, upload komponent.
- Admin obrazovky **Kruh — kategórie** a **Kruh — obsah** (article/pdf/video formuláre).
- Gated servírovacia route `/clenska/media/[id]` + `/clenska/media(.*)` v `proxy.ts`.
- Prepni `app/clenska/obsah/page.tsx` z placeholderov na reálne kategórie + položky.
- Videá: rozhodni Blob vs YouTube/Vimeo embed podľa veľkosti.

### Fáza 3 — Leštenie a rozšírenia
- Editovateľné generické **Sekcie** (Home/OMne texty).
- Drag-to-reorder namiesto ručného `order`.
- Náhľad mapy v admine s live pinom.
- Voliteľne: prechod email-allowlist → `publicMetadata.role` ak pribudne druhý editor (bezbolestné vďaka `isAdmin` wrapperu).
- Voliteľne: obálky kníh cez public Blob, markdown preview pre eseje.

---

## Zhrnutie

- **Úložisko:** Neon Postgres cez Vercel Marketplace, obalené tenkou vrstvou `lib/cms/*` (rovnaká filozofia ako `getMember()` nad Clerk) → nízky vendor lock, relačný model sedí na kategórie/radenie, Hobby free tier stačí. Voliteľný dočasný JSON store za rovnakým interface pre rýchly štart.
- **Médiá:** Vercel Blob (private, neuhádnuteľný kľúč) pre PDF a krátke video; dlhé/HD video cez unlisted YouTube/Vimeo embed kvôli prenosovým limitom Hobby. Médiá sa nikdy neservírujú priamou URL.
- **Dátový model:** verejné `Book`, `Place`, `Section`; premium `Category` + `PremiumItem` (diskriminovaný typ `video|pdf|article`) s `order`, `published`, `mediaKey`.
- **Admin gating:** email allowlist (`ADMIN_EMAILS`) → nový flag `isAdmin` v `getMember()`; ochrana v 3 vrstvách (proxy middleware, admin layout redirect, re-check v každej mutácii). `publicMetadata.role` ostáva ako bezbolestná budúca alternatíva.
- **Gating premium:** vždy server-side pred servírovaním bajtov — RSC neposiela `mediaKey`/URL klientovi; súbory idú cez gated proxy route s `getMember()` kontrolou.
- **Fáza 1:** admin na `/clenska/admin` (len Dominik) pre **knihy + mapu**, migrácia hardcoded dát, `lib/cms/{books,places}.ts`. Najmenší užitočný krok, ktorý zbaví web hardcoded verejného obsahu.
