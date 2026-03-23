import { describe, it, expect } from "vitest";
import { clamp, distancia, isValidNum } from "../math";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when value is below", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps to max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("works with negative range", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

describe("distancia", () => {
  it("returns 0 for same point", () => {
    expect(distancia({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(0);
  });

  it("returns 5 for classic 3-4-5 triangle", () => {
    expect(distancia({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("is symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(distancia(a, b)).toBe(distancia(b, a));
  });

  it("works with negative coordinates", () => {
    expect(distancia({ x: -3, y: 0 }, { x: 0, y: -4 })).toBe(5);
  });
});

describe("isValidNum", () => {
  it("returns true for finite numbers", () => {
    expect(isValidNum(0)).toBe(true);
    expect(isValidNum(42)).toBe(true);
    expect(isValidNum(-7.5)).toBe(true);
  });

  it("returns false for NaN", () => {
    expect(isValidNum(NaN)).toBe(false);
  });

  it("returns false for Infinity", () => {
    expect(isValidNum(Infinity)).toBe(false);
    expect(isValidNum(-Infinity)).toBe(false);
  });

  it("returns false for non-number types", () => {
    expect(isValidNum("5")).toBe(false);
    expect(isValidNum(null)).toBe(false);
    expect(isValidNum(undefined)).toBe(false);
    expect(isValidNum({})).toBe(false);
  });
});
