# Hebrew Normalize

ספריית JavaScript עצמאית, כלי CLI וממשק דפדפן לנרמול טקסט עברי לצורכי **חיפוש, אינדוקס והשוואת מחרוזות**. אין תלות בחבילות חיצוניות, שירות רשת או חשבון משתמש.

## הפעלה בדפדפן

משרת סטטי בתיקיית המאגר:

    python3 -m http.server 8000

פותחים http://localhost:8000. בוחרים תצורה, מדביקים טקסט ובוחרים כללים. התוצאה מתעדכנת באופן מקומי. אפשר להעתיק, לייבא קובץ טקסט או להוריד תוצאה.

האתר אינו שומר את הטקסט ב־localStorage ואינו שולח אותו לשרת.

## שימוש כספרייה

דורש Node.js 22 ומעלה, או דפדפן מודרני התומך ב־ES Modules:

    import {
      normalizeHebrew, searchKey, displayText,
      normalizeWithReport, DEFAULT_OPTIONS, PRESETS
    } from './src/index.js';

    normalizeHebrew('שָׁלוֹם'); // 'שלום'
    searchKey('מֶלֶךְ');        // 'מלכ'
    displayText('שָׁלוֹם');      // הניקוד נשמר

השתמשו באותן הגדרות על **טקסט המקור ועל שאילתת החיפוש**. נרמול אותיות סופיות אינו תיקון לשוני, אלא יצירת מפתח השוואה רחב יותר.

### כללים

