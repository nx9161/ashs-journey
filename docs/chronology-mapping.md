# Chronology Mapping — Anime Watch Order → Game Chapters
**ASH'S JOURNEY — An Unofficial Fan Homage · ADR-015 · 2026-10-15**

The campaign spine follows the owner's complete Pokémon anime + movies
chronological watch order. Movies and specials are positioned as **special
story events** inside the chapter they chronologically interrupt or follow.

## Act I: The Beginning — v1 scope (PLAYABLE)

| Ch | Title | Region | Anime coverage | Special story events |
|----|-------|--------|----------------|----------------------|
| 1 | The Indigo League | Kanto | S1 Indigo League Ep 1–69, then Ep 70–82 tail | **Movie:** Mewtwo Strikes Back (after Ep 69) |
| 2 | Adventures in the Orange Islands | Orange Islands | S2 Ep 1–24, then Ep 25–36 | **Movie:** Pokémon 2000 (mid-season) · **Special:** Slowking's Day |
| 3 | The Johto Journeys | Johto | S3 Ep 1–38, then Ep 39–41 | **Movie:** Spell of the Unown |
| 4 | Johto League Champions | Johto | S4 Ep 1–21, then Ep 22–48, then Ep 49–52 | **Movies:** Mewtwo Returns · 4Ever (Celebi) |
| 5 | Master Quest | Johto | S5 Ep 1–47, then Ep 48–65 | **Movie:** Heroes (Latios & Latias) |

v1 ends with the Silver Conference (Master Quest) — per ADR-006 the Orange
League championship is staged as the coronation peak and the Silver loss as a
deliberate bridge; Larvitar's resolution + Red on Mt. Silver close as
post-game texture.

## Act II: New Horizons — v2 (ANNOUNCED, locked)

| Ch | Title | Region | Anime coverage | Special story events |
|----|-------|--------|----------------|----------------------|
| 6 | Rise Through Hoenn | Hoenn | S6 Advanced Ep 1–35, S6 Ep 36–40, S7 Advanced Challenge Ep 1–45, S7 Ep 46–52, S8 Advanced Battle Ep 1–43, S8 Ep 44–52 | **Movies:** Jirachi: Wish Maker · Destiny Deoxys · Lucario and the Mystery of Mew |
| 7 | Battle Frontier | Kanto (Frontier) | S9 Battle Frontier Ep 1–5, Special: Mastermind of Mirage Pokémon, S9 Ep 6–38, S9 Ep 39–47 | **Movie:** Ranger and the Temple of the Sea |
| 8 | Diamond & Pearl | Sinnoh | S10 Ep 1–39, S10 Ep 40–52, S11 Ep 1–34, S11 Ep 35–52, S12 Ep 1–31, S12 Ep 32–53, S13 Ep 1–21, S13 Ep 22–34, Specials: Hikari Setting Off / Nibi Gym Crisis | **Movies:** The Rise of Darkrai · Giratina and the Sky Warrior · Arceus and the Jewel of Life · Zoroark: Master of Illusions |

The Battle Frontier is the announced v2 finale (ADR-006).

## Act III: Beyond — planned, locked

| Ch | Title | Region | Anime coverage | Special story events |
|----|-------|--------|----------------|----------------------|
| 9 | Black & White | Unova | S14 Ep 1–39, S14 Ep 40–50, S15 Ep 1–49, S16 Ep 1–25, S16 Part 2 Ep 1–20, Specials: Mewtwo Prologue to Awakening, Dent and Takeshi / Iris vs Ibuki | **Movies:** Victini and Reshiram / Zekrom · Kyurem vs. the Sword of Justice · Genesect and the Legend Awakened |
| 10 | XY & XYZ | Kalos | S17 Ep 1–37, S17 Ep 38–48, S18 Ep 1–33, S18 Ep 34–45, S19 Ep 1–47, Minis: Hoopa's Surprise Ring Adventures, Mega Evolution Specials Ep 1–4, Specials: Diancie Princess of the Diamond Domain, Hoopa the Mischief Pokémon, Legend of X Y Z / Strongest Duo | **Movies:** Diancie and the Cocoon of Destruction · Hoopa and the Clash of Ages · Volcanion and the Mechanical Marvel |
| 11 | Sun & Moon | Alola | S20 Ep 1–43, S21 Ep 1–49, S22 Ep 1–54 | — |
| 12 | Journeys | World | S23 Ep 1–48, S24 Ep 1–42, S25 Ep 1–4, Mini: Arceus Chronicles Ep 1–4, S25 Ep 5–46, Special: The Distant Blue Sky, Mini: **Aim to Be a Pokémon Master Ep 1–11 (END of Ash's story)** | — |
| 13 | Horizons: A New Beginning | World | Horizons S1 Ep 1–45, S2 The Search for Laqua Ep 46–89, S3 Rising Hope Ep 90–136, S4 Wonder Voyage Ep 137–147 (start of Liko's story) | — |

## BONUS shelf — non-canon, never on the main spine

I Choose You! · The Power of Us · Secrets of the Jungle · Detective Pikachu ·
Mewtwo Strikes Back: Evolution · Pokémon Origins · Pokémon Generations ·
Twilight Wings · Pokétoon · Evolutions · Hisuian Snow · Paldean Winds ·
Pokémon Concierge · Path to the Peak

## In-game surfacing (what ships in v1)

- **Chapter title cards** (`ui.showChapterCard`) — shown when a new run starts
  (Chapter 1 now; later chapters as the arc progresses). Paper-panel card in
  the Gen 4/5 idiom; A/START/tap dismisses, auto-dismisses after 4s.
- **Journey menu** (pause menu → Journey) — all 13 chapters: playable ones
  open a detail card (arc, anime coverage, special events); locked chapters
  and the BONUS shelf render as honest disabled rows. No fake content.
- **Pokédex header** — current chapter line above the caught counter.

## Honesty rules applied

- Scope tiers are owner-visible ADRs (ADR-006 v1/v2, ADR-015 this mapping).
- Locked chapters never imply playability; the BONUS shelf is explicitly
  labeled non-canon and kept off the main spine.
- Episode/movie titles are factual references only — no copied dialogue,
  footage, or assets (IP posture unchanged, GC conditions stand).
