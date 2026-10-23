import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreProperty, DEFAULT_WEIGHTS, type Criteria } from "../src/lib/matching.ts";

const base: Criteria = { districts: [], neighborhoods: [], budgetMax: null, types: [], roomsMin: null, netSqmMin: null, features: [], citizenshipOnly: false, strict: [] };
const prop = (over: object) =>
  ({
    id: "p", code: "BD-0001", slug: "x", title: "t", summary: "", description: "", district: "bodrum", neighborhood: "Yalıkavak", type: "villa",
    price: 50_000_000, rooms: "4+1", grossSqm: 250, netSqm: 200, landSqm: 600, buildingAge: 2, floor: null, bathrooms: 3,
    features: { pool: true, garden: true, seaView: true, parking: true, furnished: false, inSite: false, creditEligible: false },
    factSources: {}, titleDeed: null, seaDistanceM: null, scene: { seed: 1, time: "day", kind: "villa" }, sceneCount: 5, developmentId: null,
    publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), inCitizenshipCollection: false, developmentName: null, ...over,
  }) as never;

test("tüm kriterler uyarsa 'tam uyum'", () => {
  const r = scoreProperty({ ...base, districts: ["bodrum"], budgetMax: 60_000_000, types: ["villa"], roomsMin: 4, features: ["pool"] }, prop({}));
  assert.equal(r?.kind, "tam");
  assert.equal(r?.score, 100);
});

test("bütçeyi %25'ten fazla aşan ilan önerilmez", () => {
  assert.equal(scoreProperty({ ...base, budgetMax: 30_000_000 }, prop({ price: 38_000_000 })), null);
  assert.notEqual(scoreProperty({ ...base, budgetMax: 30_000_000 }, prop({ price: 36_000_000 })), null);
});

test("kesin bütçe: 1 TL aşım bile elenir", () => {
  assert.equal(scoreProperty({ ...base, budgetMax: 50_000_000, strict: ["butce"] }, prop({ price: 50_000_001 })), null);
});

test("ilgisiz tür önerilmez, benzer tür yarım puanla önerilir", () => {
  assert.equal(scoreProperty({ ...base, types: ["villa"] }, prop({ type: "apartment" })), null);
  const r = scoreProperty({ ...base, types: ["villa"] }, prop({ type: "detached" }));
  assert.equal(r?.kind, "yakin");
});

test("vatandaşlık araması koleksiyon dışını almaz", () => {
  assert.equal(scoreProperty({ ...base, citizenshipOnly: true }, prop({ inCitizenshipCollection: false })), null);
});

test(`alt sınır %${DEFAULT_WEIGHTS.minScore} altı gösterilmez`, () => {
  const r = scoreProperty({ ...base, districts: ["milas"], budgetMax: 45_000_000, types: ["villa"], roomsMin: 6, netSqmMin: 400, features: ["furnished", "inSite"] }, prop({}));
  assert.equal(r, null);
});
