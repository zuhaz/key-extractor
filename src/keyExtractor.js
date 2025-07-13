export function extractKey(code) {
  try {
    let extractedParts = [];

    // === [0] CharCode Array + fromCharCode inside a function ===
    const arrayRegex = /([a-zA-Z_$][\w$]*)\s*=\s*\[((?:\d{1,3},?\s*)+)\];/g;
    const arrayMap = new Map();

    for (const match of code.matchAll(arrayRegex)) {
      const [, name, values] = match;
      const nums = values.split(",").map((n) => parseInt(n.trim(), 10));
      arrayMap.set(name, nums);
    }

    const funcCharCodeRegex = /return\s+String\s*\[\s*["']fromCharCode["']\s*\]\s*\(\s*\.\.\.([a-zA-Z_$][\w$]*)\s*\)/;
    const funcMatch = code.match(funcCharCodeRegex);

    if (funcMatch) {
      const arrayName = funcMatch[1];
      if (arrayMap.has(arrayName)) {
        const decoded = String.fromCharCode(...arrayMap.get(arrayName));
        if (/^[a-f0-9]{16,}$/i.test(decoded)) {
          console.log("✅ Extracted Key (char code + function):", decoded);
          return decoded;
        }
      }
    }

    // === [1] Direct atob("...") assignments ===
    const directAtobMatches = [...code.matchAll(
      /([a-zA-Z_$][\w$]*)\s*=\s*atob\(["']([A-Za-z0-9+/=]+)["']\)/g
    )];
    for (const [, varName, base64] of directAtobMatches) {
      const decoded = Buffer.from(base64, "base64").toString("utf-8");
      if (/^[a-f0-9]+$/i.test(decoded)) {
        extractedParts.push(decoded);
      }
    }

    // === [1.5] Add known variable M if it exists and is a hex string ===
    const mMatch = code.match(/\bM\s*=\s*["']([a-f0-9]{16,})["']/i);
    if (mMatch) {
      extractedParts.push(mMatch[1]);
    }

    if (extractedParts.length > 0) {
      const fullKey = extractedParts.join("");
      console.log("✅ Extracted Key (direct atob + M):", fullKey);
      return fullKey;
    }

    // === [2] Base64 var + atob via function ===
    const base64VarMatch = code.match(
      /([a-zA-Z_$][\w$]*)\s*=\s*["']([A-Za-z0-9+/=]+)["']/
    );
    if (base64VarMatch) {
      const [_, varName, base64Value] = base64VarMatch;
      const atobCallRegex = new RegExp(
        `=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?atob\\(${varName}\\)`,
        "s"
      );
      if (atobCallRegex.test(code)) {
        const key = Buffer.from(base64Value, "base64").toString("utf-8");
        console.log("✅ Extracted Key (Base64 var + atob call):", key);
        return key;
      }
    }

    // === [3] Multi-part value extraction ===
    const getValue = (name) => {
      const directReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[^}]*?return\\s+["']([a-f0-9]+)["']`,
        "s"
      );
      const flexibleReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?return\\s+["']([a-f0-9]+)["']`,
        "s"
      );
      const atobReturn = new RegExp(
        `${name}\\s*=\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?atob\\((\\w+)\\)`,
        "s"
      );

      const match = code.match(directReturn) || code.match(flexibleReturn);
      if (match) return match[1];

      const atobMatch = code.match(atobReturn);
      if (atobMatch) {
        const varName = atobMatch[1];
        const varRegex = new RegExp(
          `${varName}\\s*=\\s*["']([A-Za-z0-9+/=]+)["']`
        );
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
      console.log("✅ Extracted Key (multi-part format):", fullKey);
      return fullKey;
    }

    // === [4] Legacy format ===
    const partA = code.match(/H2\["a"\]\s*=\s*"([a-f0-9]+)"/)?.[1];
    const partB = code.match(
      /H2\["b"\]\s*=\s*\(\)\s*=>\s*{[^}]*?if\s*\(!window\.T9i\.z1yD8Yo\(\)\)\s*{\s*return\s*"([a-f0-9]+)"/s
    )?.[1];
    const partC = code.match(/H2\["c"\]\s*=\s*"([a-f0-9]+)"/)?.[1];

    if (partA && partB && partC) {
      const legacyKey = partA + partB + partC;
      console.log("✅ Extracted Key (legacy H2 format):", legacyKey);
      return legacyKey;
    }

    // === [5] Final fallback: long hex literals ===
    const hexLiteralMatches = [...code.matchAll(
      /([a-zA-Z_$][\w$]*)\s*=\s*["']([a-f0-9]{16,})["']/gi
    )];
    const allHexParts = hexLiteralMatches
      .map(([, varName, hex]) => hex)
      .filter((hex, i, self) => self.indexOf(hex) === i);

    if (allHexParts.length > 0) {
      const joined = allHexParts.join("");
      console.log("✅ Extracted Key (hex literals fallback):", joined);
      return joined;
    }

    // === If all failed ===
    console.error("❌ Could not extract key from any format.");
    console.table({ T, D, s, Z, J, A, v, o, n, S, g, partA, partB, partC });
    return null;
  } catch (e) {
    console.error("extractKey failed:", e.message);
    return null;
  }
}
