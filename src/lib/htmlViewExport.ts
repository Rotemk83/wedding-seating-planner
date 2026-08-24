import type { EventState } from '../types';

/**
 * Generates an all-in-one standalone HTML file containing the interactive floor plan,
 * table clicking popup, and Hebrew guest search bar for public sharing.
 */
export function exportStandaloneHtmlView(state: EventState): void {
  const { eventName, tables, guests, assignments, hallElements, defaultCapacity } = state;

  const guestMap: Record<string, any> = {};
  guests.forEach((g) => {
    guestMap[g.id] = g;
  });

  const tableGuests: Record<string, any[]> = {};
  tables.forEach((t) => {
    tableGuests[t.id] = [];
  });

  assignments.forEach((a) => {
    const g = guestMap[a.guestId];
    if (g && tableGuests[a.tableId]) {
      tableGuests[a.tableId].push(g);
    }
  });

  const statePayload = JSON.stringify({
    eventName: eventName || 'סידור הושבה לחתונה',
    tables,
    hallElements,
    tableGuests,
    defaultCapacity: defaultCapacity || 12,
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${eventName || 'מתכנן הושבה לחתונה'} - מפת הושבה אינטראקטיבית</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
      user-select: none;
    }
    header {
      height: 60px;
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 10;
      position: relative;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: #4f46e5;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .search-box {
      flex: 1;
      max-width: 320px;
      margin: 0 12px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      padding: 8px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(30, 41, 59, 0.8);
      color: #fff;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }
    .search-box input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99,102,241,0.25);
    }
    #canvas-container {
      position: relative;
      width: 100vw;
      height: calc(100vh - 60px);
      overflow: hidden;
      cursor: grab;
      background: radial-gradient(circle, #1e293b 1px, transparent 1px);
      background-size: 28px 28px;
    }
    #canvas-container:active {
      cursor: grabbing;
    }
    #venue-plane {
      position: absolute;
      width: 1450px;
      height: 1250px;
      transform-origin: 0 0;
      transition: transform 0.05s ease-out;
    }
    .venue-boundary {
      position: absolute;
      inset: 0;
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      background: rgba(30, 41, 59, 0.3);
    }
    .hall-element {
      position: absolute;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .element-stage {
      background: rgba(245, 158, 11, 0.15);
      border: 2px solid rgba(245, 158, 11, 0.5);
      color: #fcd34d;
    }
    .element-dance {
      background: rgba(99, 102, 241, 0.15);
      border: 2px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }
    .element-bar {
      background: rgba(16, 185, 129, 0.15);
      border: 2px solid rgba(16, 185, 129, 0.4);
      color: #6ee7b7;
    }
    .element-entrance {
      background: rgba(148, 163, 184, 0.15);
      border: 2px solid rgba(148, 163, 184, 0.4);
      color: #e2e8f0;
    }
    .table-node {
      position: absolute;
      background: rgba(30, 41, 59, 0.9);
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
    }
    .table-node:hover {
      border-color: #6366f1;
      transform: scale(1.04);
      box-shadow: 0 8px 24px rgba(99,102,241,0.3);
    }
    .table-node.highlighted {
      border-color: #f59e0b !important;
      box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.5) !important;
      transform: scale(1.08) !important;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(1.05); }
      to { transform: scale(1.12); }
    }
    .table-round { border-radius: 50%; }
    .table-rect { border-radius: 18px; }
    .table-num {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
    }
    .table-sub {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .modal-card {
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      width: 100%;
      max-width: 440px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      animation: slideUp 0.25s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      padding: 18px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
    }
    .modal-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 22px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
    }
    .modal-close:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .modal-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
    }
    .guest-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 12px;
      margin-bottom: 8px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .guest-name {
      font-weight: 700;
      font-size: 14px;
    }
    .guest-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }
    .zoom-controls {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px;
      z-index: 20;
    }
    .zoom-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoom-btn:hover { background: rgba(255,255,255,0.1); }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-icon">💍</div>
      <div>
        <div class="brand-title" id="header-title">מתכנן הושבה לחתונה</div>
      </div>
    </div>

    <div class="search-box">
      <input type="text" id="search-input" placeholder="🔍 חפש שם אורח / משפחה..." autocomplete="off">
    </div>
  </header>

  <div id="canvas-container">
    <div id="venue-plane">
      <div class="venue-boundary"></div>
      <div id="elements-layer"></div>
      <div id="tables-layer"></div>
    </div>
  </div>

  <div class="zoom-controls">
    <button class="zoom-btn" id="btn-zoom-in">+</button>
    <button class="zoom-btn" id="btn-fit">⛶</button>
    <button class="zoom-btn" id="btn-zoom-out">−</button>
  </div>

  <div class="modal-overlay" id="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <div class="modal-title" id="modal-table-title">שולחן 1</div>
          <div style="font-size: 12px; color: #94a3b8;" id="modal-table-sub">0 מקומות תפוסים</div>
        </div>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body" id="modal-guest-list"></div>
    </div>
  </div>

  <script>
    const DATA = ${statePayload};

    document.getElementById('header-title').innerText = DATA.eventName;

    const container = document.getElementById('canvas-container');
    const plane = document.getElementById('venue-plane');
    const tablesLayer = document.getElementById('tables-layer');
    const elementsLayer = document.getElementById('elements-layer');
    const modal = document.getElementById('modal-overlay');
    const searchInput = document.getElementById('search-input');

    let scale = 0.75;
    let panX = 20;
    let panY = 20;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    function updateTransform() {
      plane.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${scale})\`;
    }

    function fitToScreen() {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaleX = (cw - 40) / 1450;
      const scaleY = (ch - 40) / 1250;
      scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);
      panX = Math.max(10, (cw - 1450 * scale) / 2);
      panY = Math.max(10, (ch - 1250 * scale) / 2);
      updateTransform();
    }

    // Render Venue Elements
    DATA.hallElements.forEach(el => {
      const div = document.createElement('div');
      div.className = \`hall-element element-\${el.type}\`;
      div.style.left = el.x + 'px';
      div.style.top = el.y + 'px';
      div.style.width = el.width + 'px';
      div.style.height = el.height + 'px';
      div.innerText = el.name;
      elementsLayer.appendChild(div);
    });

    // Render Tables
    const tableElementsMap = new Map();
    DATA.tables.forEach(t => {
      const div = document.createElement('div');
      div.className = \`table-node \${t.shape === 'round' ? 'table-round' : 'table-rect'}\`;
      div.style.left = t.x + 'px';
      div.style.top = t.y + 'px';
      div.style.width = t.width + 'px';
      div.style.height = t.height + 'px';
      div.dataset.tableId = t.id;

      const guests = DATA.tableGuests[t.id] || [];
      const totalSeated = guests.reduce((sum, g) => sum + (g.approved || 0), 0);
      const cap = t.capacity || DATA.defaultCapacity || 12;

      div.innerHTML = \`
        <div class="table-num">\${t.tableNumber}</div>
        <div class="table-sub">\${totalSeated}/\${cap}</div>
      \`;

      div.onclick = (e) => {
        e.stopPropagation();
        openTableModal(t, guests, totalSeated, cap);
      };

      tablesLayer.appendChild(div);
      tableElementsMap.set(t.id, div);
    });

    function openTableModal(table, guests, totalSeated, cap) {
      document.getElementById('modal-table-title').innerText = table.name || \`שולחן \${table.tableNumber}\`;
      document.getElementById('modal-table-sub').innerText = \`תפוסה: \${totalSeated} מתוך \${cap} מקומות (\${guests.length} מוזמנים)\`;

      const list = document.getElementById('modal-guest-list');
      list.innerHTML = '';

      if (guests.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 24px 0;">שולחן זה עדיין ריק</div>';
      } else {
        guests.forEach(g => {
          const row = document.createElement('div');
          row.className = 'guest-row';
          row.innerHTML = \`
            <div>
              <div class="guest-name">\${g.name}</div>
              <div style="font-size: 11px; color: #94a3b8;">\${g.group || 'כללי'}</div>
            </div>
            <div class="guest-badge">\${g.approved} מקומות</div>
          \`;
          list.appendChild(row);
        });
      }

      modal.style.display = 'flex';
    }

    document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };

    // Pan & Zoom handlers
    container.onmousedown = (e) => {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    };
    window.onmousemove = (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    };
    window.onmouseup = () => isPanning = false;

    container.onwheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      scale = Math.min(Math.max(scale * factor, 0.35), 2.2);
      updateTransform();
    };

    document.getElementById('btn-zoom-in').onclick = () => {
      scale = Math.min(scale + 0.15, 2.2);
      updateTransform();
    };
    document.getElementById('btn-zoom-out').onclick = () => {
      scale = Math.max(scale - 0.15, 0.35);
      updateTransform();
    };
    document.getElementById('btn-fit').onclick = fitToScreen;

    // Search filter
    searchInput.oninput = (e) => {
      const q = (e.target.value || '').trim().toLowerCase();
      tableElementsMap.forEach((el) => el.classList.remove('highlighted'));

      if (!q) return;

      DATA.tables.forEach(t => {
        const guests = DATA.tableGuests[t.id] || [];
        const match = guests.some(g => (g.name || '').toLowerCase().includes(q));
        if (match) {
          const el = tableElementsMap.get(t.id);
          if (el) el.classList.add('highlighted');
        }
      });
    };

    fitToScreen();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `סידור_הושבה_מפה_אינטראקטיבית.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
