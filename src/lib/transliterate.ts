/**
 * Advanced Syllabic Nepali Phonetic Transliteration Engine
 * Converts Romanized Nepali (e.g. 'Binod Shah', 'Ram Sharma', 'Hari Thapa') to perfect Devanagari ('बिनोद शाह', 'राम शर्मा', 'हरि थापा')
 */

const nameDictionary: Record<string, string> = {
  'binod': 'बिनोद',
  'vinod': 'विनोद',
  'shah': 'शाह',
  'sah': 'साह',
  'ram': 'राम',
  'sharma': 'शर्मा',
  'shyam': 'श्याम',
  'hari': 'हरि',
  'sita': 'सीता',
  'gita': 'गीता',
  'rita': 'रीता',
  'nepal': 'नेपाल',
  'chitwan': 'चितवन',
  'bharatpur': 'भरतपुर',
  'kathmandu': 'काठमाडौँ',
  'lalitpur': 'ललितपुर',
  'bhaktapur': 'भक्तपुर',
  'pokhara': 'पोखरा',
  'koirala': 'कोइराला',
  'cancer': 'क्यान्सर',
  'hospital': 'अस्पताल',
  'director': 'निर्देशक',
  'executive': 'कार्यकारी',
  'application': 'आवेदन',
  'thapa': 'थापा',
  'adhikari': 'अधिकारी',
  'karki': 'कार्की',
  'poudel': 'पौडेल',
  'paudel': 'पौडेल',
  'gurung': 'गुरुङ',
  'tamang': 'तामाङ',
  'shrestha': 'श्रेष्ठ',
  'bhattarai': 'भट्टराई',
  'basnet': 'बस्नेत',
  'kc': 'केसी',
  'magar': 'मगर',
  'rai': 'राई',
  'subedi': 'सुवेदी',
  'regmi': 'रेग्मी',
  'khadka': 'खड्का',
  'dahal': 'दाहाल',
  'oli': 'ओली',
  'bhandari': 'भण्डारी',
  'thakur': 'ठाकुर',
  'yadav': 'यादव',
  'gupta': 'गुप्त',
  'singh': 'सिंह',
  'chaudhary': 'चौधरी',
  'mahato': 'महतो',
  'tamrakar': 'ताम्राकार'
};

const consonantMap: [string, string][] = [
  ['ksha', 'क्ष'], ['chha', 'छ'], ['gya', 'ज्ञ'], ['tra', 'त्र'],
  ['kh', 'ख्'], ['gh', 'घ्'], ['ch', 'च्'], ['jh', 'झ्'], ['th', 'थ्'], ['dh', 'ध्'], ['ph', 'फ्'], ['bh', 'भ्'], ['sh', 'श्'],
  ['k', 'क्'], ['g', 'ग्'], ['c', 'च्'], ['j', 'ज्'], ['t', 'त्'], ['d', 'द्'], ['n', 'न्'], ['p', 'प्'], ['f', 'फ्'], ['b', 'ब्'], ['m', 'म्'], ['y', 'य्'], ['r', 'र्'], ['l', 'ल्'], ['w', 'व्'], ['v', 'व्'], ['s', 'स्'], ['h', 'ह्'],
  ['T', 'ट्'], ['D', 'ड्'], ['N', 'ण्']
];

const matraMap: [string, string][] = [
  ['aa', 'ा'], ['ee', 'ी'], ['oo', 'ू'], ['ai', 'ै'], ['au', 'ौ'], ['am', 'ं'],
  ['a', ''], ['i', 'ि'], ['u', 'ु'], ['e', 'े'], ['o', 'ो']
];

const initialVowelMap: [string, string][] = [
  ['aa', 'आ'], ['ee', 'ई'], ['oo', 'ऊ'], ['ai', 'ऐ'], ['au', 'औ'], ['am', 'अं'],
  ['a', 'अ'], ['i', 'इ'], ['u', 'उ'], ['e', 'ए'], ['o', 'ओ']
];

const digits: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
};

export function transliterateWord(word: string): string {
  if (!word) return '';
  const clean = word.toLowerCase().trim();

  if (nameDictionary[clean]) {
    return nameDictionary[clean];
  }

  let res = '';
  let i = 0;
  let afterConsonant = false;

  while (i < clean.length) {
    const ch = clean[i];

    // Numbers
    if (digits[ch]) {
      res += digits[ch];
      i++;
      afterConsonant = false;
      continue;
    }

    // Vowel processing
    let matchedVowel = false;
    if (afterConsonant) {
      for (const [vStr, matra] of matraMap) {
        if (clean.startsWith(vStr, i)) {
          if (res && res.endsWith('्')) {
            res = res.slice(0, -1);
          }
          res += matra;
          i += vStr.length;
          matchedVowel = true;
          afterConsonant = false;
          break;
        }
      }
    } else {
      for (const [vStr, vChar] of initialVowelMap) {
        if (clean.startsWith(vStr, i)) {
          res += vChar;
          i += vStr.length;
          matchedVowel = true;
          afterConsonant = false;
          break;
        }
      }
    }

    if (matchedVowel) continue;

    // Consonant processing
    let matchedCons = false;
    for (const [cStr, cChar] of consonantMap) {
      if (clean.startsWith(cStr, i)) {
        res += cChar;
        i += cStr.length;
        matchedCons = true;
        afterConsonant = true;
        break;
      }
    }

    if (!matchedCons) {
      res += ch;
      i++;
      afterConsonant = false;
    }
  }

  // Remove trailing halants for clean word ending
  if (res.endsWith('्')) {
    res = res.slice(0, -1);
  }

  return res;
}

export function transliterateText(text: string): string {
  if (!text) return '';
  // Preserve spaces and process words individually
  return text.split(/(\s+)/).map((segment) => {
    if (/^\s+$/.test(segment)) return segment;
    return transliterateWord(segment);
  }).join('');
}
