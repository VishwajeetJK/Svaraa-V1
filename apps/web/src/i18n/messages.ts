export type Locale = 'en' | 'hi' | 'ta';

const en = {
  brand: 'Svaraa',
  tagline: 'A gentle voice. A family close by.',
  today: 'Today',
  talk: 'Talk',
  apps: 'Apps',
  alerts: 'Alerts',
  getHelp: 'Get help',
  play: 'Play',
  myDay: 'My day',
  continueSetup: 'Continue setup',
  saveLater: 'Save and continue later',
  workingOn: 'Working on {n} things',
  saySomething: 'Say something',
};

const hi: typeof en = {
  ...en,
  brand: 'स्वरा',
  tagline: 'एक कोमल आवाज़। परिवार पास।',
  today: 'आज',
  talk: 'बात',
  apps: 'ऐप्स',
  alerts: 'सूचनाएँ',
  getHelp: 'मदद',
  play: 'सुनें',
  myDay: 'मेरा दिन',
  continueSetup: 'सेटअप जारी रखें',
  saveLater: 'बाद में जारी रखें',
  workingOn: '{n} काम चल रहे हैं',
  saySomething: 'कुछ कहें',
};

const ta: typeof en = {
  ...en,
  brand: 'ஸ்வரா',
  tagline: 'மென்மையான குரல். குடும்பம் அருகில்.',
  today: 'இன்று',
  talk: 'பேசு',
  apps: 'ஆப்ஸ்',
  alerts: 'அலர்ட்',
  getHelp: 'உதவி',
  play: 'கேள்',
  myDay: 'என் நாள்',
  continueSetup: 'அமைப்பைத் தொடரவும்',
  saveLater: 'பிறகு தொடரவும்',
  workingOn: '{n} பணிகள் நடக்கின்றன',
  saySomething: 'ஏதேனும் சொல்லுங்கள்',
};

export const messages: Record<Locale, typeof en> = { en, hi, ta };

export function t(locale: Locale, key: keyof typeof en, vars?: Record<string, string | number>) {
  let s = messages[locale][key] ?? messages.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  }
  return s;
}
