"""
Wedding RSVP Automated Guest Scraper & Real-Time Syncer with Telegram Bot
-------------------------------------------------------------------------
Automates login to the RSVP portal with Playwright, extracts guest cards,
attendance counts, and statuses (approved, declined, pending), reconciles
non-destructively with the wedding seating planner, pushes to GitHub repository,
and sends live Telegram notifications on every update.
"""

import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import csv
import json
import time
import argparse
import traceback
import subprocess
import shutil
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

DEFAULT_URL = "https://callup.ltd/ua/main"
DEFAULT_PHONE = "0503505350"
DEFAULT_PASSWORD = "962317"
TELEGRAM_BOT_TOKEN = "8608609950:AAEGt_bCtuHmmWR5ORKl1uEOKC0eOLFfzYg"
TELEGRAM_CHAT_FILE = Path("scripts/telegram_chat_id.txt")
STORAGE_STATE_PATH = Path("scripts/session_state.json")
PREV_SCRAPE_CACHE_PATH = Path("scripts/last_scrape_cache.json")
OUTPUT_CSV_PATH = Path("WeddingGuests.csv")
EVENT_STATE_PATH = Path("data/event-state.json")


def clean_str(s):
    return " ".join((s or "").split()).strip()


def generate_guest_id(name: str, group: str, index: int) -> str:
    clean_n = "_".join(clean_str(name).lower().split())
    clean_g = "_".join((group or "general").strip().lower().split())
    return f"guest_{clean_n}_{clean_g}_{index}"


# ==========================================
# Telegram Bot Engine & Multi-Chat Management
# ==========================================

TELEGRAM_CHATS_FILE = Path("scripts/telegram_chat_ids.json")


