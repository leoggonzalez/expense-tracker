import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PageSizes, rgb, type PDFFont } from "pdf-lib";
import { format } from "date-fns";

import type { SpaceDetailPayload } from "@/actions/spaces";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";

type SpaceMonthReport = Pick<
  SpaceDetailPayload,
  | "space"
  | "selectedMonth"
  | "selectedMonthRelevantTransactions"
  | "memberTotals"
>;

// Embedded, licensed fonts keep exports independent of installed/system fonts.
let fontBytes: Promise<[Buffer, Buffer]> | undefined;

function loadFonts(): Promise<[Buffer, Buffer]> {
  fontBytes ??= Promise.all([
    readFile(
      path.join(process.cwd(), "src/assets/fonts/noto_sans_regular.ttf"),
    ),
    readFile(path.join(process.cwd(), "src/assets/fonts/noto_sans_bold.ttf")),
  ]);
  return fontBytes;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      // Descriptions can contain URLs or other words wider than a column.
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) {
          lines.push(line);
          line = "";
        }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

function shortLine(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string {
  const lines = wrapText(text, font, size, width);
  if (lines.length === 1) return lines[0];
  let line = lines[0];
  while (font.widthOfTextAtSize(`${line}...`, size) > width)
    line = line.slice(0, -1);
  return `${line}...`;
}

function dateLabel(beginDate: string, endDate: string | null): string {
  const begin = format(new Date(beginDate), "MMM dd, yyyy");
  return endDate &&
    new Date(endDate).getTime() !== new Date(beginDate).getTime()
    ? `${begin}\n- ${format(new Date(endDate), "MMM dd, yyyy")}`
    : begin;
}

export async function createSpaceMonthPdf(
  report: SpaceMonthReport,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const bytes = await loadFonts();
  const regular = await document.embedFont(bytes[0], { subset: true });
  const bold = await document.embedFont(bytes[1], { subset: true });
  const title = String(
    i18n.t("spaces_page.month_relevant_transactions_label", {
      month: report.selectedMonth.label,
    }),
  );
  document.setTitle(`${report.space.name} - ${report.selectedMonth.label}`);
  document.setAuthor(String(i18n.t("navigation.brand")));

  const [width, height] = PageSizes.A4;
  const margin = 44;
  const right = width - margin;
  const bottom = 58;
  const lineHeight = 14;
  // Currento's print palette follows its primary, text, and border tokens.
  const primary = rgb(2 / 255, 88 / 255, 100 / 255);
  const ink = rgb(23 / 255, 34 / 255, 59 / 255);
  const secondary = rgb(0.38, 0.42, 0.48);
  const border = rgb(0.84, 0.87, 0.89);
  const surface = rgb(0.94, 0.97, 0.97);
  let page = document.addPage(PageSizes.A4);
  let y = height - margin;

  function drawRight(
    text: string,
    baseline: number,
    font = regular,
    size = 10,
  ): void {
    page.drawText(text, {
      x: right - font.widthOfTextAtSize(text, size),
      y: baseline,
      size,
      font,
      color: ink,
    });
  }

  function rule(baseline: number): void {
    page.drawLine({
      start: { x: margin, y: baseline },
      end: { x: right, y: baseline },
      thickness: 0.5,
      color: border,
    });
  }

  function header(table: boolean): void {
    page.drawText(String(i18n.t("navigation.brand")), {
      x: margin,
      y,
      size: 10,
      font: bold,
      color: primary,
    });
    y -= 30;
    page.drawText(shortLine(report.space.name, bold, 19, right - margin), {
      x: margin,
      y,
      size: 19,
      font: bold,
      color: ink,
    });
    y -= 24;
    for (const line of wrapText(title, regular, 11, right - margin)) {
      page.drawText(line, {
        x: margin,
        y,
        size: 11,
        font: regular,
        color: secondary,
      });
      y -= 15;
    }
    y -= 20;
    if (table) {
      page.drawText(String(i18n.t("transaction_form.description")), {
        x: margin + 8,
        y,
        size: 9,
        font: bold,
        color: secondary,
      });
      page.drawText(String(i18n.t("transaction_form.begin_date")), {
        x: 270,
        y,
        size: 9,
        font: bold,
        color: secondary,
      });
      page.drawText(String(i18n.t("space_members.title")), {
        x: 365,
        y,
        size: 9,
        font: bold,
        color: secondary,
      });
      drawRight(String(i18n.t("transaction_form.amount")), y, bold, 9);
      y -= 10;
      rule(y);
    }
  }

  function nextPage(table: boolean): void {
    page = document.addPage(PageSizes.A4);
    y = height - margin;
    header(table);
  }

  header(true);
  if (!report.selectedMonthRelevantTransactions.length) {
    y -= 25;
    for (const line of wrapText(
      String(i18n.t("transaction_list.empty_state")),
      regular,
      10,
      right - margin,
    )) {
      page.drawText(line, {
        x: margin + 8,
        y,
        size: 10,
        font: regular,
        color: secondary,
      });
      y -= lineHeight;
    }
  }
  for (const transaction of report.selectedMonthRelevantTransactions) {
    const description = wrapText(transaction.description, regular, 10, 200);
    if (transaction.transferSpaceId && transaction.transferSpaceName) {
      description.push(
        ...wrapText(
          String(
            i18n.t(
              transaction.amount < 0
                ? "transaction_list.to_space"
                : "transaction_list.from_space",
              { space: transaction.transferSpaceName },
            ),
          ),
          regular,
          10,
          200,
        ),
      );
    }
    const dates = wrapText(
      dateLabel(transaction.beginDate, transaction.endDate),
      regular,
      8,
      80,
    );
    const participants = wrapText(
      (transaction.participantNames || []).join(", "),
      regular,
      8,
      95,
    );
    const count = Math.max(
      description.length,
      dates.length,
      participants.length,
    );
    let offset = 0;
    while (offset < count) {
      if (y - bottom < lineHeight + 16) nextPage(true);
      const chunk = Math.min(
        count - offset,
        Math.floor((y - bottom - 16) / lineHeight),
      );
      const rowHeight = chunk * lineHeight + 16;
      const baseline = y - 18;
      for (let index = 0; index < chunk; index++) {
        const line = offset + index;
        if (description[line])
          page.drawText(description[line], {
            x: margin + 8,
            y: baseline - index * lineHeight,
            size: 10,
            font: regular,
            color: ink,
          });
        if (participants[line])
          page.drawText(participants[line], {
            x: 365,
            y: baseline - index * lineHeight,
            size: 8,
            font: regular,
            color: secondary,
          });
        if (dates[line])
          page.drawText(dates[line], {
            x: 270,
            y: baseline - index * lineHeight,
            size: 8,
            font: regular,
            color: secondary,
          });
      }
      if (!offset)
        drawRight(formatCurrency(transaction.amount), baseline, bold);
      y -= rowHeight;
      rule(y);
      offset += chunk;
    }
  }

  y -= 20;
  const totals = [
    {
      label: String(
        i18n.t("spaces_page.month_relevant_total_label", {
          month: report.selectedMonth.label,
        }),
      ),
      amount: report.space.selectedMonthTotal,
      emphasis: true,
    },
    ...report.memberTotals.map((member) => ({
      label: member.isOwner
        ? String(i18n.t("transaction_split.you"))
        : member.isRemoved
          ? String(i18n.t("space_members.former", { name: member.name }))
          : member.name,
      amount: member.amount,
      emphasis: false,
    })),
  ];
  for (const total of totals) {
    const font = total.emphasis ? bold : regular;
    const lines = wrapText(total.label, font, 10, 375);
    const rowHeight = lines.length * lineHeight + 16;
    if (y - rowHeight < bottom) nextPage(false);
    if (total.emphasis)
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: right - margin,
        height: rowHeight,
        color: surface,
      });
    lines.forEach((line, index) =>
      page.drawText(line, {
        x: margin + 8,
        y: y - 18 - index * lineHeight,
        size: 10,
        font,
        color: ink,
      }),
    );
    drawRight(formatCurrency(total.amount), y - 18, font);
    y -= rowHeight;
    rule(y);
  }
  const pages = document.getPages();
  pages.forEach((sheet, index) => {
    const text = String(
      i18n.t("spaces_page.pdf_page", {
        number: String(index + 1),
        total: String(pages.length),
      }),
    );
    sheet.drawText(text, {
      x: right - regular.widthOfTextAtSize(text, 8),
      y: 28,
      size: 8,
      font: regular,
      color: secondary,
    });
  });
  return document.save();
}
