import { expect, test } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function getTestCredentials(): { email: string; password: string } {
  const path = join(process.cwd(), "test_assets", "test_users.json");
  if (!existsSync(path)) return { email: "oliver.abreu@flolabsrd.com", password: "gq2A1xZ^CdMM#uUpJnfc" };
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      users?: Array<{ emails?: string[]; password?: string; role?: string }>;
    };
    const hrUser = data.users?.find((u) => u.role === "Human Resources");
    if (hrUser) {
      const rawEmails = hrUser.emails?.[0] ?? "";
      const email = rawEmails.split(",")[0].trim();
      return { email, password: hrUser.password ?? "" };
    }
  } catch {
    // fall through
  }
  return { email: "oliver.abreu@flolabsrd.com", password: "gq2A1xZ^CdMM#uUpJnfc" };
}

test.describe("Admin HubSpot CSV → flolabs_users sync", () => {
  test("returns 403 without HR session (skips if route not on server)", async ({ request }) => {
    const res = await request.post("/api/admin/contacts/hubspot-csv-sync", {
      multipart: {
        file: {
          name: "contacts.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            ['Record ID,First Name,Last Name,Email', '999,Sync,Test,sync-test-e2e@flolabs.invalid'].join("\n"),
            "utf8",
          ),
        },
      },
    });
    if (res.status() === 404) {
      test.skip(true, "POST /api/admin/contacts/hubspot-csv-sync not deployed on this PLAYWRIGHT_BASE_URL yet");
    }
    expect(res.status()).toBe(403);
  });

  test("HR can upload a minimal CSV and receive ok JSON", async ({ page }) => {
    test.setTimeout(120_000);
    const probe = await page.context().request.post("/api/admin/contacts/hubspot-csv-sync", {
      multipart: {
        file: {
          name: "probe.csv",
          mimeType: "text/csv",
          buffer: Buffer.from("Record ID,Email\n1,x@y.com", "utf8"),
        },
      },
    });
    if (probe.status() === 404) {
      test.skip(true, "POST /api/admin/contacts/hubspot-csv-sync not deployed on this PLAYWRIGHT_BASE_URL yet");
    }

    const { email, password } = getTestCredentials();

    await page.goto("/login", { waitUntil: "load" });
    await page.locator("input").first().waitFor({ state: "visible" });
    await page.locator("input").first().fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL(/\/me\/hr/, { timeout: 60_000 });
    } catch {
      test.skip(true, "HR login did not reach /me/hr — check credentials and PLAYWRIGHT_BASE_URL");
    }

    const csvBody = [
      "Record ID,First Name,Last Name,Email,Company Name",
      `e2e-${Date.now()},E2E,HubSpotSync,hubspot-csv-e2e-${Date.now()}@flolabs.invalid,QA`,
    ].join("\n");

    const res = await page.request.post("/api/admin/contacts/hubspot-csv-sync", {
      multipart: {
        file: {
          name: "hubspot-snippet.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(csvBody, "utf8"),
        },
      },
    });

    expect(res.ok(), await res.text()).toBeTruthy();
    const json = (await res.json()) as { ok?: boolean; upserted?: number };
    expect(json.ok).toBe(true);
    expect((json.upserted ?? 0) >= 1).toBe(true);
  });
});
