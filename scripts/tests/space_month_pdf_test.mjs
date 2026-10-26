import assert from "node:assert/strict";
import Module from "node:module";
import { writeFile } from "node:fs/promises";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { register } from "tsx/esm/api";
import "tsx/cjs";

register();
const { createSpaceMonthPdf } =
  await import("../../src/lib/space_month_pdf.ts");

function report(count = 1) {
  return {
    space: {
      id: "space",
      name: "Shared expenses - Café São Paulo",
      selectedMonthTotal: -100 * count,
    },
    selectedMonth: { key: "2026-10", label: "October 2026" },
    selectedMonthRelevantTransactions: Array.from(
      { length: count },
      (_, index) => ({
        id: `transaction-${index}`,
        type: "expense",
        description: `Purchase ${index + 1} - Café São Paulo - София`,
        participantNames:
          index === 0 ? [] : ["Sophia", "София", "José da Silva"],
        amount: -100,
        beginDate: "2026-10-01T00:00:00.000Z",
        endDate: "2026-10-01T00:00:00.000Z",
        transferSpaceId: null,
        transferSpaceName: null,
      }),
    ),
    participantGroupTotals: [
      {
        id: "owner",
        name: "Leo Gonzalez",
        amount: -50 * count,
      },
      {
        id: "member",
        name: "Sophia",
        amount: -50 * count,
      },
    ],
  };
}

test("monthly PDF supports empty reports, Unicode, and multiple pages including a split row", async () => {
  const empty = report(0);
  const emptyPdf = await PDFDocument.load(await createSpaceMonthPdf(empty));
  assert.equal(emptyPdf.getPageCount(), 1);
  assert.equal(emptyPdf.getTitle(), `${empty.space.name} - October 2026`);
  const long = report(65);
  long.selectedMonthRelevantTransactions[1].description =
    "Long description ".repeat(600);
  long.selectedMonthRelevantTransactions[2].description = "Unbroken".repeat(90);
  long.selectedMonthRelevantTransactions[3].transferSpaceId = "other";
  long.selectedMonthRelevantTransactions[3].transferSpaceName = "Other space";
  long.selectedMonthRelevantTransactions[4].endDate =
    "2026-12-01T00:00:00.000Z";
  long.participantGroupTotals.push({
    id: "former",
    name: "Alex",
    amount: 0,
  });
  const bytes = await createSpaceMonthPdf(long);
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  const document = await PDFDocument.load(bytes);
  assert.ok(document.getPageCount() >= 4);
  assert.ok(
    document
      .getPages()
      .every(
        (page) =>
          Math.round(page.getWidth()) === 595 &&
          Math.round(page.getHeight()) === 842,
      ),
  );
  if (process.env.PDF_PREVIEW_PATH)
    await writeFile(process.env.PDF_PREVIEW_PATH, bytes);
});

test("PDF export requires an authenticated owner and keeps downloads private", async () => {
  let user = null;
  let payload = null;
  let queries = 0;
  let renders = 0;
  const originalLoad = Module._load;
  Module._load = function (specifier, ...args) {
    if (specifier === "@/lib/session")
      return { getCurrentUserAccount: async () => user };
    if (specifier === "@/actions/spaces")
      return {
        getSpaceDetailPayloadForUser: async (owner, input) => {
          queries++;
          assert.equal(owner, "owner");
          assert.equal(input.spaceId, "space");
          assert.equal(input.selectedMonthStart.getFullYear(), 2026);
          assert.equal(input.selectedMonthStart.getMonth(), 8);
          return payload;
        },
      };
    if (specifier === "@/lib/space_month_pdf")
      return {
        createSpaceMonthPdf: async (data) => {
          renders++;
          assert.equal(data, payload);
          return new Uint8Array(Buffer.from("%PDF-test"));
        },
      };
    return originalLoad.call(this, specifier, ...args);
  };
  let GET;
  try {
    ({ GET } = await import("../../src/app/api/spaces/[id]/export/route.ts"));
  } finally {
    Module._load = originalLoad;
  }
  const request = new Request(
    "http://localhost/api/spaces/space/export?currentMonth=2026-09",
  );
  const context = { params: Promise.resolve({ id: "space" }) };
  const unauthorized = await GET(request, context);
  assert.equal(unauthorized.status, 401);
  assert.equal(queries, 0);
  user = { id: "owner" };
  const notFound = await GET(request, context);
  assert.equal(notFound.status, 404);
  assert.equal(renders, 0);
  payload = report();
  payload.selectedMonth = { key: "2026-09", label: "September 2026" };
  const response = await GET(request, context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/pdf");
  assert.match(
    response.headers.get("Content-Disposition"),
    /attachment;.*2026-09\.pdf/,
  );
  assert.match(response.headers.get("Cache-Control"), /private, no-store/);
  assert.equal(await response.text(), "%PDF-test");
  assert.equal(renders, 1);
});
