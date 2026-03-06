/**
 * Maps taxonomy country IDs (adjective form, e.g. "cambodian")
 * to the DB slug prefix (country name form, e.g. "cambodia").
 *
 * All seeded recipes follow the convention: `{db-prefix}-{recipe-name}`.
 * The taxonomy uses adjective forms as country IDs.
 */
export const COUNTRY_SLUG_MAP: Record<string, string> = {
  // ── East Asia ──
  chinese: 'china',
  japanese: 'japan',
  korean: 'korea',
  taiwanese: 'taiwan',
  hongkong: 'hong-kong',
  mongolian: 'mongolia',

  // ── Southeast Asia ──
  thai: 'thailand',
  vietnamese: 'vietnam',
  cambodian: 'cambodia',
  lao: 'laos',
  burmese: 'myanmar',
  indonesian: 'indonesia',
  malaysian: 'malaysia',
  singaporean: 'singapore',
  filipino: 'philippines',
  bruneian: 'brunei',
  timorese: 'east-timor',

  // ── South Asia ──
  indian: 'india',
  pakistani: 'pakistan',
  bangladeshi: 'bangladesh',
  srilankan: 'sri-lanka',
  nepali: 'nepal',
  bhutanese: 'bhutan',
  maldivian: 'maldives',

  // ── Caucasus ──
  georgian: 'georgia',
  armenian: 'armenia',
  azerbaijani: 'azerbaijan',

  // ── Central Asia ──
  uzbek: 'uzbekistan',
  kazakh: 'kazakhstan',
  kyrgyz: 'kyrgyzstan',
  tajik: 'tajikistan',
  turkmen: 'turkmenistan',
  afghan: 'afghanistan',

  // ── Levant & Middle East ──
  lebanese: 'lebanon',
  syrian: 'syria',
  jordanian: 'jordan',
  palestinian: 'palestine',
  israeli: 'israel',
  saudi: 'saudi-arabia',
  emirati: 'uae',
  qatari: 'qatar',
  kuwaiti: 'kuwait',
  bahraini: 'bahrain',
  omani: 'oman',
  yemeni: 'yemen',
  iranian: 'iran',
  iraqi: 'iraq',
  turkish: 'turkey',
  cypriot: 'cyprus',

  // ── Southern Europe ──
  italian: 'italy',
  spanish: 'spain',
  greek: 'greece',
  portuguese: 'portugal',
  maltese: 'malta',

  // ── Western Europe ──
  french: 'france',
  german: 'germany',
  austrian: 'austria',
  swiss: 'switzerland',
  dutch: 'netherlands',
  belgian: 'belgium',
  luxembourgish: 'luxembourg',

  // ── British Isles ──
  british: 'uk',
  irish: 'ireland',

  // ── Scandinavia ──
  swedish: 'sweden',
  norwegian: 'norway',
  danish: 'denmark',
  finnish: 'finland',
  icelandic: 'iceland',

  // ── Baltics ──
  estonian: 'estonia',
  latvian: 'latvia',
  lithuanian: 'lithuania',

  // ── Central Europe ──
  polish: 'poland',
  czech: 'czech-republic',
  slovak: 'slovakia',
  hungarian: 'hungary',
  slovenian: 'slovenia',
  croatian: 'croatia',

  // ── Balkans & Eastern Europe ──
  serbian: 'serbia',
  bosnian: 'bosnia',
  albanian: 'albania',
  macedonian: 'north-macedonia',
  bulgarian: 'bulgaria',
  romanian: 'romania',
  moldovan: 'moldova',
  montenegrin: 'montenegro',
  kosovar: 'kosovo',

  // ── Eastern Europe ──
  ukrainian: 'ukraine',
  russian: 'russia',
  belarusian: 'belarus',

  // ── North Africa ──
  moroccan: 'morocco',
  algerian: 'algeria',
  tunisian: 'tunisia',
  libyan: 'libya',
  egyptian: 'egypt',
  sudanese: 'sudan',
  mauritanian: 'mauritania',

  // ── West Africa ──
  nigerian: 'nigeria',
  ghanaian: 'ghana',
  senegalese: 'senegal',
  ivorian: 'ivory-coast',
  malian: 'mali',
  guinean: 'guinea',
  togolese: 'togo',
  beninese: 'benin',
  cameroonian: 'cameroon',
  liberian: 'liberia',
  sierraleonean: 'sierra-leone',
  gambian: 'gambia',
  burkinabe: 'burkina-faso',
  nigerien: 'niger',

  // ── East Africa ──
  ethiopian: 'ethiopia',
  somali: 'somalia',
  eritrean: 'eritrea',
  djiboutian: 'djibouti',
  kenyan: 'kenya',
  tanzanian: 'tanzania',
  ugandan: 'uganda',
  rwandan: 'rwanda',
  burundian: 'burundi',
  congolese: 'congo',

  // ── Southern Africa ──
  'south-african': 'south-africa',
  zimbabwean: 'zimbabwe',
  zambian: 'zambia',
  malawian: 'malawi',
  mozambican: 'mozambique',
  botswanan: 'botswana',
  namibian: 'namibia',
  malagasy: 'madagascar',

  // ── North America ──
  'american-south': 'southern-us',
  'american-northeast': 'northeastern-us',
  'tex-mex': 'tex-mex',
  'american-midwest': 'midwestern-us',
  'american-west': 'western-us',
  canadian: 'canada',
  mexican: 'mexico',

  // ── Central America & Caribbean ──
  guatemalan: 'guatemala',
  salvadoran: 'el-salvador',
  honduran: 'honduras',
  nicaraguan: 'nicaragua',
  costarican: 'costa-rica',
  panamanian: 'panama',
  cuban: 'cuba',
  jamaican: 'jamaica',
  trinidadian: 'trinidad',
  haitian: 'haiti',
  dominican: 'dominican-republic',
  'puerto-rican': 'puerto-rico',
  barbadian: 'barbados',

  // ── South America ──
  peruvian: 'peru',
  bolivian: 'bolivia',
  ecuadorian: 'ecuador',
  colombian: 'colombia',
  venezuelan: 'venezuela',
  argentinian: 'argentina',
  brazilian: 'brazil',
  chilean: 'chile',
  uruguayan: 'uruguay',
  paraguayan: 'paraguay',
  guyanese: 'guyana',
  surinamese: 'suriname',

  // ── Oceania ──
  australian: 'australia',
  'new-zealand': 'new-zealand',
  fijian: 'fiji',
  samoan: 'samoa',
  tongan: 'tonga',
  hawaiian: 'hawaii',
  'papua-ng': 'papua-new-guinea',
  vanuatuan: 'vanuatu',

  // ── Fusion / Lifestyle (no DB recipes) ──
  'asian-fusion': '',
  'med-fusion': '',
  'modern-global': '',
  'afro-fusion': '',
  'latin-fusion': '',
  'vegan-global': '',
  'raw-food': '',
  wholefood: '',
}

/**
 * Resolves a country identifier (taxonomy ID or DB slug) to its DB slug prefix.
 * Accepts both "cambodian" (taxonomy) and "cambodia" (DB slug).
 * Returns the DB slug prefix, or the input unchanged if no mapping found.
 */
export function resolveCountrySlug(input: string): string {
  // Direct mapping from taxonomy ID
  if (input in COUNTRY_SLUG_MAP) {
    return COUNTRY_SLUG_MAP[input]
  }
  // Already a DB slug — return as-is
  return input
}
