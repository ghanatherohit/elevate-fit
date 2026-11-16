/** Extract Mongo duplicate-key (E11000) details from driver / Mongoose errors. */
export function getMongoDuplicateKey(error: unknown): {
  fields: string[];
} | null {
  const candidates: unknown[] = [error];
  if (error && typeof error === "object") {
    if ("cause" in error) {
      candidates.push((error as { cause?: unknown }).cause);
    }
    if ("errorResponse" in error) {
      candidates.push((error as { errorResponse?: unknown }).errorResponse);
    }
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const code =
      "code" in candidate ? (candidate as { code?: unknown }).code : undefined;
    const message =
      "message" in candidate &&
      typeof (candidate as { message?: unknown }).message === "string"
        ? (candidate as { message: string }).message
        : "";

    const isDuplicate =
      code === 11000 ||
      code === "11000" ||
      message.includes("E11000") ||
      message.includes("duplicate key");

    if (!isDuplicate) {
      continue;
    }

    const fields = new Set<string>();
    const keyPattern =
      "keyPattern" in candidate
        ? (candidate as { keyPattern?: Record<string, unknown> }).keyPattern
        : undefined;
    const keyValue =
      "keyValue" in candidate
        ? (candidate as { keyValue?: Record<string, unknown> }).keyValue
        : undefined;

    if (keyPattern) {
      for (const key of Object.keys(keyPattern)) {
        fields.add(key);
      }
    }
    if (keyValue) {
      for (const key of Object.keys(keyValue)) {
        fields.add(key);
      }
    }

    // Fallback: parse index name from message, e.g. "index: email_1 dup key"
    if (fields.size === 0) {
      const match = message.match(/index:\s*([a-zA-Z0-9_]+)/);
      const indexName = match?.[1]?.replace(/_\d+$/, "");
      if (indexName) {
        fields.add(indexName);
      }
    }

    return { fields: [...fields] };
  }

  return null;
}
