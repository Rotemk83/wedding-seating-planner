import { TableConfig, HallElement } from '../types';

/**
 * 34 Tables Hall Layout
 * Organized with Stage at Top, Dance Floor in Center, Bar on Side/Back, Entrance at Bottom
 */
export function getDefaultTables(defaultCapacity = 12): TableConfig[] {
  const tables: TableConfig[] = [];

  // Left Wing (Tables 1 to 10) - 2 columns
  // Column 1
  tables.push({ id: 'table-1', tableNumber: 1, name: 'Table 1', shape: 'round', capacity: defaultCapacity, x: 120, y: 220, width: 110, height: 110, zone: 'Left Front' });
  tables.push({ id: 'table-2', tableNumber: 2, name: 'Table 2', shape: 'round', capacity: defaultCapacity, x: 120, y: 370, width: 110, height: 110, zone: 'Left Front' });
  tables.push({ id: 'table-3', tableNumber: 3, name: 'Table 3', shape: 'round', capacity: defaultCapacity, x: 120, y: 520, width: 110, height: 110, zone: 'Left Mid' });
  tables.push({ id: 'table-4', tableNumber: 4, name: 'Table 4', shape: 'round', capacity: defaultCapacity, x: 120, y: 670, width: 110, height: 110, zone: 'Left Mid' });
  tables.push({ id: 'table-5', tableNumber: 5, name: 'Table 5', shape: 'round', capacity: defaultCapacity, x: 120, y: 820, width: 110, height: 110, zone: 'Left Back' });

  // Column 2
  tables.push({ id: 'table-6', tableNumber: 6, name: 'Table 6', shape: 'round', capacity: defaultCapacity, x: 270, y: 220, width: 110, height: 110, zone: 'Left Inner' });
  tables.push({ id: 'table-7', tableNumber: 7, name: 'Table 7', shape: 'round', capacity: defaultCapacity, x: 270, y: 370, width: 110, height: 110, zone: 'Left Inner' });
  tables.push({ id: 'table-8', tableNumber: 8, name: 'Table 8', shape: 'round', capacity: defaultCapacity, x: 270, y: 520, width: 110, height: 110, zone: 'Left Inner' });
  tables.push({ id: 'table-9', tableNumber: 9, name: 'Table 9', shape: 'round', capacity: defaultCapacity, x: 270, y: 670, width: 110, height: 110, zone: 'Left Inner' });
  tables.push({ id: 'table-10', tableNumber: 10, name: 'Table 10', shape: 'round', capacity: defaultCapacity, x: 270, y: 820, width: 110, height: 110, zone: 'Left Back' });

  // Center Upper / VIP Front Rows (Tables 11 to 14) flanking Stage & Dance Floor
  tables.push({ id: 'table-11', tableNumber: 11, name: 'Table 11 (VIP)', shape: 'rect', capacity: defaultCapacity, x: 430, y: 220, width: 130, height: 90, zone: 'Center Front (VIP)' });
  tables.push({ id: 'table-12', tableNumber: 12, name: 'Table 12 (VIP)', shape: 'rect', capacity: defaultCapacity, x: 590, y: 220, width: 130, height: 90, zone: 'Center Front (VIP)' });
  tables.push({ id: 'table-13', tableNumber: 13, name: 'Table 13 (VIP)', shape: 'rect', capacity: defaultCapacity, x: 750, y: 220, width: 130, height: 90, zone: 'Center Front (VIP)' });
  tables.push({ id: 'table-14', tableNumber: 14, name: 'Table 14 (VIP)', shape: 'rect', capacity: defaultCapacity, x: 910, y: 220, width: 130, height: 90, zone: 'Center Front (VIP)' });

  // Center Lower Behind Dance Floor (Tables 15 to 18)
  tables.push({ id: 'table-15', tableNumber: 15, name: 'Table 15', shape: 'round', capacity: defaultCapacity, x: 440, y: 690, width: 110, height: 110, zone: 'Center Mid' });
  tables.push({ id: 'table-16', tableNumber: 16, name: 'Table 16', shape: 'round', capacity: defaultCapacity, x: 590, y: 690, width: 110, height: 110, zone: 'Center Mid' });
  tables.push({ id: 'table-17', tableNumber: 17, name: 'Table 17', shape: 'round', capacity: defaultCapacity, x: 740, y: 690, width: 110, height: 110, zone: 'Center Mid' });
  tables.push({ id: 'table-18', tableNumber: 18, name: 'Table 18', shape: 'round', capacity: defaultCapacity, x: 890, y: 690, width: 110, height: 110, zone: 'Center Mid' });

  // Center Far Back (Tables 19 to 22)
  tables.push({ id: 'table-19', tableNumber: 19, name: 'Table 19', shape: 'round', capacity: defaultCapacity, x: 440, y: 830, width: 110, height: 110, zone: 'Center Back' });
  tables.push({ id: 'table-20', tableNumber: 20, name: 'Table 20', shape: 'round', capacity: defaultCapacity, x: 590, y: 830, width: 110, height: 110, zone: 'Center Back' });
  tables.push({ id: 'table-21', tableNumber: 21, name: 'Table 21', shape: 'round', capacity: defaultCapacity, x: 740, y: 830, width: 110, height: 110, zone: 'Center Back' });
  tables.push({ id: 'table-22', tableNumber: 22, name: 'Table 22', shape: 'round', capacity: defaultCapacity, x: 890, y: 830, width: 110, height: 110, zone: 'Center Back' });

  // Right Wing (Tables 23 to 32) - 2 columns
  // Column 1 (Inner Right)
  tables.push({ id: 'table-23', tableNumber: 23, name: 'Table 23', shape: 'round', capacity: defaultCapacity, x: 1070, y: 220, width: 110, height: 110, zone: 'Right Inner' });
  tables.push({ id: 'table-24', tableNumber: 24, name: 'Table 24', shape: 'round', capacity: defaultCapacity, x: 1070, y: 370, width: 110, height: 110, zone: 'Right Inner' });
  tables.push({ id: 'table-25', tableNumber: 25, name: 'Table 25', shape: 'round', capacity: defaultCapacity, x: 1070, y: 520, width: 110, height: 110, zone: 'Right Inner' });
  tables.push({ id: 'table-26', tableNumber: 26, name: 'Table 26', shape: 'round', capacity: defaultCapacity, x: 1070, y: 670, width: 110, height: 110, zone: 'Right Inner' });
  tables.push({ id: 'table-27', tableNumber: 27, name: 'Table 27', shape: 'round', capacity: defaultCapacity, x: 1070, y: 820, width: 110, height: 110, zone: 'Right Back' });

  // Column 2 (Outer Right)
  tables.push({ id: 'table-28', tableNumber: 28, name: 'Table 28', shape: 'round', capacity: defaultCapacity, x: 1220, y: 220, width: 110, height: 110, zone: 'Right Front' });
  tables.push({ id: 'table-29', tableNumber: 29, name: 'Table 29', shape: 'round', capacity: defaultCapacity, x: 1220, y: 370, width: 110, height: 110, zone: 'Right Front' });
  tables.push({ id: 'table-30', tableNumber: 30, name: 'Table 30', shape: 'round', capacity: defaultCapacity, x: 1220, y: 520, width: 110, height: 110, zone: 'Right Mid' });
  tables.push({ id: 'table-31', tableNumber: 31, name: 'Table 31', shape: 'round', capacity: defaultCapacity, x: 1220, y: 670, width: 110, height: 110, zone: 'Right Mid' });
  tables.push({ id: 'table-32', tableNumber: 32, name: 'Table 32', shape: 'round', capacity: defaultCapacity, x: 1220, y: 820, width: 110, height: 110, zone: 'Right Back' });

  // Rear Extended Wing (Tables 33 to 34)
  tables.push({ id: 'table-33', tableNumber: 33, name: 'Table 33', shape: 'round', capacity: defaultCapacity, x: 510, y: 970, width: 110, height: 110, zone: 'Lounge Area' });
  tables.push({ id: 'table-34', tableNumber: 34, name: 'Table 34', shape: 'round', capacity: defaultCapacity, x: 820, y: 970, width: 110, height: 110, zone: 'Lounge Area' });

  return tables;
}

