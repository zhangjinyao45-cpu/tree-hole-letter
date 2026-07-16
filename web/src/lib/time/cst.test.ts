import { describe, expect, it } from "vitest";

import { addYearsToCalendarDate, canUnlock, cstCalendarDate, cstDateToUnlockInstant, isAllowedUnlockDate } from "@/lib/time/cst";

describe("CST calendar rules", () => {
  it("maps Shanghai midnight to the previous UTC day at 16:00", () => {
    expect(cstDateToUnlockInstant("2027-07-16").toISOString()).toBe("2027-07-15T16:00:00.000Z");
  });

  it("uses the last valid day when adding years to leap day", () => {
    expect(addYearsToCalendarDate("2024-02-29", 1)).toBe("2025-02-28");
  });

  it("derives the China calendar date around UTC boundaries", () => {
    expect(cstCalendarDate(new Date("2026-07-15T16:30:00Z"))).toBe("2026-07-16");
  });

  it("allows tomorrow through exactly ten years", () => {
    const now = new Date("2026-07-16T02:00:00Z");
    expect(isAllowedUnlockDate("2026-07-17", now)).toBe(true);
    expect(isAllowedUnlockDate("2026-07-16", now)).toBe(false);
    expect(isAllowedUnlockDate("2036-07-16", now)).toBe(true);
    expect(isAllowedUnlockDate("2036-07-17", now)).toBe(false);
  });

  it("unlocks at the inclusive boundary", () => {
    const unlockAt = new Date("2027-07-15T16:00:00Z");
    expect(canUnlock(unlockAt, new Date("2027-07-15T15:59:59.999Z"))).toBe(false);
    expect(canUnlock(unlockAt, new Date("2027-07-15T16:00:00Z"))).toBe(true);
  });
});
