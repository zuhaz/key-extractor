export function extractKey(code) {
  try {
    // === Try extracting from the new Base64 + atob format ===
    const base64VarMatch = code.match(/([a-zA-Z_$][\w$]*)\s*=\s*["']([A-Za-z0-9+/=]+)["']/);
    if (base64VarMatch) {
      const [_, varName, base64Value] = base64VarMatch;

      const atobCallRegex = new RegExp(
        `=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?return\\s+atob\\(${varName}\\)`,
        "s"
      );

      if (atobCallRegex.test(code)) {
        const key = Buffer.from(base64Value, "base64").toString("utf-8");
        console.log("✅ Extracted Key (Base64 format):", key);
        return key;
      }
    }

    // === Fallback to multi-part literal functions ===
    const getValue = (name) => {
      // Direct return: () => { return "abcd" }
      const directReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[^}]*?return\\s+["']([a-f0-9]+)["']`,
        "s"
      );

      // Flexible multiline return (supports if-else and window calls)
      const flexibleReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?return\\s+["']([a-f0-9]+)["']`,
        "s"
      );

      // atob return (deprecated: already tried above but kept for redundancy)
      const atobReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?return\\s+atob\\((\\w+)\\)`,
        "s"
      );

      const match = code.match(directReturn) || code.match(flexibleReturn);
      if (match) return match[1];

      // fallback base64 decoding
      const atobMatch = code.match(atobReturn);
      if (atobMatch) {
        const varName = atobMatch[1];
        const varRegex = new RegExp(`${varName}\\s*=\\s*["']([A-Za-z0-9+/=]+)["']`);
        const base64Match = code.match(varRegex);
        if (base64Match) {
          return Buffer.from(base64Match[1], "base64").toString("utf-8");
        }
      }

      return null;
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

    if (parts.every(Boolean)) {
      const fullKey = parts.join("");
      console.log("Extracted Key (multi-part format):", fullKey);
      return fullKey;
    }

    // === Fallback to legacy H2 structure ===
    const partA = code.match(/H2\["a"\]\s*=\s*"([a-f0-9]+)"/)?.[1];
    const partB = code.match(/H2\["b"\]\s*=\s*\(\)\s*=>\s*{[^}]*?if\s*\(!window\.T9i\.z1yD8Yo\(\)\)\s*{\s*return\s*"([a-f0-9]+)"/s)?.[1];
    const partC = code.match(/H2\["c"\]\s*=\s*"([a-f0-9]+)"/)?.[1];

    if (partA && partB && partC) {
      const legacyKey = partA + partB + partC;
      console.log("Extracted Key (legacy H2 format):", legacyKey);
      return legacyKey;
    }

    // === If everything fails ===
    console.error("Could not extract all parts of the key from any format.");
    console.table({ T, D, s, Z, J, A, v, o, n, S, g, partA, partB, partC });
    return null;
  } catch (e) {
    console.error("extractKey failed:", e.message);
    return null;
  }
}
