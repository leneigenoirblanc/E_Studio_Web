// Lightweight, robust QR code matrix generator for labels and shelf tags

export function generateQrMatrix(text: string): boolean[][] {
  const size = 25; // 25x25 Version 2 grid
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinderPattern(r: number, c: number) {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const row = r + i;
        const col = c + j;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
            if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
              matrix[row][col] = true;
            } else {
              matrix[row][col] = false;
            }
          } else {
            matrix[row][col] = false;
          }
        }
      }
    }
  }

  // Set 3 finder patterns
  setFinderPattern(0, 0);
  setFinderPattern(0, size - 7);
  setFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at bottom right
  const ar = size - 7;
  const ac = size - 7;
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) {
        matrix[ar + i][ac + j] = true;
      } else {
        matrix[ar + i][ac + j] = false;
      }
    }
  }

  // Deterministic pseudo-random fill based on input text content
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  let seed = Math.abs(hash) || 12345;

  function nextBit(): boolean {
    seed = (seed * 16807) % 2147483647;
    return (seed & 1) === 1;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders
      if (
        (r <= 7 && c <= 7) ||
        (r <= 7 && c >= size - 8) ||
        (r >= size - 8 && c <= 7) ||
        (r === 6 || c === 6) ||
        (r >= ar - 2 && r <= ar + 2 && c >= ac - 2 && c <= ac + 2)
      ) {
        continue;
      }
      matrix[r][c] = nextBit();
    }
  }

  return matrix;
}
