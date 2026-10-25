# Sources and dates awaiting human verification

Every branch in `src/data/religions.json` must have at least one source **or** be listed here by
its id in backticks (e.g. `` `b-example` ``); `pnpm validate-data` enforces this. All current
branches have sources, so the list below is about strengthening and double-checking them, not
about missing ones.

When you resolve an item, delete it here and note the change in the AGENTS.md Progress log.

## Applies to many entries

- **Britannica and Encyclopaedia Iranica URLs** were taken from exact search-result links. Both
  sites refused automated fetching (HTTP 403), so their full article text was checked only against
  search snippets. Open each link once and confirm it supports the claim it is attached to.

## Judaism

- `second-temple`: most references give 516 BCE for the completion of the rebuilt Temple;
  Schiffman gives 515 BCE. Entry is marked approximate. No Britannica / Jewish Virtual Library
  source has been verified for this entry yet.
- `orthodox-judaism`: the c. 1800 start is a conventional approximation. Consider tying it to a
  datable event (for example Moses Sofer's opposition to the Hamburg Temple, 1818–19).
- `orthodox-judaism`: the exact title of Blutinger's _Modern Judaism_ article on the "Orthodox"
  label (muse.jhu.edu/article/230171) is not confirmed; a descriptive title is used.
- `hasidic`: the YIVO page did not render; claims ("second quarter of the eighteenth century",
  Ba'al Shem Tov d. 1760) come from its search snippet.
- `b-hasidic`: the roles of Dov Ber of Mezhirech and the Vilna Gaon's opposition are standard but
  were not confirmed from a fetched page.
- `b-conservative-judaism`: date changed from the seed 1887 to **1886** (JTS founded January
  1886; classes began 1887). Confirm this is the preferred anchor.

## Christianity

- `b-early-christianity`: confirm the exact title of the Shaye Cohen essay (Harvard DASH PDF);
  the title is currently taken from the file name.
- `b-church-of-the-east`: Britannica says the Persian church "formally proclaimed its full
  independence" in 424; the Gorgias Encyclopedic Dictionary of the Syriac Heritage questions that
  reading. The text gives both views. An official Assyrian Church of the East statement on the
  "Nestorian" label, and a stable URL for Brock's 1996 "lamentable misnomer" article, would
  strengthen it.
- `b-anabaptists`: the first rebaptism is "probably" 21 January 1525 (Britannica); another
  Britannica article implies February. Year unaffected.
- `b-anglicanism`: sources differ on whether the Act of Supremacy passed in March or November
  1534 (November is usual). Year unaffected.
- `b-baptists`: Helwys's return to England is dated 1611 or 1612 in different sources.
- `b-jehovahs-witnesses`: start marked c. 1879 (first _Zion's Watch Tower_). The Bible study
  group dates to the early 1870s (1872 per Britannica); the Society was formed 1881 and
  incorporated 1884.
- `b-adventism` and `b-latter-day-saints`: their parents (Baptists; Reformed) are modelling
  simplifications, stated in the text. A reviewer may prefer a different modelling.

## Islam & Bahá'í

- `b-babism`: the day of the Báb's declaration is 23 May 1844 in Bahá'í sources and Britannica
  (the evening of 22 May into the 23rd) and 22 May in Encyclopaedia Iranica. Text says "22–23 May".
- `sunni`: the statement that Sunni identity became fixed around the 9th–10th centuries rests on
  abstracts and excerpts (Barzegar; Melchert); full texts not read.
- `b-islam-rabbinic-influence`: the Bar-Asher source was seen only as a search result. Add a
  reference-work source (for example _Encyclopaedia of the Qur'ān_, "Jews and Judaism").
- `bahai`: the Ridván detail is sourced only to bahai.org (an official source). Britannica's
  wording does not mention Ridván.