/**
 * Stage, Dance Floor, Bar, DJ booth, Entrance elements
 */
export function getDefaultHallElements(): HallElement[] {
  return [
    {
      id: 'element-stage',
      type: 'stage',
      name: 'CHUPPAH & MAIN STAGE (במה ראשית / חופה)',
      x: 480,
      y: 40,
      width: 500,
      height: 120,
    },
    {
      id: 'element-dance-floor',
      type: 'dance_floor',
      name: 'DANCE FLOOR (רחבת ריקודים)',
      x: 450,
      y: 350,
      width: 550,
      height: 290,
    },
    {
      id: 'element-dj',
      type: 'dj',
      name: 'DJ BOOTH (עמדת דיג\'יי)',
      x: 650,
      y: 190,
      width: 160,
      height: 50,
    },
    {
      id: 'element-bar-1',
      type: 'bar',
      name: 'PREMIUM COCKTAIL BAR (בר מרכזי)',
      x: 80,
      y: 980,
      width: 280,
      height: 90,
    },
    {
      id: 'element-bar-2',
      type: 'bar',
      name: 'WINE & COFFEE BAR (עמדת קפה ובר)',
      x: 1080,
      y: 980,
      width: 280,
      height: 90,
    },
    {
      id: 'element-entrance',
      type: 'entrance',
      name: 'MAIN ENTRANCE & RECEPTION (כניסה ראשית וקבלת פנים)',
      x: 550,
      y: 1130,
      width: 360,
      height: 70,
    },
  ];
}
