import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, bucketInterested } from "../src/lib/statsCore.ts";

const CUT = "2026-10-21T21:00:00.000Z";
const ev = (actorKey: string, type: string, at: string, propertyId = "p1") => ({ propertyId, actorKey, type, at }) as never;

test("aynı kişinin aynı gündeki görüntülemeleri tek sayılır, farklı gün ayrı sayılır", () => {
  const s = aggregate(
    [ev("a", "view", "2026-10-20T08:00:00Z"), ev("a", "view", "2026-10-20T09:00:00Z"), ev("a", "view", "2026-10-19T09:00:00Z"), ev("b", "view", "2026-10-20T10:00:00Z")],
    CUT,
  );
  assert.equal(s.get("p1")!.views, 3);
});

test("favori: ekle-çıkar-ekle bir kez sayılır, son durumu 'çıkar' olan sayılmaz", () => {
  const s = aggregate(
    [
      ev("a", "favorite_add", "2026-10-20T08:00:00Z"),
      ev("a", "favorite_remove", "2026-10-20T08:01:00Z"),
      ev("a", "favorite_add", "2026-10-20T08:02:00Z"),
      ev("b", "favorite_add", "2026-10-20T08:00:00Z"),
      ev("b", "favorite_remove", "2026-10-20T08:05:00Z"),
    ],
    CUT,
  );
  assert.equal(s.get("p1")!.favorites, 1);
});

test("ilgilenen alıcı: aynı kişinin birden çok talebi tek sayılır", () => {
  const s = aggregate(
    [ev("a", "inquiry", "2026-10-20T08:00:00Z"), ev("a", "viewing_request", "2026-10-20T09:00:00Z"), ev("a", "inquiry", "2026-10-20T10:00:00Z"), ev("b", "inquiry", "2026-10-20T10:00:00Z")],
    CUT,
  );
  assert.equal(s.get("p1")!.interestedBuyers, 2);
});

test("gecikme: kesim anından sonraki olaylar sayılmaz", () => {
  const s = aggregate([ev("a", "inquiry", "2026-10-21T22:00:00Z"), ev("b", "view", "2026-10-22T08:00:00Z")], CUT);
  assert.equal(s.get("p1"), undefined);
});

test("ilanlar birbirine karışmaz", () => {
  const s = aggregate([ev("a", "inquiry", "2026-10-20T08:00:00Z", "p1"), ev("a", "inquiry", "2026-10-20T08:00:00Z", "p2")], CUT);
  assert.equal(s.get("p1")!.interestedBuyers, 1);
  assert.equal(s.get("p2")!.interestedBuyers, 1);
});

test("kova: 0 → '0', 1 ve 2 → '1–2', 3+ → kesin sayı", () => {
  assert.equal(bucketInterested(0), "0");
  assert.equal(bucketInterested(1), "1–2");
  assert.equal(bucketInterested(2), "1–2");
  assert.equal(bucketInterested(3), "3");
  assert.equal(bucketInterested(17), "17");
});