- \`removeNiqqud\` — הסרת סימני ניקוד ודגש בתחום Unicode העברי.
- \`removeCantillation\` — הסרת טעמי מקרא (U+0591–U+05AF).
- \`normalizePresentation\` — פירוק צורות Unicode מעוצבות בתחום U+FB1D–U+FB4F, מבלי לנרמל אותיות לטיניות בדרך אגב.
- \`expandYiddish\` — פירוק װ, ױ, ײ לצירופי האותיות המתאימים.
- \`normalizeFinalLetters\` — מיפוי ך→כ, ם→מ, ן→נ, ף→פ, ץ→צ.
- \`removeBidiControls\` — הסרת LRM, RLM, ALM, תווי embedding/override ו־directional isolates. לא מסיר ZWJ/ZWNJ.
- \`normalizePunctuation\` — אחידות גרש וגרשיים מסוימים בהקשר עברי. אינו מחליף כל סימן פיסוק אנגלי.
- \`normalizeMaqaf\` — החלפת המקף העברי ־ במקף רגיל.
- \`collapseWhitespace\` — איחוד רצפים של רווחים ושבירות שורה לרווח יחיד.
- \`trim\` — הסרת רווחים בקצות הטקסט.

כל אפשרות היא Boolean. אפשר להעביר רק את ההגדרות שרוצים לשנות:

    normalizeHebrew('מֶלֶךְ', {
      removeNiqqud: true,
      normalizeFinalLetters: false
    }); // 'מלך'

\`PRESETS.search\` מפעיל איחוד סופיות כדי ליצור מפתחות חיפוש רחבים. \`PRESETS.display\` שומר ניקוד וטעמים ומיועד להצגה שמרנית יותר.

## איתור כפילויות אחרי נרמול

ממשק הדפדפן כולל **איתור שורות כפולות**. לאחר הדבקת טקסט ובחירת כללי הנרמול, לחצו על „בדיקת כפילויות”. הכלי בודק כל שורה לא־ריקה בנפרד, מציג קבוצות שמקבלות אותו מפתח נרמול, וסופר את מספר השורות העודפות. אפשר להוריד דוח JSON הכולל את **המפתחות המנורמלים ומספרי השורות**, אך לא את שורות המקור כפי שנכתבו.

הבדיקה היא **זהות מחרוזת אחרי נרמול**, לא ניתוח סמנטי, לא חיפוש מילים נרדפות ולא זיהוי פסיקה או כתיב נכון. שימוש ב־\`normalizeFinalLetters\` עשוי להגדיל את מספר ההתאמות ולהפיק גם התאמות שלא ראוי לאחד במאגר המקורי.

ממשק הספרייה:

    import { findDuplicateLines, duplicateSummary, summarizeDuplicateLines } from './src/duplicates.js';

    const text = 'שָׁלוֹם\nשלום\nמֶלֶךְ\nמלך';
    const analysis = findDuplicateLines(text);
    // analysis.groups: normalized keys and original line numbers
    const counts = duplicateSummary(analysis); // counts only, no text
    const directCounts = summarizeDuplicateLines(text); // counts directly, without group arrays

הברירה הראשונית של הספרייה היא \`PRESETS.search\`. ניתן להעביר אותן הגדרות Boolean שבהן משתמשת \`normalizeHebrew\`. מגבלות: 2,000,000 תווים ו־10,000 שורות לא־ריקות; הממשק מציג עד 200 קבוצות, הדוח המלא כולל את כולן והדוח המספרי אינו מכיל אף קבוצה. שורות שמתאפסות למחרוזת ריקה בעקבות הסרת סימנים אינן מקובצות ככפילויות, אלא נספרות בנפרד.

העיבוד נשאר בדפדפן. **דוח כפילויות מלא** כולל מפתחות מנורמלים ומיקומי שורות, ולכן עשוי להכיל מידע רגיש. **דוח ספירות בלבד** כולל רק את הסטטיסטיקה המספרית: מספר השורות, קבוצות הכפילויות והשורות העודפות — ללא טקסט ומיקומים. מנגנון `summarizeDuplicateLines` סופר התאמות בעזרת מפה זמנית בזיכרון, אך אינו בונה או מחזיר רשימת מפתחות מנורמלים ומספרי שורות; כפתור הדוח המספרי משתמש כעת במנגנון זה. עדיין יש לבדוק התאמה לשיתוף. תיקון נוסף מונע מקובץ שנטען באיחור לדרוס עריכות או הגדרות נרמול ששונו בינתיים. אפשר לייבא את המודול גם בנתיב החבילה \`hebrew-normalize/duplicates\`.

## CLI

בלי התקנת חבילות חיצוניות:

    node bin/hebrew-normalize.js --help
    node bin/hebrew-normalize.js input.txt
    node bin/hebrew-normalize.js --mode search input.txt
    node bin/hebrew-normalize.js --mode display input.txt
    node bin/hebrew-normalize.js --mode search --keep-finals input.txt
    node bin/hebrew-normalize.js --mode search --output normalized.txt input.txt
    node bin/hebrew-normalize.js --duplicate-counts corpus.txt
    cat corpus.txt | node bin/hebrew-normalize.js --duplicate-counts --keep-finals
    node bin/hebrew-normalize.js --duplicate-counts --output counts.json corpus.txt

אפשר גם להעביר קלט דרך stdin. הפלט נשלח ל־stdout או לקובץ חדש באמצעות \`--output\`. קובץ קיים **לא יידרס**. האפשרות \`--json\` מחזירה את התוצאה כמחרוזת JSON.

### דוח כפילויות מספרי ב־CLI

האפשרות `--duplicate-counts` מפיקה **JSON מספרי בלבד** עם אותן ספירות כמו דוח הדפדפן (`summarizeDuplicateLines`), ללא טקסט מקור, מפתחות נרמול או מספרי שורות. ברירת המחדל היא `PRESETS.search` להתאמה לבדיקת הכפילויות בדפדפן; `--mode display` או אפשרויות `--keep-*` משנות את כללי ההשוואה. אין לשלב `--duplicate-counts` עם `--json` (הפלט כבר JSON). גם סטטיסטיקה מצטברת עשויה להיות רגישה.

קריאת קלט מהדיסק או מ־stdin מוגבלת ל־**4,000,000 בתים ו־2,000,000 יחידות קוד UTF-16 של JavaScript**, לפי המגבלה המוקדמת. UTF-8 פגום נדחה במקום להיות מוחלף בתווים אחרים. בניתוח כפילויות חלה גם מגבלת 10,000 שורות לא־ריקות. נתוני המקור והמפתחות המנורמלים מחושבים רק בזיכרון התהליך, והדוח אינו כולל אותם. מצב זה מתאים לצינורות עבודה מקומיים ולא לזיהוי סמנטי של כפילויות.

## מגבלות

- אין stemming, ניתוח מורפולוגי, חיפוש שורשים, תרגום או זיהוי שמות.
- איחוד אותיות סופיות עשוי ליצור מחרוזות שאינן מילים עבריות תקינות — שימושי למפתחות חיפוש בלבד.
- ניקוד וטעמים עשויים להיות משמעותיים למחקרי תנ״ך ולדקדוק; בחרו תצוגה שומרת סימנים כשחשוב לשמרם.
- התמיכה אינה ממירה תעתיקים ואינה מפרשת את כל סוגי הקיצור והגרשיים בעברית.
- גודל קלט מקסימלי: 2,000,000 תווים; בייבוא דפדפן עד 2MB.

**סטטוס:** מימוש קוד בלבד. לא בוצעו בדיקות אוטומטיות בהתאם להנחיית הבעלים להפריד את הפיתוח מסבב הבדיקות המרכזי.

## קבצים

- \`src/index.js\` — מנוע נרמול, תצורות וממשקי API.
- \`src/duplicates.js\` — איתור שורות כפולות וממשק סיכום שאינו חושף טקסט מקור.
- \`bin/hebrew-normalize.js\` — CLI ל־Node.js.
- \`index.html\` — ממשק השוואת טקסט בעברית.
- \`app.js\` — תצוגה, תצורות, ייבוא וייצוא מקומיים.
- \`styles.css\` — עיצוב רספונסיבי.
- \`package.json\` — חבילת ES Modules.
- \`LICENSE\` — MIT.

## Author

Built by Meir Dvir · https://github.com/MeiRR17
