import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Users, CheckCircle2, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import type { GuestGroup, SeatingAssignment, TableConfig } from '../types';
import { GuestCard } from './GuestCard';

interface SidebarProps {
  guests: GuestGroup[];
  assignments: SeatingAssignment[];
  tables: TableConfig[];
  onLocateTable: (tableNumber: number) => void;
  onUnassignGuest: (guestId: string) => void;
  onDismissFlag?: (guestId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

type TabType = 'unassigned' | 'assigned' | 'all';
type SortOption = 'name-asc' | 'name-desc' | 'attendance-desc' | 'attendance-asc' | 'group';
type SizeFilter = 'all' | '1' | '2' | '3+';

export const Sidebar: React.FC<SidebarProps> = ({
  guests,
  assignments,
  tables,
  onLocateTable,
  onUnassignGuest,
  onDismissFlag,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');

  // Map guestId -> tableNumber
  const assignmentMap = useMemo(() => {
    const map = new Map<string, number>();
    const tableById = new Map<string, TableConfig>();
    tables.forEach((t) => tableById.set(t.id, t));

    assignments.forEach((a) => {
      const table = tableById.get(a.tableId);
      if (table) {
        map.set(a.guestId, table.tableNumber);
      }
    });
    return map;
  }, [assignments, tables]);

  // Extract unique groups
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    guests.forEach((g) => {
      if (g.group) groups.add(g.group.trim());
    });
    return Array.from(groups).sort((a, b) => a.localeCompare(b, 'he'));
  }, [guests]);

  // Count unassigned and assigned
  const counts = useMemo(() => {
    let unassigned = 0;
    let assigned = 0;
    guests.forEach((g) => {
      if (assignmentMap.has(g.id)) {
        assigned++;
      } else {
        unassigned++;
      }
    });
    return {
      unassigned,
      assigned,
      all: guests.length,
    };
  }, [guests, assignmentMap]);

  // Filter and Sort guests
  const displayedGuests = useMemo(() => {
    return guests
      .filter((guest) => {
        const isAssigned = assignmentMap.has(guest.id);

        // Tab filter
        if (activeTab === 'unassigned' && isAssigned) return false;
        if (activeTab === 'assigned' && !isAssigned) return false;

        // Search query (name or group)
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const nameMatch = guest.name.toLowerCase().includes(query);
          const groupMatch = (guest.group || '').toLowerCase().includes(query);
          if (!nameMatch && !groupMatch) return false;
        }

        // Group filter
        if (selectedGroup !== 'all' && guest.group !== selectedGroup) {
          return false;
        }

        // Size filter
        if (sizeFilter === '1' && guest.approved !== 1) return false;
        if (sizeFilter === '2' && guest.approved !== 2) return false;
        if (sizeFilter === '3+' && guest.approved < 3) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name, 'he');
          case 'name-desc':
            return b.name.localeCompare(a.name, 'he');
          case 'attendance-desc':
            return (b.approved || 0) - (a.approved || 0);
          case 'attendance-asc':
            return (a.approved || 0) - (b.approved || 0);
          case 'group':
            return (a.group || '').localeCompare(b.group || '', 'he');
          default:
            return 0;
        }
      });
  }, [guests, activeTab, assignmentMap, searchQuery, selectedGroup, sizeFilter, sortOption]);

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 z-20 h-full ${
        isOpen ? 'w-80 sm:w-96' : 'w-0 border-r-0'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleOpen}
        className="absolute -right-3.5 top-6 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 shadow-md hover:text-slate-900 dark:hover:text-white transition-colors"
        title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header & Tabs */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Guest Roster</span>
              </h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {displayedGuests.length} shown
              </span>
            </div>

            {/* Segmented Tabs */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('unassigned')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'unassigned'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Unassigned</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-600">
                  {counts.unassigned}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('assigned')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'assigned'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Assigned</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-600">
                  {counts.assigned}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-600">
                  {counts.all}
                </span>
              </button>
            </div>

            {/* Instant Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or group (חיפוש)..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters and Sorting Row */}
            <div className="flex items-center gap-2 pt-1">
              {/* Group Filter */}
              <div className="relative flex-1">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full pl-2 pr-6 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none truncate"
                >
                  <option value="all">All Groups (כל הקבוצות)</option>
                  {availableGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Size Filter */}
              <div className="relative">
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
                  className="pl-2 pr-6 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="all">Any Size</option>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3+">3+ Guests</option>
                </select>
                <Users className="absolute right-2 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="pl-2 pr-6 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="attendance-desc">Guests High-Low</option>
                  <option value="attendance-asc">Guests Low-High</option>
                  <option value="group">Group</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Guest List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {displayedGuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400">
                {activeTab === 'unassigned' && counts.unassigned === 0 && counts.all > 0 ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      All Guests Are Seated!
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Every confirmed guest has been assigned to a table.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-slate-400 mb-2 opacity-60" />
                    <p className="text-xs font-medium">No matching guests found</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Try clearing your search or adjusting filters.
                    </p>
                  </>
                )}
              </div>
            ) : (
              displayedGuests.map((guest) => (
                <GuestCard
                  key={guest.id}
                  guest={guest}
                  assignedTableNumber={assignmentMap.get(guest.id)}
                  onLocateTable={onLocateTable}
                  onUnassign={onUnassignGuest}
                  onDismissFlag={onDismissFlag}
                />
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
