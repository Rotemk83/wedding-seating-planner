import type { EventState } from '../types';

/**
 * Escapes a cell for CSV formatting with quotes
 */
function esc(value: any): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates and downloads a comprehensive Tables Seating List Excel/CSV
 * Formatted with UTF-8 BOM for perfect Hebrew support in Microsoft Excel and Google Sheets.
 */
export function exportTablesToExcelCsv(state: EventState): void {
  const { tables, guests, assignments } = state;

  const guestMap = new Map<string, typeof guests[0]>();
  guests.forEach((g) => guestMap.set(g.id, g));

  const tableGuestsMap = new Map<string, typeof guests>();
  tables.forEach((t) => tableGuestsMap.set(t.id, []));

  assignments.forEach((a) => {
    const guest = guestMap.get(a.guestId);
    if (guest && tableGuestsMap.has(a.tableId)) {
      tableGuestsMap.get(a.tableId)!.push(guest);
    }
  });

  const sortedTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);

  // Section 1: Detailed Table-by-Table Guest Assignment
  const headers = [
    'מספר שולחן',
    'שם השולחן',
    'אזור',
    'קיבולת שולחן',
    'סה"כ יושבים',
    'מקומות פנויים',
    'שם האורח / משפחה',
    'כמות אורחים מאושרת',
    'קבוצה',
    'טלפון',
    'הערות לשולחן',
  ];

  const rows: string[][] = [];

  sortedTables.forEach((table) => {
    const assigned = tableGuestsMap.get(table.id) || [];
    const totalSeated = assigned.reduce((sum, g) => sum + (g.approved || 0), 0);
    const capacity = table.capacity || state.defaultCapacity || 12;
    const freeSeats = Math.max(0, capacity - totalSeated);

    if (assigned.length === 0) {
      rows.push([
        String(table.tableNumber),
        table.name || `שולחן ${table.tableNumber}`,
        table.zone || '',
        String(capacity),
        String(totalSeated),
        String(freeSeats),
        '— ריק —',
        '0',
        '',
        '',
        table.notes || '',
      ]);
    } else {
      assigned.forEach((g) => {
        rows.push([
          String(table.tableNumber),
          table.name || `שולחן ${table.tableNumber}`,
          table.zone || '',
          String(capacity),
          String(totalSeated),
          String(freeSeats),
          g.name,
          String(g.approved),
          g.group || 'כללי',
          g.hasPhone || '',
          table.notes || '',
        ]);
      });
    }
  });

  // Section 2: Summary of All Tables
  rows.push([]);
  rows.push(['--- סיכום שולחנות ---']);
  rows.push(['מספר שולחן', 'שם שולחן', 'קיבולת', 'סה"כ יושבים', 'סטטוס', 'הערות']);

  sortedTables.forEach((table) => {
    const assigned = tableGuestsMap.get(table.id) || [];
    const totalSeated = assigned.reduce((sum, g) => sum + (g.approved || 0), 0);
    const capacity = table.capacity || state.defaultCapacity || 12;
    let statusText = 'רגיל';
    if (totalSeated === 0) statusText = 'ריק';
    else if (totalSeated > capacity) statusText = `חריגה (${totalSeated - capacity}+)`;
    else if (totalSeated === capacity) statusText = 'מלא בדיוק';

    rows.push([
      String(table.tableNumber),
      table.name || `שולחן ${table.tableNumber}`,
      String(capacity),
      String(totalSeated),
      statusText,
      table.notes || '',
    ]);
  });

  const csvContent =
    '\uFEFF' +
    [headers.map(esc).join(','), ...rows.map((row) => row.map(esc).join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `סידור_הושבה_שולחנות_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
