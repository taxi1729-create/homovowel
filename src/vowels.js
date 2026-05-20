// ============================================================
// 母音変換ロジック
// ============================================================

const KANA_ROMAJI_MAP = {
  あ:"a",い:"i",う:"u",え:"e",お:"o",
  ア:"a",イ:"i",ウ:"u",エ:"e",オ:"o",
  か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  カ:"ka",キ:"ki",ク:"ku",ケ:"ke",コ:"ko",
  さ:"sa",し:"si",す:"su",せ:"se",そ:"so",
  サ:"sa",シ:"si",ス:"su",セ:"se",ソ:"so",
  た:"ta",ち:"ti",つ:"tu",て:"te",と:"to",
  タ:"ta",チ:"ti",ツ:"tu",テ:"te",ト:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",
  ナ:"na",ニ:"ni",ヌ:"nu",ネ:"ne",ノ:"no",
  は:"ha",ひ:"hi",ふ:"hu",へ:"he",ほ:"ho",
  ハ:"ha",ヒ:"hi",フ:"hu",ヘ:"he",ホ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",
  マ:"ma",ミ:"mi",ム:"mu",メ:"me",モ:"mo",
  や:"ya",ゆ:"yu",よ:"yo",ヤ:"ya",ユ:"yu",ヨ:"yo",
  ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",
  ラ:"ra",リ:"ri",ル:"ru",レ:"re",ロ:"ro",
  わ:"wa",を:"o",ん:"n",ワ:"wa",ヲ:"o",ン:"n",
  が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",
  ガ:"ga",ギ:"gi",グ:"gu",ゲ:"ge",ゴ:"go",
  ざ:"za",じ:"zi",ず:"zu",ぜ:"ze",ぞ:"zo",
  ザ:"za",ジ:"zi",ズ:"zu",ゼ:"ze",ゾ:"zo",
  だ:"da",ぢ:"di",づ:"du",で:"de",ど:"do",
  ダ:"da",ヂ:"di",ヅ:"du",デ:"de",ド:"do",
  ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",
  バ:"ba",ビ:"bi",ブ:"bu",ベ:"be",ボ:"bo",
  ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",
  パ:"pa",ピ:"pi",プ:"pu",ペ:"pe",ポ:"po",
  きゃ:"kya",きゅ:"kyu",きょ:"kyo",
  しゃ:"sya",しゅ:"syu",しょ:"syo",
  ちゃ:"tya",ちゅ:"tyu",ちょ:"tyo",
  にゃ:"nya",にゅ:"nyu",にょ:"nyo",
  ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",
  みゃ:"mya",みゅ:"myu",みょ:"myo",
  りゃ:"rya",りゅ:"ryu",りょ:"ryo",
  ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",
  じゃ:"zya",じゅ:"zyu",じょ:"zyo",
  びゃ:"bya",びゅ:"byu",びょ:"byo",
  ぴゃ:"pya",ぴゅ:"pyu",ぴょ:"pyo",
  キャ:"kya",キュ:"kyu",キョ:"kyo",
  シャ:"sya",シュ:"syu",ショ:"syo",
  チャ:"tya",チュ:"tyu",チョ:"tyo",
  ニャ:"nya",ニュ:"nyu",ニョ:"nyo",
  ヒャ:"hya",ヒュ:"hyu",ヒョ:"hyo",
  ミャ:"mya",ミュ:"myu",ミョ:"myo",
  リャ:"rya",リュ:"ryu",リョ:"ryo",
  ギャ:"gya",ギュ:"gyu",ギョ:"gyo",
  ジャ:"zya",ジュ:"zyu",ジョ:"zyo",
  ビャ:"bya",ビュ:"byu",ビョ:"byo",
  ピャ:"pya",ピュ:"pyu",ピョ:"pyo",
  ファ:"fa",フィ:"fi",フェ:"fe",フォ:"fo",ヴ:"vu",
};

export function getVowels(reading) {
  const chars = [...reading];
  let result = "";
  let prev = "";
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === "ー" || ch === "―") { result += prev; i++; continue; }
    if (i + 1 < chars.length) {
      const two = ch + chars[i + 1];
      if (KANA_ROMAJI_MAP[two]) {
        const rom = KANA_ROMAJI_MAP[two];
        const v = rom[rom.length - 1];
        result += v; prev = v; i += 2; continue;
      }
    }
    const rom = KANA_ROMAJI_MAP[ch];
    if (rom) {
      if (rom === "n") { result += "n"; prev = "n"; i++; continue; }
      const v = rom[rom.length - 1];
      result += v; prev = v;
    }
    i++;
  }
  return result;
}

export function isSameVowel(a, b) {
  return getVowels(a) === getVowels(b);
}

export function countKana(reading) {
  const chars = [...reading];
  let count = 0;
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === "ー" || ch === "―") { i++; continue; }
    if (i + 1 < chars.length && KANA_ROMAJI_MAP[ch + chars[i + 1]]) {
      count++; i += 2;
    } else {
      if (KANA_ROMAJI_MAP[ch] || /[ぁ-んァ-ン]/.test(ch)) count++;
      i++;
    }
  }
  return count;
}
