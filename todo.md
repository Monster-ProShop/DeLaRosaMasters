# Per-Game Gold Circle Logic Update

## Tasks
- [x] Create feature branch `feature/per-game-gold-circle`
- [x] Replace `findGlobalHighGame()` with `findHighGamePerGame()` that returns `{ [gNum]: maxNet }` (per-game highest across all players/categories)
- [x] Update `renderPlayerStandings()` to use per-game max map; apply gold circle when `net === highPerGame[gNum]` (ties get circles automatically)
- [x] Update footnote text to reflect per-game highlight with ties
- [x] Test in-browser with dummy data (verify multiple circles per game + ties)
- [ ] Commit, push, open PR, merge to main
- [ ] Verify on live site
