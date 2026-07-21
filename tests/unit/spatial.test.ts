import { describe, expect, it } from "vitest";
import { calculateVideoTransform, mapNormalizedBox } from "@/lib/spatial";

describe("calculateVideoTransform", () => {
  it("letterboxes contained landscape video", () => {
    const transform = calculateVideoTransform(1920, 1080, 1000, 1000, "contain");
    expect(transform.renderedWidth).toBeCloseTo(1000); expect(transform.renderedHeight).toBeCloseTo(562.5); expect(transform.offsetY).toBeCloseTo(218.75);
  });
  it("crops cover video symmetrically", () => {
    const transform = calculateVideoTransform(1920, 1080, 1000, 1000, "cover");
    expect(transform.renderedHeight).toBe(1000); expect(transform.offsetX).toBeCloseTo(-388.89, 1);
  });
  it("mirrors normalized boxes around the source center", () => {
    const transform = calculateVideoTransform(1000, 1000, 500, 500, "contain", true);
    expect(mapNormalizedBox({ x: 100, y: 200, width: 200, height: 100 }, transform)).toEqual({ left: 350, top: 100, width: 100, height: 50 });
  });
  it("rejects invalid dimensions", () => expect(() => calculateVideoTransform(0, 10, 10, 10)).toThrow());
});
