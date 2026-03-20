import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

// Isolated signature verification logic (extracted for testability)
function verifySignature(
  xSignature: string | null,
  xRequestId: string | null,
  body: string,
  secret: string,
): boolean {
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const parsedBody = JSON.parse(body) as { data?: { id?: string | number } };
  const dataId = parsedBody.data?.id ?? "";

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return computedHash === hash;
}

const TEST_SECRET = "test-webhook-secret-12345";

function createValidSignature(
  body: string,
  requestId: string,
  ts: string,
): string {
  const parsedBody = JSON.parse(body) as { data?: { id?: string | number } };
  const dataId = parsedBody.data?.id ?? "";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac("sha256", TEST_SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${hash}`;
}

describe("Webhook Signature Verification", () => {
  const validBody = JSON.stringify({ type: "payment", data: { id: "12345" } });
  const requestId = "req-abc-123";
  const ts = "1700000000";

  it("accepts valid signature", () => {
    const signature = createValidSignature(validBody, requestId, ts);
    expect(verifySignature(signature, requestId, validBody, TEST_SECRET)).toBe(
      true,
    );
  });

  it("rejects missing x-signature", () => {
    expect(verifySignature(null, requestId, validBody, TEST_SECRET)).toBe(
      false,
    );
  });

  it("rejects missing x-request-id", () => {
    const signature = createValidSignature(validBody, requestId, ts);
    expect(verifySignature(signature, null, validBody, TEST_SECRET)).toBe(
      false,
    );
  });

  it("rejects tampered body", () => {
    const signature = createValidSignature(validBody, requestId, ts);
    const tamperedBody = JSON.stringify({
      type: "payment",
      data: { id: "99999" },
    });
    expect(
      verifySignature(signature, requestId, tamperedBody, TEST_SECRET),
    ).toBe(false);
  });

  it("rejects wrong secret", () => {
    const signature = createValidSignature(validBody, requestId, ts);
    expect(
      verifySignature(signature, requestId, validBody, "wrong-secret"),
    ).toBe(false);
  });

  it("rejects signature without ts", () => {
    const hash = createHmac("sha256", TEST_SECRET).update("test").digest("hex");
    expect(
      verifySignature(`v1=${hash}`, requestId, validBody, TEST_SECRET),
    ).toBe(false);
  });

  it("rejects signature without v1 hash", () => {
    expect(verifySignature(`ts=${ts}`, requestId, validBody, TEST_SECRET)).toBe(
      false,
    );
  });

  it("rejects empty x-signature string", () => {
    expect(verifySignature("", requestId, validBody, TEST_SECRET)).toBe(false);
  });

  it("handles numeric data.id", () => {
    const bodyWithNumericId = JSON.stringify({
      type: "payment",
      data: { id: 12345 },
    });
    const signature = createValidSignature(bodyWithNumericId, requestId, ts);
    expect(
      verifySignature(signature, requestId, bodyWithNumericId, TEST_SECRET),
    ).toBe(true);
  });

  it("handles body without data.id", () => {
    const bodyNoId = JSON.stringify({ type: "test", data: {} });
    const signature = createValidSignature(bodyNoId, requestId, ts);
    expect(verifySignature(signature, requestId, bodyNoId, TEST_SECRET)).toBe(
      true,
    );
  });
});
