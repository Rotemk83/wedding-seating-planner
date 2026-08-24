export interface GuestGroup {
  id: string;
  name: string;
  approved: number;
  invited: number;
  group: string;
  hasPhone: string; // 'Yes', 'No', or phone string / 'Unknown'
  hasNotes: boolean;
  uiExtra?: string;
  rawName?: string;
  statusFlag?: 'normal' | 'updated_count' | 'not_attending' | 'new_arrival';
  previousApproved?: number;
}

export interface SeatingAssignment {
  guestId: string;
  tableId: string;
}

export type TableShape = 'round' | 'rect';

export interface TableConfig {
  id: string;
  tableNumber: number;
  name: string;
  shape: TableShape;
  capacity: number; // default e.g. 12
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
  zone?: string;
}

export interface HallElement {
  id: string;
  type: 'stage' | 'dance_floor' | 'bar' | 'entrance' | 'dj' | 'buffet';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface EventState {
  version: string;
  lastModified: string;
  eventName: string;
  defaultCapacity: number;
  guests: GuestGroup[];
  assignments: SeatingAssignment[];
  tables: TableConfig[];
  hallElements: HallElement[];
  notes?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
  };
}

export interface ReconcileSummary {
  newInvitationsCount: number;
  attendanceChangedCount: number;
  notAttendingAssignedCount: number;
  unchangedCount: number;
  details: {
    newGuests: GuestGroup[];
    changedAttendance: { guest: GuestGroup; oldVal: number; newVal: number }[];
    notAttendingAssigned: { guest: GuestGroup; tableNumber: number }[];
  };
}

export type OccupancyStatus = 'empty' | 'normal' | 'moderate' | 'full' | 'overcapacity';

export interface TableOccupancy {
  tableId: string;
  tableNumber: number;
  capacity: number;
  assignedCount: number;
  percentage: number;
  status: OccupancyStatus;
  guestGroups: GuestGroup[];
}

export interface StatsSummary {
  totalAttending: number;
  assignedAttending: number;
  unassignedAttending: number;
  totalGuestsCount: number; // rows
  tablesUsed: number;
  totalTables: number;
  averagePerTable: number;
  largestTable: { tableNumber: number; count: number };
}
