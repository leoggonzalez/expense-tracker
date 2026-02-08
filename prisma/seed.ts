import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse CSV-style euro amounts (e.g., "3.944,73 €" or "-1.291,77 €")
function parseEuroAmount(amountStr: string): number {
  // Remove euro symbol and spaces
  let cleaned = amountStr.replace('€', '').trim();
  
  // Remove thousands separator (.) and replace decimal comma with period
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  
  return parseFloat(cleaned);
}

// Parse date string in DD/MM/YYYY format
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const [day, month, year] = dateStr.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

async function main() {
  console.log('Starting seed...');

  // Sample data from your CSV
  const entries = [
    { type: 'income', group: 'income', description: 'salary', amount: '3.944,73 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Franz-Jacob', description: 'rent', amount: '-1.291,77 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Franz-Jacob', description: 'Vodafone Internet', amount: '-53,98 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Franz-Jacob', description: 'Octopus Electricidad', amount: '-71,29 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Franz-Jacob', description: 'Radio TV tax', amount: '-55,08 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Franz-Jacob', description: 'Kaution', amount: '-927,77 €', beginDate: '01/02/2026', endDate: '01/02/2026' },
    { type: 'income', group: 'Apartment Franz-Jacob', description: 'Karen Rent', amount: '285,00 €', beginDate: '01/02/2026', endDate: '01/02/2026' },
    { type: 'expense', group: 'Apartment Franz-Jacob', description: 'Karen Caution', amount: '-600,00 €', beginDate: '01/02/2026', endDate: '01/02/2026' },
    { type: 'income', group: 'Apartment Franz-Jacob', description: 'Matias Rent', amount: '600,00 €', beginDate: '01/02/2026', endDate: '01/02/2026' },
    { type: 'expense', group: 'Apartment Klara-Franke', description: 'Rent', amount: '-1.054,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Klara-Franke', description: 'DNS:NET', amount: '-44,70 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Klara-Franke', description: 'E WIE EINFACH', amount: '-51,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Apartment Klara-Franke', description: 'Radio TV Tax', amount: '-18,36 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'income', group: 'Apartment Klara-Franke', description: 'Rodrigo', amount: '1.168,06 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Various', description: 'Rent Sophia', amount: '-374,47 €', beginDate: '01/02/2026', endDate: '01/05/2026' },
    { type: 'expense', group: 'Various', description: 'CARE', amount: '-12,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Various', description: 'iCloud', amount: '-2,99 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Various', description: 'FitX', amount: '-24,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Various', description: 'Aldi talk', amount: '-9,99 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Various', description: 'Insurance', amount: '-38,65 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Amazon Credit Card', description: 'TV', amount: '-71,80 €', beginDate: '01/02/2026', endDate: '01/04/2026' },
    { type: 'expense', group: 'Amazon Credit Card', description: 'Apple watch sofi', amount: '-89,90 €', beginDate: '01/02/2026', endDate: '01/05/2026' },
    { type: 'expense', group: 'Estimated', description: 'Living expenses', amount: '-600,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Investment', description: 'Retirement', amount: '-160,42 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Investment', description: 'S&P500', amount: '-300,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'expense', group: 'Investment', description: 'Aggresive Funds', amount: '-200,00 €', beginDate: '01/02/2026', endDate: '' },
    { type: 'income', group: 'Investment', description: 'Other investments', amount: '1.600,00 €', beginDate: '01/02/2026', endDate: '01/02/2026' },
  ];

  // Clear existing data
  await prisma.entry.deleteMany();
  await prisma.group.deleteMany();
  console.log('Cleared existing entries and groups');

  // Get unique group names
  const groupNames = [...new Set(entries.map(e => e.group))];
  
  // Create groups
  const groupMap = new Map<string, string>();
  for (const groupName of groupNames) {
    const group = await prisma.group.create({
      data: { name: groupName },
    });
    groupMap.set(groupName, group.id);
  }
  console.log(`Created ${groupNames.length} groups`);

  // Insert entries
  let createdCount = 0;
  for (const entry of entries) {
    const beginDate = parseDate(entry.beginDate);
    const endDate = parseDate(entry.endDate);
    
    if (!beginDate) continue; // Skip entries without a begin date

    const groupId = groupMap.get(entry.group);
    if (!groupId) continue; // Skip if group not found

    await prisma.entry.create({
      data: {
        type: entry.type as 'income' | 'expense',
        groupId: groupId,
        description: entry.description,
        amount: parseEuroAmount(entry.amount),
        beginDate: beginDate,
        endDate: endDate,
      },
    });
    createdCount++;
  }

  console.log(`Seeded ${createdCount} entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