def get_all_telegram_chat_ids(token=TELEGRAM_BOT_TOKEN, explicit_chat_id=None):
    chat_ids = set()

    # If explicit chat passed
    if explicit_chat_id:
        chat_ids.add(str(explicit_chat_id).strip())

    # Check environment variable
    env_id = os.environ.get("TELEGRAM_CHAT_ID")
    if env_id:
        for cid in env_id.split(","):
            if cid.strip():
                chat_ids.add(cid.strip())

    # Load previously saved chats from JSON
    if TELEGRAM_CHATS_FILE.exists():
        try:
            saved = json.loads(TELEGRAM_CHATS_FILE.read_text(encoding="utf-8"))
            if isinstance(saved, list):
                chat_ids.update(str(x) for x in saved)
        except Exception:
            pass

    # Discover new chats and groups via getUpdates
    try:
        url = f"https://api.telegram.org/bot{token}/getUpdates"
        req = urllib.request.Request(url, headers={"User-Agent": "Wedding-Seating-Bot"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get("ok") and data.get("result"):
                for update in data["result"]:
                    msg = (
                        update.get("message") or 
                        update.get("my_chat_member") or 
                        update.get("channel_post") or
                        update.get("chat_member")
                    )
                    if msg and msg.get("chat"):
                        c_id = str(msg["chat"]["id"])
                        c_type = msg["chat"].get("type", "unknown")
                        c_title = msg["chat"].get("title") or msg["chat"].get("first_name", "")
                        if c_id not in chat_ids:
                            print(f"📱 Discovered Telegram {c_type}: '{c_title}' (ID: {c_id})", flush=True)
                        chat_ids.add(c_id)
    except Exception as e:
        print(f"Notice checking Telegram updates: {e}", flush=True)

    if chat_ids:
        TELEGRAM_CHATS_FILE.parent.mkdir(parents=True, exist_ok=True)
        TELEGRAM_CHATS_FILE.write_text(json.dumps(list(chat_ids)), encoding="utf-8")

    return list(chat_ids)


def send_telegram_notification(text: str, token=TELEGRAM_BOT_TOKEN, chat_id=None) -> bool:
    if chat_id:
        targets = [str(x).strip() for x in (chat_id if isinstance(chat_id, list) else [chat_id])]
    else:
        targets = get_all_telegram_chat_ids(token)

    if not targets:
        print("\n💡 [Telegram Setup Required]:", flush=True)
        print("   1. Open Telegram and search for: @Court_Finder_dev_bot", flush=True)
        print("   2. Link: https://t.me/Court_Finder_dev_bot", flush=True)
        print("   3. In your group: Add the bot and type `/start` or mention @Court_Finder_dev_bot.", flush=True)
        return False

    success = False
    for target_chat in targets:
        try:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            payload = {
                "chat_id": target_chat,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={"Content-Type": "application/json", "User-Agent": "Wedding-Seating-Bot"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                if res_data.get("ok"):
                    print(f"📱 Telegram notification delivered to: {target_chat}", flush=True)
                    success = True
        except Exception as e:
            print(f"⚠️ Telegram delivery error for {target_chat}: {e}", flush=True)

    return success


def compute_scrape_diff(current_rows, prev_rows):
    """
    Computes diff between current scrape cycle and previous scrape cycle.
    """
    if not prev_rows:
        return {
            "is_initial": True,
            "new_approved": [r for r in current_rows if r.get("approved", 0) > 0],
            "new_declined": [r for r in current_rows if r.get("approved", 0) == 0 and r.get("invited", 0) > 0],
            "count_changes": [],
            "new_arrivals": current_rows,
        }

    prev_map = {clean_str(r.get("name")).lower(): r for r in prev_rows if r.get("name")}
    
    new_approved = []
    new_declined = []
    count_changes = []
    new_arrivals = []

    for curr in current_rows:
        key = clean_str(curr.get("name")).lower()
        prev = prev_map.get(key)

        if not prev:
            new_arrivals.append(curr)
            if curr.get("approved", 0) > 0:
                new_approved.append(curr)
            elif curr.get("approved", 0) == 0:
                new_declined.append(curr)
        else:
            old_app = prev.get("approved", 0)
            new_app = curr.get("approved", 0)

            if old_app == 0 and new_app > 0:
                new_approved.append(curr)
            elif old_app > 0 and new_app == 0:
                new_declined.append(curr)
            elif old_app != new_app:
                count_changes.append({
                    "name": curr["name"],
                    "old_count": old_app,
                    "new_count": new_app,
                })

    return {
        "is_initial": False,
        "new_approved": new_approved,
        "new_declined": new_declined,
        "count_changes": count_changes,
        "new_arrivals": new_arrivals,
    }


def format_telegram_message(diff, totals):
    time_str = datetime.now().strftime("%H:%M")
    lines = [
        f"💍 <b>עדכון סידור הושבה ואישורי הגעה ({time_str})</b>",
        "",
        "📊 <b>תמונת מצב כללית:</b>",
        f"• ✅ <b>אישרו הגעה (מגיעים):</b> {totals['total_approved']} מוזמנים ({totals['approved_parties']} משפחות)",
        f"• ❌ <b>סירבו / לא מגיעים:</b> {totals['declined_count']} מוזמנים",
        f"• ⏳ <b>מתלבטים / טרם השיבו:</b> {totals['pending_count']} מוזמנים",
        f"• 📋 <b>סה\"כ ברשימה:</b> {totals['total_rows']} הזמנות",
        ""
    ]

    new_approved = diff.get("new_approved", [])
    new_declined = diff.get("new_declined", [])
    count_changes = diff.get("count_changes", [])
    new_arrivals = diff.get("new_arrivals", [])

    if diff.get("is_initial"):
        lines.append("🚀 <b>סנכרון ראשוני הופעל בהצלחה!</b>")
        lines.append(f"נטענו {totals['total_rows']} מוזמנים. האתר מעודכן וממשיך לסנכרן כל 10 דקות.")
    elif new_approved or new_declined or count_changes or new_arrivals:
        lines.append("🆕 <b>מה השתנה בעדכון זה:</b>")

        if new_approved:
            lines.append("🟢 <b>אישרו הגעה חדשים:</b>")
            for item in new_approved[:12]:
                lines.append(f"  • {item['name']} (+{item['approved']})")
            if len(new_approved) > 12:
                lines.append(f"  <i>...ועוד {len(new_approved) - 12} נוספים</i>")

        if new_declined:
            lines.append("🔴 <b>סירבו / ביטלו הגעה:</b>")
            for item in new_declined[:12]:
                lines.append(f"  • {item['name']}")
            if len(new_declined) > 12:
                lines.append(f"  <i>...ועוד {len(new_declined) - 12} נוספים</i>")

        if count_changes:
            lines.append("🔄 <b>שינויי כמות אורחים:</b>")
            for item in count_changes[:12]:
                lines.append(f"  • {item['name']}: מ-{item['old_count']} ל-{item['new_count']}")

        if new_arrivals:
            lines.append("✨ <b>אורחים חדשים שנוספו לרשימה:</b>")
            for item in new_arrivals[:10]:
                lines.append(f"  • {item['name']} ({item['approved']}/{item['invited']})")
    else:
        lines.append("ℹ️ <i>לא נרשמו שינויים בסבב זה. הכל מסונכרן.</i>")

    lines.append("")
    lines.append("🪑 תרשים ההושבה באתר מסונכרן בזמן אמת!")
    lines.append("🔗 https://rotemk83.github.io/wedding-seating-planner/")
    return "\n".join(lines)


# ==========================================
# Extraction & DOM Inspection
# ==========================================

def extract_guests_from_page(page):
    extraction_script = """
    () => {
        const clean = s => (s || '').replace(/\\s+/g, ' ').trim();
        
        let cards = [...document.querySelectorAll('div[background="#ffffff"]')]
            .filter(card => [...card.querySelectorAll('div')].some(d =>
                /^\\s*\\d+\\s*\\/\\s*\\d+\\s*$/.test(d.textContent || '')
            ));

        if (!cards.length) {
            cards = [...document.querySelectorAll('div')]
                .filter(card => {
                    const bg = window.getComputedStyle(card).backgroundColor;
                    const isWhite = bg === 'rgb(255, 255, 255)' || bg === '#ffffff';
                    const hasRatio = [...card.querySelectorAll('div')].some(d =>
                        /^\\s*\\d+\\s*\\/\\s*\\d+\\s*$/.test(d.textContent || '')
                    );
                    return isWhite && hasRatio && card.children.length >= 1;
                });
        }

        if (!cards.length) {
            return [];
        }

        const rows = cards.map((card, index) => {
            const ratioEl = [...card.querySelectorAll('div')].find(d =>
                /^\\s*\\d+\\s*\\/\\s*\\d+\\s*$/.test(d.textContent || '')
            );
            const ratio = clean(ratioEl?.textContent);
            
            const parts = ratio.split('/').map(x => x.trim());
            const approved = parts[0] ? parseInt(parts[0], 10) || 0 : 0;
            const invited = parts[1] ? parseInt(parts[1], 10) || approved || 1 : (approved || 1);
            
            const firstSection = card.children[0];
            let rawName = clean(
                firstSection?.innerText || firstSection?.textContent
            );
            
            const prefixMatch = rawName.match(/^\\+\\s*(\\d+)\\s*/);
            const uiExtra = prefixMatch ? prefixMatch[1] : '';
            const name = clean(
                rawName.replace(/^\\+\\s*\\d+\\s*/, '')
            );
            
            let group = '';
            let p = card.previousElementSibling;
            while (p) {
                if (p.id && clean(p.id)) {
                    group = clean(p.id);
                    break;
                }
                p = p.previousElementSibling;
            }
            
            const noPhone = !!card.querySelector('img[alt="noPhone"]');
            const hasNotes = !!card.querySelector('img[alt="notes"]');
            
            return {
                index,
                name: name || rawName || 'אורח',
                approved,
                invited,
                group: group || 'כללי',
                hasPhone: noPhone ? 'No' : 'Yes/Unknown',
                hasNotes: hasNotes ? 'Yes' : 'No',
                uiExtra,
                rawName: rawName || name
            };
        });

        rows.sort((a, b) =>
            a.name.localeCompare(b.name, 'he', { sensitivity: 'base' })
        );

        return rows;
    }
    """
    return page.evaluate(extraction_script)


def save_to_csv(rows, output_path: Path):
    headers = [
        'Name',
        'Approved',
        'Invited',
        'Group',
        'HasPhone',
        'HasNotes',
        'UIExtra',
        'RawName'
    ]
    
    with open(output_path, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for r in rows:
            writer.writerow({
                'Name': r.get('name', ''),
                'Approved': r.get('approved', 0),
                'Invited': r.get('invited', 1),
                'Group': r.get('group', 'כללי'),
                'HasPhone': r.get('hasPhone', 'Yes/Unknown'),
                'HasNotes': r.get('hasNotes', 'No'),
                'UIExtra': r.get('uiExtra', ''),
                'RawName': r.get('rawName', r.get('name', ''))
            })
    print(f"📄 Saved {len(rows)} records to {output_path.name}", flush=True)


def reconcile_into_event_state(scraped_rows, state_file_path: Path):
    current_state = {}
    if state_file_path.exists():
        try:
            with open(state_file_path, "r", encoding="utf-8") as f:
                current_state = json.load(f)
        except Exception as e:
            print(f"Warning reading existing state file: {e}", flush=True)

    existing_guests = current_state.get("guests", [])
    existing_assignments = current_state.get("assignments", [])
    existing_tables = current_state.get("tables", [])
    
    existing_map_by_name = {clean_str(g.get("name")).lower(): g for g in existing_guests if g.get("name")}
    assigned_guest_ids = {a.get("guestId"): a.get("tableId") for a in existing_assignments if a.get("guestId")}

    updated_guests = []
    processed_existing_ids = set()

    new_arrivals_count = 0
    updated_counts_count = 0
    not_attending_assigned_count = 0

    for idx, new_g in enumerate(scraped_rows):
        key = clean_str(new_g["name"]).lower()
        existing = existing_map_by_name.get(key)
        
        if existing:
            processed_existing_ids.add(existing.get("id"))
            old_approved = existing.get("approved", 0)
            new_approved = new_g["approved"]
            is_assigned = existing.get("id") in assigned_guest_ids
            count_changed = (old_approved != new_approved)
            is_not_attending = (new_approved == 0)

            status_flag = "normal"
            if is_not_attending and is_assigned:
                status_flag = "not_attending"
                not_attending_assigned_count += 1
            elif count_changed:
                status_flag = "updated_count"
                updated_counts_count += 1

            merged_guest = {
                **existing,
                "name": new_g["name"],
                "approved": new_approved,
                "invited": new_g["invited"],
                "group": new_g["group"],
                "hasPhone": new_g["hasPhone"],
                "hasNotes": new_g["hasNotes"] == "Yes",
                "uiExtra": new_g.get("uiExtra", ""),
                "rawName": new_g.get("rawName", new_g["name"]),
                "statusFlag": status_flag,
                "previousApproved": old_approved if count_changed else existing.get("previousApproved")
            }
            updated_guests.append(merged_guest)
        else:
            guest_id = generate_guest_id(new_g["name"], new_g["group"], idx)
            new_arrivals_count += 1
            updated_guests.append({
                "id": guest_id,
                "name": new_g["name"],
                "approved": new_g["approved"],
                "invited": new_g["invited"],
                "group": new_g["group"],
                "hasPhone": new_g["hasPhone"],
                "hasNotes": new_g["hasNotes"] == "Yes",
                "uiExtra": new_g.get("uiExtra", ""),
                "rawName": new_g.get("rawName", new_g["name"]),
                "statusFlag": "new_arrival"
            })

    for existing in existing_guests:
        if existing.get("id") not in processed_existing_ids:
            is_assigned = existing.get("id") in assigned_guest_ids
            updated_guests.append({
                **existing,
                "statusFlag": "not_attending" if is_assigned else "normal"
            })

    iso_now = datetime.now(timezone.utc).isoformat()
    updated_state = {
        "version": current_state.get("version", "1.0.0"),
        "lastModified": iso_now,
        "eventName": current_state.get("eventName", "Wedding Seating Planner"),
        "defaultCapacity": current_state.get("defaultCapacity", 12),
        "guests": updated_guests,
        "assignments": existing_assignments,
        "tables": existing_tables,
        "hallElements": current_state.get("hallElements", []),
        "notes": current_state.get("notes", "Auto-synced from RSVP portal"),
        "preferences": current_state.get("preferences", {"theme": "system"})
    }

    state_file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(state_file_path, "w", encoding="utf-8") as f:
        json.dump(updated_state, f, ensure_ascii=False, indent=2)

    print(f"💾 Synced to {state_file_path.name} at {iso_now}", flush=True)
    print(f"   ↳ {len(updated_guests)} total guests | +{new_arrivals_count} new | {updated_counts_count} count updates | {not_attending_assigned_count} unconfirmed-at-table", flush=True)
    return updated_state


def sync_to_git_repository(commit_msg: str):
    try:
        public_data = Path("public/data/event-state.json")
        public_data.parent.mkdir(parents=True, exist_ok=True)
        if EVENT_STATE_PATH.exists():
            shutil.copyfile(EVENT_STATE_PATH, public_data)

        subprocess.run(["git", "add", "data/event-state.json", "public/data/event-state.json", "WeddingGuests.csv"], capture_output=True)

        diff_check = subprocess.run(["git", "diff", "--staged", "--quiet"])
        if diff_check.returncode != 0:
            subprocess.run(["git", "commit", "-m", commit_msg], capture_output=True, check=True)
            print(f"📦 Committed data updates to git: {commit_msg}", flush=True)

            push_res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
            if push_res.returncode == 0:
                print("🚀 Pushed updates directly to GitHub https://github.com/Rotemk83/wedding-seating-planner (main branch)!", flush=True)
            else:
                print(f"⚠️ Git push output: {push_res.stderr.strip() or push_res.stdout.strip()}", flush=True)
        else:
            print("ℹ️ Git repository is already up to date with latest data.", flush=True)
    except Exception as e:
        print(f"⚠️ Note on git sync: {e}", flush=True)


def perform_login(page, phone: str, password: str) -> bool:
    try:
        phone_input = page.locator('input[name="phone"]')
        if phone_input.count() > 0 and phone_input.first.is_visible():
            print(f"🔑 Login form detected. Logging in with phone {phone}...", flush=True)
            phone_input.first.fill(phone)
            page.wait_for_timeout(300)

            pwd_input = page.locator('input[name="password"]')
            if pwd_input.count() > 0:
                pwd_input.first.fill(password)
                page.wait_for_timeout(300)

            submit_btn = page.locator('button:has-text("התחברות"), button[type="submit"]')
            if submit_btn.count() > 0:
                submit_btn.first.click()
            else:
                page.keyboard.press("Enter")

            page.wait_for_timeout(4000)
            return True
    except Exception as e:
        print(f"Login check note: {e}", flush=True)
    return False


def run_sync_cycle(page, context, site_url: str, phone: str, password: str, chat_id: str = None):
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🔄 Starting RSVP Sync Cycle...", flush=True)

    try:
        current_url = page.url
        if not current_url or current_url == "about:blank" or site_url not in current_url:
            page.goto(site_url, wait_until="domcontentloaded", timeout=45000)
        else:
            page.reload(wait_until="domcontentloaded", timeout=45000)
    except Exception as e:
        print(f"⚠️ Navigation reload note, navigating to {site_url}: {e}", flush=True)
        page.goto(site_url, wait_until="domcontentloaded", timeout=60000)

    page.wait_for_timeout(2000)

    logged_in = perform_login(page, phone, password)
    if logged_in:
        try:
            context.storage_state(path=str(STORAGE_STATE_PATH))
            print("💾 Saved refreshed session state to session_state.json", flush=True)
        except Exception:
            pass

    try:
        for _ in range(4):
            page.evaluate("window.scrollBy(0, 1200)")
            page.wait_for_timeout(350)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(1000)
    except Exception as e:
        print(f"Scroll note: {e}", flush=True)

    rows = extract_guests_from_page(page)

    if not rows:
        print("⚠️ No guest cards found on current page. Taking debug screenshot...", flush=True)
        Path("scripts").mkdir(parents=True, exist_ok=True)
        page.screenshot(path="scripts/debug_screenshot.png")
        print("Saved debug screenshot to scripts/debug_screenshot.png", flush=True)
        return None

    total_approved = sum(r.get("approved", 0) for r in rows)
    declined_count = sum(1 for r in rows if r.get("approved", 0) == 0)
    pending_count = sum(1 for r in rows if r.get("approved", 0) == 0 and r.get("invited", 0) > 0)
    approved_parties = sum(1 for r in rows if r.get("approved", 0) > 0)

    totals = {
        "total_rows": len(rows),
        "total_approved": total_approved,
        "approved_parties": approved_parties,
        "declined_count": declined_count,
        "pending_count": pending_count,
    }

    print(f"📊 Extracted {len(rows)} RSVP entries:", flush=True)
    print(f"   👥 Attending: {total_approved} seats across {approved_parties} parties", flush=True)
    print(f"   ❌ Declined / Not Coming: {declined_count}", flush=True)
    print(f"   ⏳ Pending / Unanswered: {pending_count}", flush=True)

    # 1. Save CSV
    save_to_csv(rows, OUTPUT_CSV_PATH)

    # 2. Reconcile and update event-state.json
    reconcile_into_event_state(rows, EVENT_STATE_PATH)

    # 3. Auto-commit and push updated state directly to GitHub repository
    sync_to_git_repository(f"Auto-sync RSVP attendees ({total_approved} confirmed) - {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # 4. Compute diff with previous scrape cache
    prev_rows = []
    if PREV_SCRAPE_CACHE_PATH.exists():
        try:
            with open(PREV_SCRAPE_CACHE_PATH, "r", encoding="utf-8") as f:
                prev_rows = json.load(f)
        except Exception:
            pass

    diff = compute_scrape_diff(rows, prev_rows)

    # 5. Save current rows to cache for next diff
    with open(PREV_SCRAPE_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    # 6. Send Telegram notification
    msg = format_telegram_message(diff, totals)
    send_telegram_notification(msg, token=TELEGRAM_BOT_TOKEN, chat_id=chat_id)

    return rows


def start_automation(
    site_url: str,
    phone: str = DEFAULT_PHONE,
    password: str = DEFAULT_PASSWORD,
    interval_seconds: int = 600,
    chat_id: str = None,
    headless: bool = True,
    once: bool = False
):
    print("=" * 65, flush=True)
    print("💍 Wedding RSVP Automated Guest Sync Daemon + Telegram Bot", flush=True)
    print(f"🌐 Target: {site_url}", flush=True)
    print(f"⏰ Sync Interval: Every {interval_seconds // 60} minutes ({interval_seconds}s)", flush=True)
    print(f"🤖 Telegram Bot: @Court_Finder_dev_bot (https://t.me/Court_Finder_dev_bot)", flush=True)
    print(f"👁️ Headless Mode: {headless}", flush=True)
    print("=" * 65, flush=True)

    STORAGE_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Initial chat list discovery
    active_chats = get_all_telegram_chat_ids(token=TELEGRAM_BOT_TOKEN, explicit_chat_id=chat_id)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )

        context_kwargs = {
            "viewport": {"width": 1400, "height": 900},
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        if STORAGE_STATE_PATH.exists():
            context_kwargs["storage_state"] = str(STORAGE_STATE_PATH)

        context = browser.new_context(**context_kwargs)
        page = context.new_page()

        cycle_count = 1

        while True:
            try:
                run_sync_cycle(page, context, site_url, phone, password, chat_id=chat_id)
            except Exception as err:
                print(f"❌ Error during sync cycle #{cycle_count}: {err}", flush=True)
                traceback.print_exc()
                try:
                    page.screenshot(path="scripts/error_screenshot.png")
                except Exception:
                    pass

            if once:
                print("🏁 Single run completed.", flush=True)
                break

            next_run_time = datetime.fromtimestamp(time.time() + interval_seconds).strftime('%H:%M:%S')
            print(f"\n⏳ Cycle #{cycle_count} complete. Monitoring active. Next sync at {next_run_time} (in {interval_seconds // 60} min)...", flush=True)
            cycle_count += 1

            # Sleep in 1-second ticks while checking for new Telegram messages
            for tick in range(interval_seconds):
                time.sleep(1)
                
                # Check for new Telegram group / private chats every 15 seconds
                if tick % 15 == 0:
                    new_chats = get_all_telegram_chat_ids(token=TELEGRAM_BOT_TOKEN)
                    diff_chats = set(new_chats) - set(active_chats)
                    if diff_chats:
                        active_chats = new_chats
                        print(f"\n🎉 New Telegram chat/group connected: {diff_chats}! Sending status report...", flush=True)
                        if PREV_SCRAPE_CACHE_PATH.exists():
                            try:
                                with open(PREV_SCRAPE_CACHE_PATH, "r", encoding="utf-8") as f:
                                    cached_rows = json.load(f)
                                total_app = sum(r.get("approved", 0) for r in cached_rows)
                                dec_count = sum(1 for r in cached_rows if r.get("approved", 0) == 0)
                                pend_count = sum(1 for r in cached_rows if r.get("approved", 0) == 0 and r.get("invited", 0) > 0)
                                app_parties = sum(1 for r in cached_rows if r.get("approved", 0) > 0)
                                totals = {
                                    "total_rows": len(cached_rows),
                                    "total_approved": total_app,
                                    "approved_parties": app_parties,
                                    "declined_count": dec_count,
                                    "pending_count": pend_count,
                                }
                                diff = {"is_initial": True, "new_approved": [], "new_declined": [], "count_changes": [], "new_arrivals": []}
                                send_telegram_notification(format_telegram_message(diff, totals), token=TELEGRAM_BOT_TOKEN, chat_id=list(diff_chats))
                            except Exception as e:
                                print(f"Note sending group initial report: {e}", flush=True)

                # Periodic heartbeat log every 120s
                if tick > 0 and tick % 120 == 0:
                    remaining_mins = (interval_seconds - tick) // 60
                    print(f"💓 [{datetime.now().strftime('%H:%M:%S')}] Monitoring daemon active... Next sync in {remaining_mins} minutes ({next_run_time})", flush=True)

        browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wedding RSVP Guest Scraper & Telegram Syncer")
    parser.add_argument("--url", type=str, default=DEFAULT_URL, help="Target RSVP website URL (default: https://callup.ltd/ua/main)")
    parser.add_argument("--phone", type=str, default=DEFAULT_PHONE, help="Login phone number")
    parser.add_argument("--password", type=str, default=DEFAULT_PASSWORD, help="Login password")
    parser.add_argument("--interval", type=int, default=600, help="Sync interval in seconds (default: 600 = 10 min)")
    parser.add_argument("--chat-id", type=str, default=None, help="Telegram Chat ID (auto-detected if omitted)")
    parser.add_argument("--headed", action="store_true", help="Run browser in visible (headed) mode")
    parser.add_argument("--once", action="store_true", help="Run a single sync cycle and exit")

    args = parser.parse_args()
    start_automation(
        site_url=args.url,
        phone=args.phone,
        password=args.password,
        interval_seconds=args.interval,
        chat_id=args.chat_id,
        headless=not args.headed,
        once=args.once
    )
