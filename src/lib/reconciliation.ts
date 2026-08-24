import { GuestGroup, SeatingAssignment, TableConfig, ReconcileSummary } from '../types';

export interface ReconcileResult {
  updatedGuests: GuestGroup[];
  updatedAssignments: SeatingAssignment[];
  summary: ReconcileSummary;
}

/**
 * Reconciles current guest state and assignments with a newly imported CSV.
 * Preserves existing seating, updates attendance counts, flags missing/cancelled attendees.
 */
export function reconcileGuestsWithCsv(
  existingGuests: GuestGroup[],
  existingAssignments: SeatingAssignment[],
  tables: TableConfig[],
  newCsvGuests: GuestGroup[]
): ReconcileResult {
  const existingMapByName = new Map<string, GuestGroup>();
  const existingMapById = new Map<string, GuestGroup>();
  const assignmentsByGuestId = new Map<string, string>();

  existingAssignments.forEach((a) => {
    assignmentsByGuestId.set(a.guestId, a.tableId);
  });

  existingGuests.forEach((g) => {
    existingMapById.set(g.id, g);
    existingMapByName.set(g.name.trim().toLowerCase(), g);
  });

  const updatedGuests: GuestGroup[] = [];
  const updatedAssignments: SeatingAssignment[] = [...existingAssignments];
  const processedExistingIds = new Set<string>();

  const newGuestsList: GuestGroup[] = [];
  const changedAttendanceList: { guest: GuestGroup; oldVal: number; newVal: number }[] = [];
  const notAttendingAssignedList: { guest: GuestGroup; tableNumber: number }[] = [];
  let unchangedCount = 0;

  // Process incoming CSV rows
  newCsvGuests.forEach((newGuest) => {
    const key = newGuest.name.trim().toLowerCase();
    const existing = existingMapByName.get(key) || existingMapById.get(newGuest.id);

    if (existing) {
      processedExistingIds.add(existing.id);

      // Check if attendance count changed
      const countChanged = existing.approved !== newGuest.approved;
      const isAssigned = assignmentsByGuestId.has(existing.id);
      const isNotAttending = newGuest.approved === 0;

      const mergedGuest: GuestGroup = {
        ...existing,
        ...newGuest,
        id: existing.id, // Preserve original stable ID
        previousApproved: countChanged ? existing.approved : existing.previousApproved,
        statusFlag: isNotAttending && isAssigned
          ? 'not_attending'
          : countChanged
          ? 'updated_count'
          : 'normal',
      };

      updatedGuests.push(mergedGuest);

      if (countChanged) {
        changedAttendanceList.push({
          guest: mergedGuest,
          oldVal: existing.approved,
          newVal: newGuest.approved,
        });
      } else {
        unchangedCount++;
      }

      if (isNotAttending && isAssigned) {
        const tableId = assignmentsByGuestId.get(existing.id);
        const table = tables.find((t) => t.id === tableId);
        notAttendingAssignedList.push({
          guest: mergedGuest,
          tableNumber: table?.tableNumber || 0,
        });
      }
    } else {
      // Completely new guest
      const newArrival: GuestGroup = {
        ...newGuest,
        statusFlag: 'new_arrival',
      };
      updatedGuests.push(newArrival);
      newGuestsList.push(newArrival);
    }
  });

  // Check existing guests missing from the new CSV
  existingGuests.forEach((existing) => {
    if (!processedExistingIds.has(existing.id)) {
      const isAssigned = assignmentsByGuestId.has(existing.id);
      const flaggedGuest: GuestGroup = {
        ...existing,
        statusFlag: isAssigned ? 'not_attending' : 'normal',
        previousApproved: existing.approved,
      };
      updatedGuests.push(flaggedGuest);

      if (isAssigned) {
        const tableId = assignmentsByGuestId.get(existing.id);
        const table = tables.find((t) => t.id === tableId);
        notAttendingAssignedList.push({
          guest: flaggedGuest,
          tableNumber: table?.tableNumber || 0,
        });
      }
    }
  });

  const summary: ReconcileSummary = {
    newInvitationsCount: newGuestsList.length,
    attendanceChangedCount: changedAttendanceList.length,
    notAttendingAssignedCount: notAttendingAssignedList.length,
    unchangedCount,
    details: {
      newGuests: newGuestsList,
      changedAttendance: changedAttendanceList,
      notAttendingAssigned: notAttendingAssignedList,
    },
  };

  return {
    updatedGuests,
    updatedAssignments,
    summary,
  };
}
