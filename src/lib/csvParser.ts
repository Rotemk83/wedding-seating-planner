import Papa from 'papaparse';
import { GuestGroup } from '../types';

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
    // Find fields regardless of slight case/header naming variations
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
      return; // Skip empty row
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
 * Creates a sample CSV content for demonstration / test testing
 */
export function getSampleCsvContent(): string {
  return `Name,Approved,Invited,Group,HasPhone,HasNotes,UIExtra,RawName
"אורלי ורמי גואטה","2","2","חברים הורים","Yes","No","","אורלי ורמי גואטה"
"דניאל ואלינור קופמן","2","2","חברים חתן","0542223970","Yes","","דניאל ואלינור קופמן"
"אבי ומורין","2","2","משפחה חתן","0522643721","No","","אבי ומורין"
"אח של ברק","1","1","עבודה כלה","No","No","","אח של ברק"
"משפחת לוי (יוסי, מיכל וילדים)","4","4","משפחה כלה","0505340766","Yes","","משפחת לוי"
"רועי ואגם כהן","2","2","חברים חתן","Yes","No","","רועי ואגם כהן"
"סבתא שרה והמטפלת","2","2","משפחה חתן","0509509506","Yes","","סבתא שרה"
"מתן, דור ועידן","3","3","חברי ילדות","0508280200","No","","מתן, דור ועידן"
"צוות פיתוח ומחקר","6","6","עבודה חתן","Yes","Yes","","צוות פיתוח"
"טליה ובן זוג","2","2","חברים כלה","0523981340","No","","טליה ובן זוג"
"שמואל כהן","1","1","חברים הורים","No","No","","שמואל כהן"
"ליאור ורוני מזרחי","2","2","משפחה כלה","Yes","No","","ליאור ורוני מזרחי"
"משפחת אברהמי","5","5","משפחה חתן","Yes","No","","משפחת אברהמי"
"יובל ונועה שפירא","2","2","חברים כלה","Yes","No","","יובל ונועה שפירא"
"עו\"ד ברק ישראלי","1","1","עבודה כלה","Yes","Yes","","ברק ישראלי"
"חבורת כדורגל","7","8","חברים חתן","Yes","No","","חבורת כדורגל"
"רחל ויעקב פרידמן","2","2","חברים הורים","Yes","No","","רחל ויעקב פרידמן"
"דוד ורעייתו","2","2","שכנים","No","No","","דוד ורעייתו"
"ד\"ר עמית לוין","1","1","עבודה חתן","Yes","No","","ד\"ר עמית לוין"
"מאיה, תומר וליהי","3","3","חברים כלה","Yes","No","","מאיה, תומר וליהי"
"אילן וגלית גבאי","2","2","חברים הורים","Yes","No","","אילן וגלית גבאי"
"שירז ודורון כרמל","2","2","חברים חתן","Yes","No","","שירז ודורון כרמל"
"משפחת אוחיון","4","4","משפחה כלה","Yes","No","","משפחת אוחיון"
"אלכס וסבטלנה","2","2","עבודה חתן","Yes","No","","אלכס וסבטלנה"
"ניב ואורן שחר","2","2","חברים כלה","No","Yes","","ניב ואורן שחר"
`;
}
