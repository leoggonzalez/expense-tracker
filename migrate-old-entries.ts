import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Your existing entries data
const oldEntries = [
  { id: 'cmlco1g9v00010659ou4c2tin', type: 'income', group: 'Income', description: 'Salary', amount: 3944.73, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco3k1c00030659q785r6ul', type: 'expense', group: 'Franz-Jacobs', description: 'Rent', amount: 1291.77, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco40gj00040659e256wkus', type: 'expense', group: 'Franz-Jacobs', description: 'Vodafone Internet', amount: 53.98, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco4mor00050659q8t9sgnh', type: 'expense', group: 'Franz-Jacobs', description: 'Octopus Electricity', amount: 71.29, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco5a6r00060659zp1pzhnj', type: 'expense', group: 'Expenses', description: 'CARE', amount: 12, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco5idq00070659o1ky7q62', type: 'expense', group: 'Expenses', description: 'iCloud', amount: 2.99, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco5rmx00080659z8mdf66h', type: 'expense', group: 'Expenses', description: 'FitX', amount: 24, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco60qk000906592yooa29i', type: 'expense', group: 'Expenses', description: 'AldiTalk', amount: 9.99, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco6c6h000a0659c4qyvycr', type: 'expense', group: 'Expenses', description: 'Insurance', amount: 38.65, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco7az7000b0659363fggne', type: 'expense', group: 'Groceries', description: 'Estimated groceries', amount: 600, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco7tq1000c0659shygs2ph', type: 'expense', group: 'Investment', description: 'S&P500', amount: 300, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlco87n5000d0659ojzlfhuq', type: 'expense', group: 'Investment', description: 'Aggresive Funds', amount: 200, beginDate: '2026-02-01 00:00:00', endDate: null },
  { id: 'cmlcocnp3000e0659608ry3ln', type: 'expense', group: 'Expenses', description: 'Rent Sophia', amount: 374.47, beginDate: '2026-02-01 00:00:00', endDate: '2026-04-30 00:00:00' },
  { id: 'cmlcoduq4000f065947ukpgpd', type: 'income', group: 'Income', description: 'Argentina Trip', amount: 800, beginDate: '2026-02-01 00:00:00', endDate: '2026-02-07 00:00:00' },
  { id: 'cmlcoelx7000g0659oizc1012', type: 'expense', group: 'Franz-Jacobs', description: 'Kaution 3/3', amount: 927.77, beginDate: '2026-02-07 18:56:37.058', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcof3dw000h06592citvdel', type: 'expense', group: 'Franz-Jacobs', description: 'Kaution Giu', amount: 600, beginDate: '2026-02-07 18:57:11.347', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcofv92000j0659d1nnzoic', type: 'income', group: 'Franz-Jacobs', description: 'Room Matias', amount: 600, beginDate: '2026-02-07 18:57:49.975', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcoghga000k0659vxbfb9xp', type: 'income', group: 'Franz-Jacobs', description: 'Room Karen', amount: 285, beginDate: '2026-02-07 18:58:04.427', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcogq86000l06599qlbarf5', type: 'expense', group: 'Franz-Jacobs', description: 'Kaution Karen', amount: 600, beginDate: '2026-02-07 18:58:33.206', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcohli9000m0659hch1by3m', type: 'expense', group: 'Franz-Jacobs', description: 'TV & Radio Tax 2025', amount: 55.08, beginDate: '2026-02-07 18:59:06.727', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcoinyo000n0659hz1sh3aa', type: 'expense', group: 'Amazon Credit Card', description: 'Netflix', amount: 5.99, beginDate: '2026-02-07 18:59:44.301', endDate: null },
  { id: 'cmlcojenb000o0659yz80f75y', type: 'expense', group: 'Amazon Credit Card', description: 'TV', amount: 71.8, beginDate: '2026-02-07 19:00:26.145', endDate: '2026-03-07 00:00:00' },
  { id: 'cmlcojvu2000p0659ils0kpn1', type: 'expense', group: 'Amazon Credit Card', description: 'Apple Watch - Sophia', amount: 89.9, beginDate: '2026-02-07 19:00:52.182', endDate: '2026-04-07 00:00:00' },
  { id: 'cmlcok8rd000q0659943j8p86', type: 'expense', group: 'Amazon Credit Card', description: 'Chile - Lisboa flight', amount: 566.67, beginDate: '2026-02-07 19:01:11.815', endDate: '2026-04-07 00:00:00' },
  { id: 'cmlcokscx000r065937spv5go', type: 'expense', group: 'Amazon Credit Card', description: 'February payment', amount: 1091.01, beginDate: '2026-02-07 19:01:28.561', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcolpw1000s0659tgpvwjyr', type: 'expense', group: 'Investment', description: 'Retirement', amount: 160.42, beginDate: '2026-02-07 19:02:14.605', endDate: null },
  { id: 'cmlcon1dy000t0659pena2cll', type: 'income', group: 'Investment', description: 'Withdraw investment account', amount: 1000, beginDate: '2026-02-07 19:02:37.422', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcoogut000v0659poqgusir', type: 'income', group: 'Investment', description: 'Withdraw savings account', amount: 600, beginDate: '2026-02-07 19:04:26.798', endDate: '2026-02-08 00:00:00' },
  { id: 'cmlcopk44000w06593yqzwnnl', type: 'expense', group: 'Franz-Jacobs', description: 'Kaution Cristina', amount: 500, beginDate: '2026-03-07 00:00:00', endDate: '2026-03-07 00:00:00' },
  { id: 'cmlcoxw7z00110659ou4ot26k', type: 'income', group: 'Franz-Jacobs', description: 'Small room rent', amount: 500, beginDate: '2026-03-07 00:00:00', endDate: '2026-03-31 00:00:00' },
  { id: 'cmlcoycbp00120659i8y6myr3', type: 'income', group: 'Franz-Jacobs', description: 'Middle room rent', amount: 550, beginDate: '2026-03-07 00:00:00', endDate: '2026-03-07 00:00:00' },
  { id: 'cmlcozhgx00130659z3958qb3', type: 'expense', group: 'Expenses', description: 'Youtube Premium', amount: 129.99, beginDate: '2026-07-07 00:00:00', endDate: '2026-07-07 00:00:00' },
  { id: 'cmlcozy8x00140659qyu0fkbz', type: 'expense', group: 'Expenses', description: 'Amazon', amount: 89.9, beginDate: '2026-10-07 00:00:00', endDate: '2026-10-07 00:00:00' },
  { id: 'cmlcp1hsl00150659laxetet4', type: 'income', group: 'Franz-Jacobs', description: 'Half rent - Sophia', amount: 708.52, beginDate: '2026-05-01 00:00:00', endDate: null },
  { id: 'cmlcp2p6c00160659ao9rksw5', type: 'expense', group: 'Investment', description: 'Various', amount: 1600, beginDate: '2026-05-01 00:00:00', endDate: null },
];

async function main() {
  console.log('Starting migration of existing entries to new schema...');

  // Step 1: Get all unique group names
  const uniqueGroups = [...new Set(oldEntries.map(entry => entry.group))];
  console.log(`Found ${uniqueGroups.length} unique groups:`, uniqueGroups);

  // Step 2: Create groups and build a mapping
  const groupMap = new Map<string, string>();
  
  for (const groupName of uniqueGroups) {
    // Check if group already exists
    let group = await prisma.group.findUnique({
      where: { name: groupName },
    });

    // If not, create it
    if (!group) {
      group = await prisma.group.create({
        data: { name: groupName },
      });
      console.log(`Created group: ${groupName}`);
    } else {
      console.log(`Group already exists: ${groupName}`);
    }

    groupMap.set(groupName, group.id);
  }

  console.log('\nMigrating entries...');

  // Step 3: Create entries with the new schema
  let created = 0;
  let skipped = 0;

  for (const entry of oldEntries) {
    const groupId = groupMap.get(entry.group);
    
    if (!groupId) {
      console.log(`⚠️  Skipping entry ${entry.id}: Group not found`);
      skipped++;
      continue;
    }

    try {
      // Check if entry already exists
      const existing = await prisma.entry.findUnique({
        where: { id: entry.id },
      });

      if (existing) {
        console.log(`⚠️  Entry already exists: ${entry.description} (${entry.id})`);
        skipped++;
        continue;
      }

      // Create the entry
      await prisma.entry.create({
        data: {
          id: entry.id,
          type: entry.type as 'income' | 'expense',
          groupId: groupId,
          description: entry.description,
          amount: entry.amount,
          beginDate: new Date(entry.beginDate),
          endDate: entry.endDate ? new Date(entry.endDate) : null,
        },
      });

      console.log(`✓ Created: ${entry.description} (${entry.group})`);
      created++;
    } catch (error) {
      console.error(`✗ Error creating entry ${entry.id}:`, error);
      skipped++;
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Groups created: ${uniqueGroups.length}`);
  console.log(`Entries created: ${created}`);
  console.log(`Entries skipped: ${skipped}`);
  console.log(`Total entries processed: ${oldEntries.length}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
