import { describe, expect, it } from "vitest";

import { googleMapsUrl, parseCoordinates, roundCoordinate } from "./maps";

describe("parseCoordinates (PRP-03)", () => {
  it("membaca pasangan lat, lng", () => {
    expect(parseCoordinates("1.1301, 104.0529")).toEqual({ lat: 1.1301, lng: 104.0529 });
    expect(parseCoordinates(" 1.1301 104.0529 ")).toEqual({ lat: 1.1301, lng: 104.0529 });
  });

  it("mengutamakan titik pin !3d!4d dibanding pusat tampilan @", () => {
    const url =
      "https://www.google.com/maps/place/Mega+Mall/@1.1290,104.0500,17z/data=!3m1!4b1!4m6!3m5!8m2!3d1.1312345!4d104.0567891";
    expect(parseCoordinates(url)).toEqual({ lat: 1.131235, lng: 104.056789 });
  });

  it("membaca @lat,lng dan parameter query", () => {
    expect(parseCoordinates("https://www.google.com/maps/@1.12,104.05,15z")).toEqual({
      lat: 1.12,
      lng: 104.05,
    });
    expect(parseCoordinates("https://maps.google.com/?q=1.1%2C104.0")).toEqual({ lat: 1.1, lng: 104 });
    expect(parseCoordinates("https://www.google.com/maps/search/?api=1&query=1.2,104.1")).toEqual({
      lat: 1.2,
      lng: 104.1,
    });
  });

  it("menolak teks tanpa koordinat atau di luar rentang", () => {
    expect(parseCoordinates("")).toBeNull();
    expect(parseCoordinates("https://maps.app.goo.gl/AbCdEf123")).toBeNull();
    expect(parseCoordinates("95, 104")).toBeNull();
    expect(parseCoordinates("Batam Centre")).toBeNull();
  });
});

describe("helper peta", () => {
  it("membulatkan ke 6 desimal", () => {
    expect(roundCoordinate(1.123456789)).toBe(1.123457);
  });

  it("membentuk tautan Google Maps", () => {
    expect(googleMapsUrl({ lat: 1.1, lng: 104.05 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=1.1,104.05",
    );
  });
});
