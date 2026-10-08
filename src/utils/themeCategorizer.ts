import { A1Item } from '../data/types';

export type VocabularyFilterCategory = 
  | 'all'
  | 'saved'
  // Everyday Life Themes
  | 'family'
  | 'house'
  | 'food'
  | 'travel'
  | 'work'
  | 'daily_life'
  | 'health'
  | 'clothing'
  // Grammar groups
  | 'nouns'
  | 'verbs'
  | 'adjectives'
  | 'numbers'
  | 'time_calendar'
  | 'phrases_idioms';

export const THEME_PATTERNS: Record<string, RegExp> = {
  family: /(familie|vater|mutter|eltern|bruder|schwester|sohn|tochter|kind|baby|großvater|großmutter|oma|opa|onkel|tante|cousin|freund|freundin|mann|frau|ehemann|ehefrau|kollege|kollegin|partner|partnerin|nachbar|nachbarin|mensch|leute|junge|mädchen|herr|dame|heiraten|verheiratet|ledig|geschieden|alter|name|vorname|nachname|geburtstag|geboren)/i,
  house: /(haus|wohnung|zimmer|küche|bad|badezimmer|toilette|klo|bett|tisch|stuhl|sofa|sessel|tür|fenster|schrank|möbel|regal|balkon|garten|keller|dach|miete|mieten|vermieter|wohnen|einziehen|ausziehen|umziehen|schlüssel|lampe|licht|fernseher|kühlschrank|herd|ofen|wand|boden|stock|etage|badewanne|dusche|duschen|terrasse|teppich|heizung)/i,
  food: /(essen|trinken|brot|brötchen|wasser|kaffee|tee|bier|wein|milch|saft|apfel|banane|orange|kartoffel|tomate|salat|fleisch|hähnchen|rind|schwein|wurst|fisch|käse|butter|ei|eier|zucker|salz|pfeffer|öl|suppe|kuchen|schokolade|eis|kochen|braten|frühstück|mittagessen|abendessen|restaurant|café|bar|kellner|kellnerin|rechnung|hunger|durst|schmecken|lecker|speisekarte|supermarkt|markt|bäckerei|metzgerei|glas|tasse|teller|messer|gabel|löffel|flasche)/i,
  travel: /(reise|reisen|urlaub|ferien|zug|bahn|s-bahn|u-bahn|tram|straßenbahn|bahnhof|gleis|bahnsteig|flughafen|flugzeug|flug|fliegen|bus|auto|pkw|taxi|fahrrad|rad|ticket|fahrkarte|fahrschein|hotel|pension|koffer|gepäck|tasche|rucksack|fahren|abfahren|ankommen|abfahrt|ankunft|haltestelle|ampel|straße|kreuzung|stadt|zentrum|dorf|land|meer|strand|berg|berge|see|fluss|ausland|pass|reisepass|visum|ausweis|übernachten|besuchen|besichtigung|sehenswürdigkeit|tourist|karte|stadtplan|weg)/i,
  work: /(arbeit|arbeiten|beruf|job|stelle|arbeitsplatz|chef|chefin|kollege|kollegin|firma|unternehmen|büro|computer|laptop|drucker|e-mail|brief|post|telefon|anruf|telefonieren|termin|treffen|besprechung|meeting|vertrag|schule|schüler|lehrer|lehrerin|unterricht|klasse|lernen|studium|studieren|student|universität|uni|buch|heft|stift|prüfung|test|aufgabe|arzt|ärztin|sekretär|verkäufer|ingenieur|mechaniker|arbeitslos|gehalt|lohn|verdienen|geld|euro|konto|überweisen)/i,
  daily_life: /(freizeit|alltag|wochenende|hobby|sport|fußball|tennis|schwimmen|bad|musik|konzert|kino|film|theater|party|fest|feiern|geburtstag|spielen|spiel|lesen|zeitung|buch|fernsehen|video|foto|fotografieren|schlafen|einschlafen|aufstehen|aufwachen|früh|spät|pünktlich|spazieren|spaziergang|zeit|uhr|stunde|minute|sekunde|tag|woche|monat|jahr|morgen|vormittag|mittag|nachmittag|abend|nacht|gestern|heute|morgen)/i,
  health: /(gesund|gesundheit|krank|krankheit|krankenhaus|spital|praxis|arzt|ärztin|doktor|apotheke|medizin|medikament|tablette|pille|tropfen|rezept|schmerz|schmerzen|kopfschmerz|kopfweh|bauchweh|zahnschmerzen|fieber|grippe|husten|schnupfen|erkältung|körper|kopf|auge|augen|ohr|ohren|mund|zahn|zähne|nase|hals|hand|hände|finger|arm|arme|bein|beine|fuß|füße|rücken|bauch|brust|herz|blut|pflaster|verband|weh tun|schlafen|müde|notfall|notarzt|rettung)/i,
  clothing: /(kleid|kleidung|anzug|hemd|bluse|t-shirt|shirt|pullover|pulli|jacke|mantel|hose|jeans|kurze hose|rock|schuh|schuhe|stiefel|sportschuhe|socke|socken|mütze|hut|kappe|schal|handschuh|tasche|handtasche|koffer|brille|sonnenbrille|uhr|ring|kaufen|verkaufen|geschäft|laden|kaufhaus|shopping|preis|kosten|teuer|billig|günstig|angebot|rabatt|euro|cent|bezahlen|bar|karte|kasse|quittung|größe|passen|anprobieren|stehen|anziehen|ausziehen|tragen)/i,
};

export function matchesCategory(item: A1Item, category: VocabularyFilterCategory, bookmarkedIds: string[]): boolean {
  if (category === 'all') return true;
  if (category === 'saved') return bookmarkedIds.includes(item.id);

  // Check grammar groups
  if (['nouns', 'verbs', 'adjectives', 'numbers', 'time_calendar', 'phrases_idioms'].includes(category)) {
    return item.category === category;
  }

  // Check thematic pattern
  const pattern = THEME_PATTERNS[category];
  if (pattern) {
    const textToMatch = `${item.german} ${item.english} ${item.nounClean || ''} ${item.sentenceDe || ''} ${item.sentenceEn || ''}`;
    return pattern.test(textToMatch);
  }

  return true;
}
