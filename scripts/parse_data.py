import csv
import json
import re

with open('src/data/raw_a1.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows = list(reader)

print(f"Total raw rows: {len(rows)}")

items = []
nouns = []
sentences = []

GENDER_RULES = [
    (r'(ung|heit|keit|schaft|ion|tät|anz|enz|ur|ie|ei)$', 'die', 'Words ending in -ung, -heit, -keit, -ei, -ion, -schaft are almost always feminine (die).'),
    (r'(chen|lein|ment|um|nis)$', 'das', 'Diminutives (-chen, -lein) and foreign loans (-ment, -um) are neuter (das).'),
    (r'(or|ling|ismus)$', 'der', 'Nouns ending in -or, -ling, -ismus are masculine (der).'),
    (r'^[A-Z][a-z]+e$', 'die', 'About 90% of two-syllable German nouns ending in -e are feminine (die).'),
]

CALENDAR_DER = {'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonnabend', 'Sonntag',
                'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
                'Frühling', 'Sommer', 'Herbst', 'Winter', 'Norden', 'Süden', 'Westen', 'Osten', 'Morgen', 'Vormittag', 'Mittag', 'Nachmittag', 'Abend'}

for idx, row in enumerate(rows):
    if len(row) < 2:
        continue
    q_raw = row[0].strip()
    a_raw = row[1].strip()
    
    # Clean bold markers
    q_clean = q_raw.replace('**', '').replace('﻿', '').strip()
    a_clean = a_raw.replace('**', '').replace('﻿', '').strip()
    
    lines_q = [line.strip() for line in q_clean.split('\n') if line.strip()]
    lines_a = [line.strip() for line in a_clean.split('\n') if line.strip()]
    
    headword = lines_q[0] if lines_q else ""
    meaning = lines_a[0] if lines_a else ""
    
    sentence_de = lines_q[1] if len(lines_q) > 1 else ""
    sentence_en = lines_a[1] if len(lines_a) > 1 else ""
    
    # Check if noun with article
    # Patterns: der/die/das X, "der Tag, -e", "die Nacht,¨-e", "das Auto, -s", "der/die Deutsche, -n"
    article = None
    clean_noun = None
    plural = ""
    
    m_art = re.match(r'^(der|die|das)\s+([A-ZÄÖÜ][a-zA-ZäöüßÄÖÜ\-\/]+)(?:,\s*([^\n\r]+))?', headword)
    if m_art:
        article = m_art.group(1)
        clean_noun = m_art.group(2)
        plural = m_art.group(3) if m_art.group(3) else ""
    elif headword.startswith('der/die '):
        article = 'der' # default masculine/feminine dual
        clean_noun = headword.replace('der/die ', '').split(',')[0].strip()
    elif headword.startswith('das Wochenende'):
        article = 'das'
        clean_noun = 'Wochenende'
    elif headword.startswith('der Frühling/das Frühjahr'):
        article = 'der'
        clean_noun = 'Frühling'
    
    # Rule tip
    rule_tip = ""
    if article:
        if clean_noun in CALENDAR_DER:
            rule_tip = "Days of the week, months, seasons, compass points, and times of day (except die Nacht) take 'der'."
        elif clean_noun == 'Nacht':
            rule_tip = "'Die Nacht' is an exception to the times of day rule (masculine), taking 'die'."
        elif clean_noun == 'Wochenende':
            rule_tip = "Compound noun ending in '-ende' (das Ende), so it takes 'das'."
        else:
            for pat, expected_art, explanation in GENDER_RULES:
                if re.search(pat, clean_noun, re.IGNORECASE):
                    rule_tip = explanation
                    break
        if not rule_tip:
            if article == 'der':
                rule_tip = "Many male personas, seasons, calendar terms, and core monosyllabic nouns take 'der'."
            elif article == 'die':
                rule_tip = "Female personas, abstract nouns, and many plurals and fruit words take 'die'."
            else:
                rule_tip = "Many young beings, collective concepts, and loan words take 'das'."

    category = 'phrases_idioms'
    if article:
        category = 'nouns'
    elif re.match(r'^\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|einundzwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig|hundert|tausend|Million|Milliarde|erste|zweite|dritte|vierte|halb|Viertel', headword):
        category = 'numbers'
    elif 'Uhr' in headword or 'Minuten vor' in headword or 'halb drei' in headword or clean_noun in CALENDAR_DER or clean_noun == 'Nacht':
        category = 'time_calendar'
    elif re.search(r'(Euro|Meter|Zentimeter|Kilometer|Quadratmeter|Grad|Prozent|Liter|Gramm|Pfund|Kilo)', headword):
        category = 'numbers'
    elif re.search(r'(schwarz|grau|blau|grün|weiß|rot|gelb|braun|alt|bekannt|billig|bitter|böse|breit|einfach|falsch|fertig|frei|fremd|früh|glücklich|groß|gültig|günstig|gut|hell|hoch|jung|kaputt|klar|klein|krank|kurz|lang|langsam|laut|ledig|leicht|leise|lustig|männlich|müde|neu|normal|oft|pünktlich|richtig|ruhig|schlecht|schnell|schön|schwer|selbstständig|spät|teuer|tot|verheiratet|weiblich|weit|wichtig|wunderbar|zufrieden)', headword):
        category = 'adjectives'
    elif re.search(r'(abfahren|abgeben|abholen|anbieten|anfangen|anklicken|ankommen|ankreuzen|anmachen|anmelden|anrufen|antworten|anziehen|arbeiten|aufhören|aufstehen|ausfüllen|ausmachen|aussehen|aussteigen|ausziehen|baden|bedeuten|beginnen|bekommen|benutzen|besichtigen|bestellen|besuchen|bezahlen|bitten|bleiben|bringen|buchstabieren|danken|dauern|drucken|drücken|dürfen|duschen|einkaufen|einladen|einsteigen|empfehlen|enden|entschuldigen|erklären|erlauben|erzählen|essen|fahren|feiern|fehlen|fernsehen|finden|fliegen|abfliegen|fragen|freuen|frühstücken|geben|gefallen|gehen|gehören|gewinnen|glauben|gratulieren|grillen|haben|halten|heiraten|heißen|helfen|holen|hören|kaufen|kennen|kennenlernen|kochen|kommen|können|kosten|kriegen|lachen|laufen|leben|legen|lernen|lesen|lieben|liegen|machen|mieten|mitbringen|mitkommen|mitmachen|mitnehmen|möchten|mögen|waschen|müssen|nehmen|öffnen|rauchen|regnen|reisen|reparieren|riechen|sagen|scheinen|schicken|schlafen|schließen|schmecken|schreiben|schwimmen|sehen|sein|sitzen|sollen|spielen|sprechen|stehen|stellen|studieren|suchen|tanzen|telefonieren|treffen|trinken|tun|übernachten|überweisen|umziehen|unterschreiben|verdienen|verkaufen|vermieten|verstehen|wandern|warten|waschen|weh tun|werden|wiederholen|wissen|wohnen|wollen|zahlen)', headword):
        category = 'verbs'

    item_id = f"item_{idx+1}"
    item = {
        'id': item_id,
        'german': headword,
        'english': meaning,
        'category': category,
        'fullQuestion': q_clean,
        'fullAnswer': a_clean
    }
    if article and clean_noun:
        item['gender'] = article
        item['nounClean'] = clean_noun
        item['plural'] = plural
        item['ruleTip'] = rule_tip
        nouns.append({
            'id': f"noun_{len(nouns)+1}",
            'itemId': item_id,
            'noun': clean_noun,
            'article': article,
            'plural': plural,
            'english': meaning,
            'ruleTip': rule_tip,
            'exampleDe': sentence_de,
            'exampleEn': sentence_en
        })
    if sentence_de and sentence_en:
        item['sentenceDe'] = sentence_de
        item['sentenceEn'] = sentence_en
        
        # Determine sentence grammar rule
        rule = "V2 Rule (Verb in 2nd Position)"
        rule_desc = "In standard German main clauses, the conjugated verb is ALWAYS the second element."
        if '?' in sentence_de:
            if re.match(r'^(Wann|Wo|Wie|Wer|Was|Warum|Woher|Wohin|Welch|Auf welchem)', sentence_de):
                rule = "W-Frage (Question Word + Verb)"
                rule_desc = "In W-questions, the question word comes first and the conjugated verb is strictly second."
            else:
                rule = "Ja/Nein-Frage (Verb First)"
                rule_desc = "In yes/no questions, the conjugated verb starts at position 1."
        elif re.search(r'(muss|kann|darf|soll|will|möchte)', sentence_de):
            rule = "Modalverb + Infinitiv am Ende"
            rule_desc = "The modal verb takes position 2, while the base verb (infinitive) travels all the way to the very end of the sentence."
        elif re.search(r'\b(ab|an|auf|aus|ein|mit|vor|weg|zu|zurück)\b[.,!?]?$', sentence_de):
            rule = "Trennbares Verb (Separable Prefix at End)"
            rule_desc = "Separable verbs split! The main conjugated stem sits at position 2, and the prefix sits at the very end."
        elif re.match(r'^(Mach|Fahr|Fahren Sie|Komm|Kommen Sie|Nehmen Sie|Zieh|Schreiben Sie|Bitte)', sentence_de):
            rule = "Imperativ (Command / Polite Request)"
            rule_desc = "Imperatives start directly with the verb stem or 'Verb + Sie' for polite requests."
        elif not re.match(r'^(Ich|Du|Er|Sie|Es|Wir|Ihr|Das|Der|Die|Mein|Meine|Peter|Picasso|Offenbach|Frau|Herr)', sentence_de):
            rule = "Inversion (Time/Place first, Verb 2nd)"
            rule_desc = "When a sentence starts with time, place, or an adverb, the verb stays at position 2 and the subject moves after the verb!"

        # Create word tokens for builder
        # Remove punctuation attached to words for cleaner matching or keep intact
        # Tokenizer splitting on spaces
        raw_words = sentence_de.split()
        if len(raw_words) >= 3 and len(raw_words) <= 12:
            sentences.append({
                'id': f"sent_{len(sentences)+1}",
                'german': sentence_de,
                'english': sentence_en,
                'words': raw_words,
                'rule': rule,
                'ruleDesc': rule_desc,
                'sourceWord': headword
            })

    items.append(item)

print(f"Parsed {len(items)} vocabulary items.")
print(f"Parsed {len(nouns)} nouns with articles.")
print(f"Parsed {len(sentences)} sentence builder challenges.")

with open('src/data/parsedData.json', 'w', encoding='utf-8') as out:
    json.dump({
        'items': items,
        'nouns': nouns,
        'sentences': sentences
    }, out, ensure_ascii=False, indent=2)

ts_content = f"""// Generated from CSV
import {{ A1Item, A1Noun, SentenceExercise }} from './types';

export const A1_ITEMS: A1Item[] = {json.dumps(items, ensure_ascii=False, indent=2)};

export const A1_NOUNS: A1Noun[] = {json.dumps(nouns, ensure_ascii=False, indent=2)};

export const A1_SENTENCES: SentenceExercise[] = {json.dumps(sentences, ensure_ascii=False, indent=2)};
"""

with open('src/data/a1Data.ts', 'w', encoding='utf-8') as out_ts:
    out_ts.write(ts_content)

print("Saved src/data/parsedData.json and src/data/a1Data.ts successfully.")
