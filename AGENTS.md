# AGENTS.md

In this fork, we are team fish-able. Find our work in team/fish-able.
Just for this project, please "git push" after every commit. You are pre-authorized to push to github. This helps us collaborate in our group of four.

Guidance for coding agents working in this repository.

## What this is

Materials from Denver Water for the Explore DDD 2026 Design Storm, plus a 3D map
of their collection system. Start with `README.md`, then
`reference/Explore DDD 2026 Denver Water Design Storm Presentation.pdf` for the
challenge itself. `guide.md` explains the domain and Jake's models from zero;
`glossary.md` defines every water and statistics term.

## Ground rules

- **Denver Water's originals are read-only.** `data/`, `scripts/`, `figures/`, and
  `reference/` hold files exactly as sent. Work on copies.
- **The data terms travel with the data.** Both Denver Water notices are in
  `README.md` and `data/TERMS.md`. Keep them with any derived dataset or shared
  output. Redistribution is restricted; read them before publishing anything built
  on this data.
- **Readings are provisional.** A fresh API pull can differ from the committed CSVs;
  USGS revises values after publication. Never present a number as settled when the
  source calls it provisional.
- **Never invent numbers.** Compute them from the files here, or say you cannot.
  When stating general water-treatment knowledge rather than something in these
  materials, say which it is.
- **Known data artifact:** `data/MichiganCreek.csv` shows SWE 9.0 on May 12 to 15,
  2026 between zero readings, an error in the NRCS feed. Jake replaced the station
  in his September update; the models use `data/HoosierPass.csv`.

## The 3D map

`design-storm-water-system-3d.html` is hand-maintained; there is no build step for
the page itself. It reads generated JSON from `water-system-3d/` and geodata from
`strontia-brief/`, so those directories travel with it. Serve it rather than opening
the file directly, because it fetches JSON:

```
python3 serve.py
```

`water-system-3d/README.md` says which JSON files are generated, by which script,
and which of those scripts need the network.
