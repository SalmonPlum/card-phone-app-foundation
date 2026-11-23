# Interface text and menu icon authoring

Edit `resources/app/presentation.json` from the mobile project. This bundled
resource customizes a final app without editing shared screens or exposing branding
in user Settings. It does not configure deck content, themes, native app identity
or audio. Start with the [foundation guide](../../docs/foundation-guide.md) for the
complete app workflow.

## Minimal resource and example

The shipped resource preserves the foundation UI:

```json
{"schemaVersion":1,"texts":{},"menuIcons":{}}
```

`schemaVersion: 1` is required. The other three fields are optional. For example:

```json
{
  "schemaVersion": 1,
  "texts": {
    "drawTab": {"en":"Reading","cs":"Vykládání"},
    "catalogueTab": {"en":"My cards","cs":"Moje karty"},
    "stop": {"en":"Finish reading","cs":"Dokončit vykládání"},
    "drawnCount": {"en":"Your cards: {count}","cs":"Vaše karty: {count}"}
  },
  "menuIcons": {"index":"cards","catalogue":"grid"},
  "infoMenuLabel": {"en":"Our story","cs":"Náš příběh"}
}
```

Every provided text override must contain both nonblank `en` and `cs` strings.
Omit a key entirely to use its foundation translation; partial locale overrides,
blank strings and `null` are invalid. No comments or trailing commas in JSON.
Unknown fields/translation keys/routes/icon names/schema versions fail validation
with a field path. Remove an override to restore its default.

## Text resolution and placeholders

`texts` accepts any interface key declared in `src/i18n/en.ts`. That dictionary
remains the authoritative key list/default copy; `cs.ts` supplies the Czech defaults.
All existing calls to `t()` use the selected override, including action labels,
accessibility instructions and reminder text. Visible and spoken copy can have
separate keys: when renaming Draw or Confirm, review `draw`, `tapToDraw`, `confirm`,
`tapCardToConfirm`, `flipCard` and `tapCardToReveal` as appropriate.

Retain exactly the named placeholders in each base translation, in both languages.
Order can change; names cannot. For `cardPosition`, keep `{position}` and `{total}`;
for `drawnCount`, keep `{count}`. Extra/missing/malformed braces are rejected.
Substitution happens through the existing translation function; missing runtime
values remain visible as `{name}` to expose a calling-code mistake. Strings are
plain text, not Markdown or executable code. Deck section headings/card text and
theme names have separate content resources.

Renaming Stop changes its label, not when Stop is enabled or the action it invokes.
Menu text changes do not change URLs, tab order, feature availability or session
identity. Keep menu labels short; the dock scrolls, truncates exceptionally long
visual labels and retains their full accessibility label.

## Menu mapping

| Stable route | Label source | Default icon |
| --- | --- | --- |
| `index` | `texts.drawTab` or foundation translation | `cards` |
| `catalogue` | `texts.catalogueTab` or foundation translation | `grid` |
| `history` | `texts.historyTab` or foundation translation | `clock` |
| `info` | `infoMenuLabel`, then Markdown `menuLabel` | `info` |
| `settings` | `texts.settings` or foundation translation | `settings` |

Every route can select any of the five bundled icons: `cards` (overlapping cards),
`grid` (four tiles), `clock`, `info` (circled i), `settings` (gear). Existing native
drawings, theme tints and dimensions are reused. Icon names are references, not
paths, Unicode values or downloaded assets. Omit a route to retain its default.
The History tab still requires enabled history. An Info override does not create
an omitted page: `resources/info/page.json` still controls its inclusion.

`infoMenuLabel` changes only the tab label. Markdown headings/body remain unchanged.
If it is absent, each language's Markdown `menuLabel` wins as before. See
[Info authoring](info-page.md). There is no `texts.infoTab` key. Detail Close/Back,
History trash and New session artwork are action icons, outside this menu mapping.

## Validation, launch and tests

Run from `mobile/`:

```sh
npm run validate:app
npm run test:app
```

`validate:app` reads the real JSON and reports paths such as
`presentation.texts.drawnCount.en: expected placeholders: {count}`.
`test:app` exercises the resource contract with fixtures. No generation step is
needed for presentation. `npm start`, `npm run android` and `npm run android:release`
validate it before launching/building, then generate the separate Info resource.
Direct Expo invocations bypass the npm pre-hooks. Runtime import also validates.
Resource edits need a Metro reload; there are no added packages or native modules.

For translation/menu/action changes, run:

```sh
npm test -- --runInBand src/config/__tests__/presentation.test.ts src/navigation/__tests__/infoNavigation.test.tsx src/navigation/__tests__/BottomDock.test.tsx
```

Generic Jest behavior fixtures intentionally use defaults rather than editable
app copy. Dedicated customization tests supply overrides and verify actual routing,
Stop behavior and Info precedence. Review final labels/icons on the phone in both
languages, themes and large text. These checks do not establish device appearance.

## Interface key reference

The table below records English foundation defaults and placeholder names at this
checkpoint. Use `src/i18n/en.ts` / `cs.ts` as the authoritative source if keys change.

