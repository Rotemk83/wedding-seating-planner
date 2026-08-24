import Papa from 'papaparse';
import type { GuestGroup } from '../types';

export interface ParseResult {
  guests: GuestGroup[];
  errors: string[];
  totalRows: number;
}

/**
 * Strips UTF-8 BOM if present
 */
export function cleanCsvString(raw: string): string {
  if (raw.charCodeAt(0) === 0xfeff) {
    return raw.slice(1);
  }
  return raw;
}

/**
 * Generates a stable deterministic ID for a guest group
 */
export function generateGuestId(name: string, group: string, index: number): string {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '_');
  const cleanGroup = (group || 'general').trim().toLowerCase().replace(/\s+/g, '_');
  return `guest_${cleanName}_${cleanGroup}_${index}`;
}

/**
 * Robust CSV parser for Wedding RSVP CSVs
 * Handles UTF-8 BOM, Hebrew, quotes, and commas
 */
export function parseGuestCsv(csvContent: string): ParseResult {
  const cleaned = cleanCsvString(csvContent);
  const errors: string[] = [];

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => header.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push(`Row ${err.row}: ${err.message}`);
    }
  }

  const guests: GuestGroup[] = [];

  parsed.data.forEach((row, index) => {
    const name = row['Name'] || row['שם'] || row['שם האורח'] || row['שם מלא'] || '';
    const approvedRaw = row['Approved'] || row['אישרו'] || row['מספר אורחים שאישרו הגעה'] || row['אישור הגעה'] || row['כמות'] || '0';
    const invitedRaw = row['Invited'] || row['הוזמנו'] || row['מספר אורחים מתוכנן'] || '0';
    const group = row['Group'] || row['קבוצה'] || row['שם הקבוצה'] || row['קרבה'] || 'כללי';
    const hasPhoneRaw = row['HasPhone'] || row['טלפון'] || row['מספר טלפון'] || 'Unknown';
    const hasNotesRaw = row['HasNotes'] || row['הערה'] || row['הערות'] || 'No';
    const uiExtra = row['UIExtra'] || '';
    const rawName = row['RawName'] || name;

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const approvedNum = parseInt(approvedRaw.replace(/[^0-9]/g, ''), 10) || 0;
    const invitedNum = parseInt(invitedRaw.replace(/[^0-9]/g, ''), 10) || approvedNum || 1;

    const hasNotes =
      typeof hasNotesRaw === 'boolean'
        ? hasNotesRaw
        : ['yes', 'true', '1', 'כן', 'יש'].includes(hasNotesRaw.toLowerCase().trim());

    const id = generateGuestId(trimmedName, group, index);

    guests.push({
      id,
      name: trimmedName,
      approved: approvedNum,
      invited: invitedNum,
      group: group.trim() || 'כללי',
      hasPhone: hasPhoneRaw.trim(),
      hasNotes,
      uiExtra: uiExtra.trim(),
      rawName: rawName.trim(),
      statusFlag: 'normal',
    });
  });

  return {
    guests,
    errors,
    totalRows: guests.length,
  };
}

/**
 * Creates sample CSV content for demonstration
 */
export function getSampleCsvContent(): string {
  return `Name,Approved,Invited,Group,HasPhone,HasNotes,UIExtra,RawName
"משפחת לוי (יוסי, מיכל וילדים)","4","4","משפחה","0500000001","Yes","","משפחת לוי"
"דניאל ומיכל כהן","2","2","חברים","0500000002","No","","דניאל ומיכל כהן"
"אורלי ודוד אברהמי","2","2","משפחה","0500000003","No","","אורלי ודוד אברהמי"
"צוות עבודה","6","6","עבודה","0500000004","Yes","","צוות עבודה"
"רועי ואגם","2","2","חברים","0500000005","No","","רועי ואגם"
"סבא וסבתא כהן","2","2","משפחה","0500000006","Yes","","סבא וסבתא כהן"
"מתן ונועה","2","2","חברים","0500000007","No","","מתן ונועה"
"איתי שחר","1","1","חברים","0500000008","No","","איתי שחר"
`;
}
