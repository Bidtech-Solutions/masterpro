import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import id from "../../messages/id.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  it("id.json dan en.json memiliki kunci identik (PRD §9.1)", () => {
    expect(keys(en).sort()).toEqual(keys(id).sort());
  });
});
