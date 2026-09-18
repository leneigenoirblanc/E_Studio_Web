// Vector Code 128 and EAN-13 Barcode generator

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

export function generateCode128Bars(text: string): boolean[] {
  const clean = text || "123456789012";
  const startCodeB = 104; // Start B
  const codes: number[] = [startCodeB];

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const codeVal = charCode - 32;
    if (codeVal >= 0 && codeVal <= 95) {
      codes.push(codeVal);
    } else {
      codes.push(0);
    }
  }

  // Calculate checksum
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106); // Stop code

  // Convert to bar pattern
  const bars: boolean[] = [];
  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      for (let w = 0; w < width; w++) {
        bars.push(isBar);
      }
      isBar = !isBar;
    }
  }
  // Terminal bar
  bars.push(true, true);
  return bars;
}

// EAN-13 encodings
const EAN_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011"
];
const EAN_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111"
];
const EAN_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100"
];
const EAN_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
];

export function generateEAN13Bars(code: string): { bars: boolean[]; formattedCode: string } {
  const digitsOnly = code.replace(/\D/g, "").padStart(12, "0").slice(-12);
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digitsOnly[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const full13 = digitsOnly + checkDigit.toString();

  const firstDigit = parseInt(full13[0], 10);
  const parity = EAN_PARITY[firstDigit];

  const bars: boolean[] = [];
  // Normal quiet zone / start guard: 101
  bars.push(true, false, true);

  // First group of 6 digits (L or G)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(full13[i + 1], 10);
    const useG = parity[i] === 'G';
    const pattern = useG ? EAN_G[digit] : EAN_L[digit];
    for (let b = 0; b < pattern.length; b++) {
      bars.push(pattern[b] === '1');
    }
  }

  // Center guard: 01010
  bars.push(false, true, false, true, false);

  // Second group of 6 digits (R)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(full13[i + 7], 10);
    const pattern = EAN_R[digit];
    for (let b = 0; b < pattern.length; b++) {
      bars.push(pattern[b] === '1');
    }
  }

  // End guard: 101
  bars.push(true, false, true);

  return { bars, formattedCode: full13 };
}
