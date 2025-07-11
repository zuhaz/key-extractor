export function extractKey(code) {
  try {
    const getValue = (name) => {
      const directReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[^}]*?return\\s+["']([a-f0-9]+)["']`,
        's'
      );
      const nestedReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?return\\s+["']([a-f0-9]+)["']`,
        's'
      );
      return code.match(directReturn)?.[1] || code.match(nestedReturn)?.[1] || null;
    };

    const T = getValue("T");
    const D = getValue("D");
    const s = getValue("s");
    const Z = getValue("Z");
    const J = getValue("J");
    const A = getValue("A");
    const v = getValue("v");
    const o = getValue("o");
    const n = getValue("n");
    const S = getValue("S");
    const g = getValue("g");

    const parts = [T, D, s, Z, J, A, v, o, n, S, g];

    // If all parts found, return concatenated key
    if (parts.every(Boolean)) {
      const fullKey = parts.join("");
      console.log("✅ Extracted Key (new format):", fullKey);
      return fullKey;
    }

    // Backup: Old structure (H2["a"], H2["b"], H2["c"])
    const partA = code.match(/H2\["a"\]\s*=\s*"([a-f0-9]+)"/)?.[1];
    const partB = code.match(/H2\["b"\]\s*=\s*\(\)\s*=>\s*{[^}]*?if\s*\(!window\.T9i\.z1yD8Yo\(\)\)\s*{\s*return\s*"([a-f0-9]+)"/s)?.[1];
    const partC = code.match(/H2\["c"\]\s*=\s*"([a-f0-9]+)"/)?.[1];

    if (partA && partB && partC) {
      const legacyKey = partA + partB + partC;
      console.log("✅ Extracted Key (legacy format):", legacyKey);
      return legacyKey;
    }

    console.error("Could not extract all parts of the key from either format.");
    console.table({ T, D, s, Z, J, A, v, o, n, S, g, partA, partB, partC });
    return null;
  } catch (e) {
    console.error("extractKey failed:", e.message);
    return null;
  }
}