| Key | English default |
| --- | --- |
| `saveHistory` | Save drawing history |
| `historyTab` | History |
| `historyStartsNextSession` | History will start with your next session. |
| `historyEmpty` | No saved readings yet. |
| `historyRetention` | Keep the newest 50 sessions for up to 30 days. |
| `historyClear` | Clear history |
| `historyClearTitle` | Clear all history? |
| `historyClearMessage` | All saved drawing sessions will be permanently deleted. |
| `historyDeleteTitle` | Delete selected sessions? |
| `historyDeleteMessage` | Permanently delete {count} selected sessions? Other sessions will stay saved. |
| `historyDeleteSelected` | Delete selected ({count}) |
| `closeCardDetails` | Close card details |
| `historySelectedCount` | {count} selected |
| `historyDeleteAction` | Delete |
| `historySelect` | Select |
| `historyFinished` | Finished |
| `historyPartial` | Partial |
| `historyInProgress` | In progress |
| `historyBack` | Back to history |
| `historySessionLabel` | {date}, {count} cards |
| `historyLoading` | Loading history… |
| `historyLoadError` | History could not be loaded. Recording is paused. Try again or clear history. |
| `historySaveError` | History changes could not be saved. Deletions may not survive a restart. Try again. |
| `historySaving` | Saving history… |
| `reminderNeedsAttention` | Reminder needs attention. |
| `drawReminderTitle` | Time to draw your cards |
| `drawReminderBody` | Take a moment to pause and draw your cards. |
| `dailyReminder` | Daily reminder |
| `reminderTime` | Reminder time |
| `reminderTimeValue` | Reminder time: {time} |
| `reminderScheduled` | Daily at about {time} |
| `reminderOff` | Daily reminder is off. |
| `reminderUpdating` | Updating reminder… |
| `reminderApproximate` | Delivery time may vary with your phone’s battery and notification settings. |
| `reminderPermissionNeeded` | Allow notifications to receive your daily reminder. |
| `reminderPermissionBlocked` | Notifications are blocked. Enable them in app settings. |
| `openAppSettings` | Open app settings |
| `openSettingsError` | App settings could not be opened. Open them from your phone’s Settings. |
| `reminderUnavailable` | Rebuild and reinstall the development app to use reminders and the time picker. |
| `reminderSaveError` | Reminder settings could not be saved or restored. Try again. |
| `reminderUpdateError` | Could not update the reminder. It may not be active, or an earlier reminder may still arrive. Try again. |
| `cancel` | Cancel |
| `done` | Done |
| `loadingFonts` | Preparing theme… |
| `fontLoadError` | The theme could not be prepared. Try again or use system fonts for now. |
| `useSystemFonts` | Continue with system fonts |
| `hapticFeedback` | Haptic feedback |
| `hapticsSaveError` | Haptic feedback changed for now, but could not be saved. Try again. |
| `revealMode` | Card reveal |
| `automaticMode` | Automatic |
| `manualMode` | Tap to flip |
| `flipCard` | Flip card |
| `tapCardToReveal` | Tap the card to reveal. |
| `revealSaveError` | Reveal mode changed for now, but could not be saved. Try again. |
| `swipeUpForDetails` | Swipe up for details |
| `settings` | Settings |
| `language` | Language |
| `textSize` | Font size |
| `smallText` | Small |
| `standardText` | Standard |
| `largeText` | Large |
| `textSizeSaveError` | Text size changed for now, but could not be saved. Try again. |
| `automaticReveal` | Automatic card reveal |
| `colorPalette` | Color palette |
| `theme` | Theme |
| `themeSaveError` | Theme changed for now, but could not be saved. Try again. |
| `comingLater` | Coming later |
| `futureSettings` | More settings |
| `languageSaveError` | Language changed for now, but could not be saved. Try again. |
| `drawTab` | Draw |
| `catalogueTab` | Catalogue |
| `home` | Home |
| `drawCards` | Draw cards |
| `browseCards` | Browse cards |
| `draw` | Draw a card |
| `tapToDraw` | Tap to draw a card |
| `confirm` | Confirm card |
| `tapCardToConfirm` | Tap the card to confirm. |
| `stop` | Stop |
| `catalogue` | All cards |
| `searchCardsByName` | Search cards by name |
| `clearSearch` | Clear search |
| `noCardMatches` | No cards match your search. |
| `results` | Drawn cards |
| `newSession` | New session |
| `resume` | Resume drawing |
| `close` | Close |
| `back` | Back |
| `meaning` | Meaning |
| `description` | Description |
| `remainingCount` | Cards remaining: {count} |
| `drawnCount` | Cards drawn: {count} |
| `emptyResults` | No cards drawn yet. |
| `exhausted` | You have drawn every card. |
| `retry` | Try again |
| `entropyError` | Secure randomness is unavailable. Try again. |
| `deckError` | This card deck could not be loaded. |
| `assetError` | Card artwork could not be loaded. |
| `cardNotFound` | This card could not be found. |
| `loading` | Loading cards… |
| `infoLinkError` | Could not open the link. Please try again. |
| `cardPosition` | Card {position} of {total} |
