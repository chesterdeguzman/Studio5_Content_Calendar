import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const DEFAULT_BRANDS = [
  "Ely Roofing", "TWF", "Cottage Wellness", "Bullens Jewellery", "N-Ergise",
  "Hemstocks Jewellery", "Tannery", "Newrooms", "Blossoms", "Dr Libby",
  "Poringland Dental", "Pollard and Read", "Studio 5"
];
const DEFAULT_TARGETS = { total: 12, carousel: 8, reel: 4 };
const ROOT_PATH = "sharedMonthlyContentCalendarV2";

let app;
let auth;
let db;
let rootRef;
let unsubscribeRoot = null;
let remote = { brands: {}, targets: DEFAULT_TARGETS, calendar: {}, specialDays: {} };
let currentBrand = DEFAULT_BRANDS[0];
let currentMonth = getCurrentMonth();
let editingId = null;
let editingSpecialDayId = null;
let currentLayout = "board";
let connected = false;

const els = {
  brandSelect: document.querySelector("#brandSelect"),
  monthPicker: document.querySelector("#monthPicker"),
  calendarBoard: document.querySelector("#calendarBoard"),
  calendarTableWrap: document.querySelector("#calendarTableWrap"),
  calendarTableBody: document.querySelector("#calendarTableBody"),
  addContentBtn: document.querySelector("#addContentBtn"),
  syncStatus: document.querySelector("#syncStatus"),
  contentDialog: document.querySelector("#contentDialog"),
  contentForm: document.querySelector("#contentForm"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  cancelDialogBtn: document.querySelector("#cancelDialogBtn"),
  deleteContentBtn: document.querySelector("#deleteContentBtn"),
  duplicateContentBtn: document.querySelector("#duplicateContentBtn"),
  statusFilter: document.querySelector("#statusFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  searchInput: document.querySelector("#searchInput"),
  totalCount: document.querySelector("#totalCount"),
  carouselCount: document.querySelector("#carouselCount"),
  reelCount: document.querySelector("#reelCount"),
  approvedCount: document.querySelector("#approvedCount"),
  totalProgress: document.querySelector("#totalProgress"),
  carouselProgress: document.querySelector("#carouselProgress"),
  reelProgress: document.querySelector("#reelProgress"),
  approvedProgress: document.querySelector("#approvedProgress"),
  exportDataBtn: document.querySelector("#exportDataBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  csvExportDialog: document.querySelector("#csvExportDialog"),
  csvExportForm: document.querySelector("#csvExportForm"),
  csvScope: document.querySelector("#csvScope"),
  csvDataset: document.querySelector("#csvDataset"),
  csvBatchField: document.querySelector("#csvBatchField"),
  csvBatchSelect: document.querySelector("#csvBatchSelect"),
  csvStartField: document.querySelector("#csvStartField"),
  csvEndField: document.querySelector("#csvEndField"),
  csvStartDate: document.querySelector("#csvStartDate"),
  csvEndDate: document.querySelector("#csvEndDate"),
  closeCsvDialogBtn: document.querySelector("#closeCsvDialogBtn"),
  cancelCsvDialogBtn: document.querySelector("#cancelCsvDialogBtn"),
  addSpecialDayBtn: document.querySelector("#addSpecialDayBtn"),
  specialDaysTableBody: document.querySelector("#specialDaysTableBody"),
  specialSearchInput: document.querySelector("#specialSearchInput"),
  specialCategoryFilter: document.querySelector("#specialCategoryFilter"),
  specialDayDialog: document.querySelector("#specialDayDialog"),
  specialDayForm: document.querySelector("#specialDayForm"),
  closeSpecialDialogBtn: document.querySelector("#closeSpecialDialogBtn"),
  cancelSpecialDialogBtn: document.querySelector("#cancelSpecialDialogBtn"),
  deleteSpecialDayBtn: document.querySelector("#deleteSpecialDayBtn"),
  importDataInput: document.querySelector("#importDataInput"),
  resetMonthBtn: document.querySelector("#resetMonthBtn"),
  brandOverviewList: document.querySelector("#brandOverviewList"),
  statusBreakdown: document.querySelector("#statusBreakdown"),
  brandManagementList: document.querySelector("#brandManagementList"),
  addBrandForm: document.querySelector("#addBrandForm"),
  newBrandInput: document.querySelector("#newBrandInput"),
  targetTotal: document.querySelector("#targetTotal"),
  targetCarousel: document.querySelector("#targetCarousel"),
  targetReel: document.querySelector("#targetReel"),
  saveTargetsBtn: document.querySelector("#saveTargetsBtn"),
  cardTemplate: document.querySelector("#contentCardTemplate")
};

const ACCESS_SESSION_KEY = "studio5WorkspaceSession";
const ACCESS_SESSION_DAYS = 30;
// Temporary shared code hash for: LIONS2026
// Replace this hash before final deployment. A front-end-only code gate is a convenience layer, not server-side security.
const ACCESS_CODE_HASH = "0898ddcbce8bd4bf21899b578ee00b7218f064f502cd9ef03c5c57a716a0c20b";
let accessAttempts = 0;

const accessGate = document.querySelector("#accessGate");
const accessForm = document.querySelector("#accessForm");
const accessCode = document.querySelector("#accessCode");
const accessError = document.querySelector("#accessError");
const accessSubmit = document.querySelector("#accessSubmit");
const accessSubmitLabel = document.querySelector(".access-submit-label");
const rememberAccess = document.querySelector("#rememberAccess");
const toggleAccessCode = document.querySelector("#toggleAccessCode");
const calendarApp = document.querySelector("#calendarApp");
const lockWorkspaceBtn = document.querySelector("#lockWorkspaceBtn");

startAccessGate();

function startAccessGate() {
  toggleAccessCode?.addEventListener("click", () => {
    const revealing = accessCode.type === "password";
    accessCode.type = revealing ? "text" : "password";
    toggleAccessCode.textContent = revealing ? "Hide" : "Show";
  });

  accessForm?.addEventListener("submit", verifyAccessCode);
  lockWorkspaceBtn?.addEventListener("click", () => {
    localStorage.removeItem(ACCESS_SESSION_KEY);
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
    location.reload();
  });

  const session = getAccessSession();
  if (session?.expiresAt > Date.now()) unlockWorkspace();
  else {
    localStorage.removeItem(ACCESS_SESSION_KEY);
    accessCode?.focus();
  }
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyAccessCode(event) {
  event.preventDefault();
  accessError.classList.add("hidden");
  accessSubmit.disabled = true;
  if (accessSubmitLabel) accessSubmitLabel.textContent = "Checking…";
  try {
    const enteredHash = await sha256(accessCode.value.trim());
    if (enteredHash !== ACCESS_CODE_HASH) {
      accessAttempts += 1;
      accessError.textContent = accessAttempts >= 3
        ? "Incorrect access code. Please confirm the code with The Lions Team."
        : "Incorrect access code. Please try again.";
      accessError.classList.remove("hidden");
      accessCode.select();
      return;
    }
    if (rememberAccess?.checked) {
      localStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify({
        granted: true,
        expiresAt: Date.now() + ACCESS_SESSION_DAYS * 24 * 60 * 60 * 1000
      }));
    } else {
      sessionStorage.setItem(ACCESS_SESSION_KEY, "granted");
    }
    unlockWorkspace();
  } finally {
    accessSubmit.disabled = false;
    if (accessSubmitLabel) accessSubmitLabel.textContent = "Open workspace";
  }
}

function getAccessSession() {
  if (sessionStorage.getItem(ACCESS_SESSION_KEY) === "granted") {
    return { granted: true, expiresAt: Number.MAX_SAFE_INTEGER };
  }
  try {
    return JSON.parse(localStorage.getItem(ACCESS_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function unlockWorkspace() {
  accessGate.classList.add("hidden");
  calendarApp.classList.remove("hidden");
  init();
}

async function init() {
  els.monthPicker.value = currentMonth;
  bindEvents();
  renderAll();
  setSyncStatus("connecting", "Connecting…");

  try {
    validateFirebaseConfig();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    rootRef = ref(db, ROOT_PATH);

    await signInAnonymously(auth);
    await ensureInitialData();
    connectRealtime();
  } catch (error) {
    console.error("Firebase startup error:", error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

function validateFirebaseConfig() {
  const required = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
  const missing = required.filter((key) => !firebaseConfig?.[key]);
  if (missing.length) throw new Error(`Missing Firebase config: ${missing.join(", ")}`);
}

async function ensureInitialData() {
  const snapshot = await get(rootRef);
  if (snapshot.exists()) return;

  const brands = {};
  DEFAULT_BRANDS.forEach((name) => {
    brands[brandKey(name)] = { name, createdAt: Date.now() };
  });

  await set(rootRef, {
    brands,
    targets: DEFAULT_TARGETS,
    calendar: {},
    specialDays: {},
    meta: { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  });
}

function connectRealtime() {
  if (unsubscribeRoot) unsubscribeRoot();
  unsubscribeRoot = onValue(
    rootRef,
    (snapshot) => {
      remote = normalizeRemote(snapshot.val());
      const names = getBrandNames();
      if (!names.includes(currentBrand)) currentBrand = names[0] || DEFAULT_BRANDS[0];
      connected = true;
      setSyncStatus("saved", "Saved online");
      renderAll();
    },
    (error) => {
      console.error("Realtime listener error:", error);
      connected = false;
      setSyncStatus("error", readableFirebaseError(error));
    }
  );
}

function normalizeRemote(value) {
  const data = value && typeof value === "object" ? value : {};
  return {
    brands: data.brands && typeof data.brands === "object" ? data.brands : {},
    targets: {
      total: Number(data.targets?.total) || DEFAULT_TARGETS.total,
      carousel: Number(data.targets?.carousel) || 0,
      reel: Number(data.targets?.reel) || 0
    },
    calendar: data.calendar && typeof data.calendar === "object" ? data.calendar : {},
    specialDays: data.specialDays && typeof data.specialDays === "object" ? data.specialDays : {},
    meta: data.meta || {}
  };
}

function brandKey(name) {
  return encodeURIComponent(name).replaceAll(".", "%2E");
}

function getBrandNames() {
  const names = Object.values(remote.brands || {})
    .map((entry) => typeof entry === "string" ? entry : entry?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return names.length ? names : [...DEFAULT_BRANDS];
}

function getSpecialDays(brand = currentBrand) {
  const itemsObject = remote.specialDays?.[brandKey(brand)] || {};
  return Object.entries(itemsObject)
    .map(([id, item]) => ({ id, ...item }))
    .filter((item) => item && typeof item === "object");
}

function getMonthItems(brand = currentBrand, month = currentMonth) {
  const itemsObject = remote.calendar?.[brandKey(brand)]?.[month] || {};
  return Object.entries(itemsObject)
    .map(([id, item]) => ({ id, ...item }))
    .filter((item) => item && typeof item === "object");
}

async function write(path, value, successText = "Saved online") {
  if (!connected || !auth?.currentUser) {
    alert("The online calendar is still connecting. Please wait a moment and try again.");
    return false;
  }

  setSyncStatus("saving", "Saving…");
  try {
    await set(ref(db, `${ROOT_PATH}/${path}`), value);
    await update(ref(db, `${ROOT_PATH}/meta`), {
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    });
    setSyncStatus("saved", successText);
    return true;
  } catch (error) {
    console.error("Firebase write error:", error);
    setSyncStatus("error", readableFirebaseError(error));
    alert(`Save failed: ${readableFirebaseError(error)}`);
    return false;
  }
}

function readableFirebaseError(error) {
  const code = error?.code || "";
  if (code.includes("permission-denied")) return "Permission denied";
  if (code.includes("operation-not-allowed")) return "Anonymous sign-in disabled";
  if (code.includes("network-request-failed")) return "Connection error";
  return error?.message ? `Error: ${error.message}` : "Sync error";
}

function setSyncStatus(status, text) {
  if (!els.syncStatus) return;
  els.syncStatus.dataset.state = status;
  els.syncStatus.textContent = text;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function renderAll() {
  els.targetTotal.value = remote.targets.total;
  els.targetCarousel.value = remote.targets.carousel;
  els.targetReel.value = remote.targets.reel;
  renderBrandSelect();
  renderCalendar();
  renderOverview();
  renderSpecialDays();
  renderBrandManagement();
  renderTargets();
}

function renderBrandSelect() {
  const names = getBrandNames();
  els.brandSelect.innerHTML = "";
  names.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    option.selected = brand === currentBrand;
    els.brandSelect.appendChild(option);
  });
}

function getFilteredItems() {
  const status = els.statusFilter.value;
  const type = els.typeFilter.value;
  const query = els.searchInput.value.trim().toLowerCase();
  return getMonthItems().filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesType = type === "all" || item.type === type;
    const haystack = [item.title, item.batch, item.contentFocus, item.caption, item.notes, item.visual, item.pillar, item.assignee, item.platform]
      .join(" ").toLowerCase();
    return matchesStatus && matchesType && (!query || haystack.includes(query));
  });
}

function renderCalendar() {
  const items = getFilteredItems();
  renderSummary();
  renderBoard(items);
  renderTable(items);
}

function renderSummary() {
  const items = getMonthItems();
  const total = items.length;
  const carousels = items.filter((item) => item.type === "Carousel").length;
  const reels = items.filter((item) => item.type === "Reel").length;
  const approved = items.filter((item) => item.status === "Approved").length;
  els.totalCount.textContent = `${total} / ${remote.targets.total}`;
  els.carouselCount.textContent = `${carousels} / ${remote.targets.carousel}`;
  els.reelCount.textContent = `${reels} / ${remote.targets.reel}`;
  els.approvedCount.textContent = approved;
  els.totalProgress.style.width = percent(total, remote.targets.total);
  els.carouselProgress.style.width = percent(carousels, remote.targets.carousel);
  els.reelProgress.style.width = percent(reels, remote.targets.reel);
  els.approvedProgress.style.width = percent(approved, total || 1);
}

function percent(value, target) {
  return `${Math.min(100, Math.round((value / Math.max(target, 1)) * 100))}%`;
}

function renderBoard(items) {
  els.calendarBoard.innerHTML = "";
  for (let week = 1; week <= 4; week += 1) {
    const weekItems = items.filter((item) => Number(item.week) === week)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const section = document.createElement("section");
    section.className = "week-column";
    section.dataset.week = week;
    section.innerHTML = `<div class="week-header"><h3>WEEK ${week}</h3><span>${weekItems.length} content${weekItems.length === 1 ? "" : "s"}</span></div><div class="week-content-list"></div>`;
    const list = section.querySelector(".week-content-list");
    if (!weekItems.length) {
      const empty = document.createElement("div");
      empty.className = "empty-week";
      empty.innerHTML = `<div><strong>No content added</strong><br><small>Target: 2 carousels + 1 reel</small></div>`;
      list.appendChild(empty);
    } else {
      weekItems.forEach((item) => list.appendChild(buildCard(item)));
    }
    els.calendarBoard.appendChild(section);
  }
}

function buildCard(item) {
  const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
  const typeBadge = node.querySelector(".type-badge");
  typeBadge.textContent = item.type;
  typeBadge.dataset.type = item.type;
  node.dataset.status = item.status;
  node.querySelector(".card-title").textContent = item.title || "Untitled content";
  node.querySelector(".card-caption").textContent = item.contentFocus || item.caption || item.visual || "No content focus added yet.";
  node.querySelector(".date-text").textContent = item.date ? formatDate(item.date) : "No date";
  node.querySelector(".platform-text").textContent = item.platform || "No platform";
  const statusPill = node.querySelector(".status-pill");
  statusPill.textContent = item.status;
  statusPill.dataset.status = item.status;
  node.querySelector(".assignee-text").textContent = item.assignee ? `Assigned: ${item.assignee}` : "";
  node.querySelector(".client-note-preview").textContent = item.notes ? `Client note: ${item.notes}` : "";
  node.querySelector(".edit-btn").addEventListener("click", () => openEditDialog(item.id));
  node.querySelectorAll(".status-actions button").forEach((button) => {
    button.addEventListener("click", () => updateStatus(item.id, button.dataset.status));
  });
  return node;
}

function renderTable(items) {
  els.calendarTableBody.innerHTML = "";
  items.slice().sort((a, b) => Number(a.week) - Number(b.week) || (a.date || "").localeCompare(b.date || ""))
    .forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>Week ${escapeHtml(item.week)}</td><td>${item.date ? formatDate(item.date) : "—"}</td><td><strong>${escapeHtml(item.title || "Untitled")}</strong><br><small>${escapeHtml(item.pillar || "")}</small></td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.platform || "—")}</td><td><span class="status-pill" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.notes || "—")}</td><td><button class="ghost-btn table-edit">Edit</button></td>`;
      row.querySelector(".table-edit").addEventListener("click", () => openEditDialog(item.id));
      els.calendarTableBody.appendChild(row);
    });
}

function openNewDialog(week = 1) {
  editingId = null;
  els.contentForm.reset();
  document.querySelector("#dialogTitle").textContent = "Add Content";
  document.querySelector("#contentWeek").value = week;
  document.querySelector("#contentPlatform").value = "Instagram + Facebook";
  document.querySelector("#contentStatus").value = "Pending";
  els.deleteContentBtn.classList.add("hidden");
  els.duplicateContentBtn.classList.add("hidden");
  els.contentDialog.showModal();
}

function openEditDialog(id) {
  const item = getMonthItems().find((entry) => entry.id === id);
  if (!item) return;
  editingId = id;
  document.querySelector("#dialogTitle").textContent = "Edit Content";
  const fields = {
    contentId: item.id,
    contentWeek: item.week,
    contentDate: item.date || "",
    contentTitle: item.title || "",
    contentType: item.type || "Carousel",
    contentBatch: item.batch || "",
    contentPlatform: item.platform || "Instagram + Facebook",
    contentPillar: item.pillar || "",
    contentFocus: item.contentFocus || "",
    contentAssignee: item.assignee || "",
    contentCaption: item.caption || "",
    contentVisual: item.visual || "",
    contentLink: item.link || "",
    contentStatus: item.status || "Pending",
    contentNotes: item.notes || ""
  };
  Object.entries(fields).forEach(([idName, value]) => {
    document.querySelector(`#${idName}`).value = value;
  });
  els.deleteContentBtn.classList.remove("hidden");
  els.duplicateContentBtn.classList.remove("hidden");
  els.contentDialog.showModal();
}

function closeDialog() {
  els.contentDialog.close();
  editingId = null;
}

async function saveContentFromForm(event) {
  event.preventDefault();
  const id = editingId || crypto.randomUUID();
  const item = {
    week: Number(document.querySelector("#contentWeek").value),
    date: document.querySelector("#contentDate").value,
    title: document.querySelector("#contentTitle").value.trim(),
    type: document.querySelector("#contentType").value,
    batch: document.querySelector("#contentBatch").value.trim(),
    platform: document.querySelector("#contentPlatform").value,
    pillar: document.querySelector("#contentPillar").value.trim(),
    contentFocus: document.querySelector("#contentFocus").value.trim(),
    assignee: document.querySelector("#contentAssignee").value.trim(),
    caption: document.querySelector("#contentCaption").value.trim(),
    visual: document.querySelector("#contentVisual").value.trim(),
    link: document.querySelector("#contentLink").value.trim(),
    status: document.querySelector("#contentStatus").value,
    notes: document.querySelector("#contentNotes").value.trim(),
    updatedAt: Date.now(),
    updatedBy: auth.currentUser.uid
  };
  const ok = await write(`calendar/${brandKey(currentBrand)}/${currentMonth}/${id}`, item);
  if (ok) closeDialog();
}

async function updateStatus(id, status) {
  const itemRef = ref(db, `${ROOT_PATH}/calendar/${brandKey(currentBrand)}/${currentMonth}/${id}`);
  setSyncStatus("saving", "Saving…");
  try {
    await update(itemRef, { status, updatedAt: Date.now(), updatedBy: auth.currentUser.uid });
    setSyncStatus("saved", "Saved online");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

async function deleteEditingContent() {
  if (!editingId || !confirm("Delete this content item?")) return;
  setSyncStatus("saving", "Saving…");
  try {
    await remove(ref(db, `${ROOT_PATH}/calendar/${brandKey(currentBrand)}/${currentMonth}/${editingId}`));
    closeDialog();
    setSyncStatus("saved", "Saved online");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

async function duplicateEditingContent() {
  if (!editingId) return;
  const source = getMonthItems().find((entry) => entry.id === editingId);
  if (!source) return;
  const { id: ignored, ...copy } = source;
  const newId = crypto.randomUUID();
  const duplicate = {
    ...copy,
    title: `${source.title} (Copy)`,
    status: "Pending",
    notes: "",
    updatedAt: Date.now(),
    updatedBy: auth.currentUser.uid
  };
  const ok = await write(`calendar/${brandKey(currentBrand)}/${currentMonth}/${newId}`, duplicate);
  if (ok) closeDialog();
}

function renderOverview() {
  els.brandOverviewList.innerHTML = "";
  getBrandNames().forEach((brand) => {
    const items = getMonthItems(brand, currentMonth);
    const approved = items.filter((item) => item.status === "Approved").length;
    const item = document.createElement("div");
    item.className = "brand-overview-item";
    item.innerHTML = `<div><strong>${escapeHtml(brand)}</strong><div class="progress" style="margin-top:8px; width:220px; max-width:100%;"><span style="width:${percent(items.length, remote.targets.total)}"></span></div></div><div class="brand-overview-meta">${items.length}/${remote.targets.total} total<br>${approved} approved</div>`;
    els.brandOverviewList.appendChild(item);
  });
  const currentItems = getMonthItems();
  const statuses = ["Pending", "Approved", "Revise", "Rejected"];
  els.statusBreakdown.innerHTML = statuses.map((status) => `<div class="status-row"><span>${status}</span><strong>${currentItems.filter((item) => item.status === status).length}</strong></div>`).join("");
}

function renderBrandManagement() {
  els.brandManagementList.innerHTML = "";
  getBrandNames().forEach((brand) => {
    const row = document.createElement("div");
    row.className = "brand-management-item";
    row.innerHTML = `<span>${escapeHtml(brand)}</span><button class="remove-brand-btn" type="button">Remove</button>`;
    row.querySelector("button").addEventListener("click", () => removeBrand(brand));
    els.brandManagementList.appendChild(row);
  });
}

async function addBrand(event) {
  event.preventDefault();
  const name = els.newBrandInput.value.trim();
  if (!name) return;
  if (getBrandNames().some((brand) => brand.toLowerCase() === name.toLowerCase())) {
    alert("That brand already exists.");
    return;
  }
  const ok = await write(`brands/${brandKey(name)}`, { name, createdAt: Date.now() });
  if (ok) {
    currentBrand = name;
    els.newBrandInput.value = "";
  }
}

async function removeBrand(brand) {
  if (getBrandNames().length === 1) return alert("At least one brand is required.");
  if (!confirm(`Remove ${brand}? Its saved calendar data will also be removed.`)) return;
  setSyncStatus("saving", "Saving…");
  try {
    const key = brandKey(brand);
    await update(ref(db, ROOT_PATH), {
      [`brands/${key}`]: null,
      [`calendar/${key}`]: null,
      [`specialDays/${key}`]: null,
      "meta/updatedAt": serverTimestamp(),
      "meta/updatedBy": auth.currentUser.uid
    });
    if (currentBrand === brand) currentBrand = getBrandNames().find((name) => name !== brand) || DEFAULT_BRANDS[0];
    setSyncStatus("saved", "Saved online");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

function renderTargets() {
  document.querySelector(".sidebar-card strong").textContent = `${remote.targets.total} contents`;
  document.querySelector(".sidebar-card small").textContent = `${remote.targets.carousel} carousels · ${remote.targets.reel} reels`;
}

async function saveTargets() {
  const total = Number(els.targetTotal.value);
  const carousel = Number(els.targetCarousel.value);
  const reel = Number(els.targetReel.value);
  if (total < 1 || carousel < 0 || reel < 0) return alert("Please enter valid target numbers.");
  await write("targets", { total, carousel, reel });
}

function exportData() {
  const payload = { exportedAt: new Date().toISOString(), app: "Shared Monthly Content Calendar V2", ...remote };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `content-calendar-backup-${currentMonth}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.brands || !imported.calendar) throw new Error("Invalid backup structure");
      setSyncStatus("saving", "Importing…");
      await set(rootRef, {
        brands: imported.brands,
        targets: imported.targets || DEFAULT_TARGETS,
        calendar: imported.calendar,
        specialDays: imported.specialDays || {},
        meta: { updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid }
      });
      setSyncStatus("saved", "Saved online");
      alert("Content calendar data imported and saved online.");
    } catch (error) {
      console.error(error);
      alert("This file is not a valid V2 content calendar backup.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

async function resetCurrentMonth() {
  if (!confirm(`Reset all content for ${currentBrand} in ${currentMonth}?`)) return;
  setSyncStatus("saving", "Saving…");
  try {
    await remove(ref(db, `${ROOT_PATH}/calendar/${brandKey(currentBrand)}/${currentMonth}`));
    setSyncStatus("saved", "Saved online");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

function bindEvents() {
  els.brandSelect.addEventListener("change", (event) => { currentBrand = event.target.value; renderAll(); });
  els.monthPicker.addEventListener("change", (event) => { currentMonth = event.target.value || getCurrentMonth(); renderAll(); });
  els.addContentBtn.addEventListener("click", () => openNewDialog());
  els.closeDialogBtn.addEventListener("click", closeDialog);
  els.cancelDialogBtn.addEventListener("click", closeDialog);
  els.contentForm.addEventListener("submit", saveContentFromForm);
  els.deleteContentBtn.addEventListener("click", deleteEditingContent);
  els.duplicateContentBtn.addEventListener("click", duplicateEditingContent);
  [els.statusFilter, els.typeFilter].forEach((el) => el.addEventListener("change", renderCalendar));
  els.searchInput.addEventListener("input", renderCalendar);
  document.querySelectorAll(".toggle-btn").forEach((button) => button.addEventListener("click", () => {
    currentLayout = button.dataset.layout;
    document.querySelectorAll(".toggle-btn").forEach((btn) => btn.classList.toggle("active", btn === button));
    els.calendarBoard.classList.toggle("hidden", currentLayout !== "board");
    els.calendarTableWrap.classList.toggle("hidden", currentLayout !== "table");
  }));
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn === button));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    document.querySelector(`#${button.dataset.view}View`).classList.add("active");
    document.querySelector("#pageTitle").textContent = { calendar: "Monthly Content Calendar", special: "Special Days Calendar", overview: "Brand Overview", settings: "Settings" }[button.dataset.view];
  }));
  els.exportDataBtn.addEventListener("click", exportData);
  els.exportCsvBtn.addEventListener("click", openCsvExportDialog);
  els.csvScope.addEventListener("change", updateCsvExportFields);
  els.csvExportForm.addEventListener("submit", exportCsv);
  els.closeCsvDialogBtn.addEventListener("click", () => els.csvExportDialog.close());
  els.cancelCsvDialogBtn.addEventListener("click", () => els.csvExportDialog.close());
  els.addSpecialDayBtn.addEventListener("click", openNewSpecialDayDialog);
  els.specialDayForm.addEventListener("submit", saveSpecialDay);
  els.closeSpecialDialogBtn.addEventListener("click", closeSpecialDayDialog);
  els.cancelSpecialDialogBtn.addEventListener("click", closeSpecialDayDialog);
  els.deleteSpecialDayBtn.addEventListener("click", deleteSpecialDay);
  els.specialSearchInput.addEventListener("input", renderSpecialDays);
  els.specialCategoryFilter.addEventListener("change", renderSpecialDays);
  els.importDataInput.addEventListener("change", importData);
  els.resetMonthBtn.addEventListener("click", resetCurrentMonth);
  els.addBrandForm.addEventListener("submit", addBrand);
  els.saveTargetsBtn.addEventListener("click", saveTargets);
}


function renderSpecialDays() {
  if (!els.specialDaysTableBody) return;
  const query = (els.specialSearchInput?.value || "").trim().toLowerCase();
  const category = els.specialCategoryFilter?.value || "all";
  const items = getSpecialDays().filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const haystack = [item.name, item.category, item.market, item.notes].join(" ").toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  }).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  els.specialDaysTableBody.innerHTML = "";
  if (!items.length) {
    els.specialDaysTableBody.innerHTML = '<tr class="empty-table-row"><td colspan="6">No special days added yet. Select “+ Add Special Day” to enter one manually for this brand.</td></tr>';
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${item.date ? formatDate(item.date) : "—"}${item.repeat === "yearly" ? "<br><small>Repeats yearly</small>" : ""}</td><td class="special-day-name">${escapeHtml(item.name || "Untitled")}</td><td><span class="category-pill">${escapeHtml(item.category || "Other")}</span></td><td>${escapeHtml(item.market || "—")}</td><td class="special-day-notes">${escapeHtml(item.notes || "—")}</td><td><button type="button" class="ghost-btn edit-special-day">Edit</button></td>`;
    row.querySelector(".edit-special-day").addEventListener("click", () => openEditSpecialDayDialog(item.id));
    els.specialDaysTableBody.appendChild(row);
  });
}

function openNewSpecialDayDialog() {
  editingSpecialDayId = null;
  els.specialDayForm.reset();
  document.querySelector("#specialDialogTitle").textContent = "Add Special Day";
  els.deleteSpecialDayBtn.classList.add("hidden");
  els.specialDayDialog.showModal();
}

function openEditSpecialDayDialog(id) {
  const item = getSpecialDays().find((entry) => entry.id === id);
  if (!item) return;
  editingSpecialDayId = id;
  document.querySelector("#specialDialogTitle").textContent = "Edit Special Day";
  document.querySelector("#specialDate").value = item.date || "";
  document.querySelector("#specialName").value = item.name || "";
  document.querySelector("#specialCategory").value = item.category || "Other";
  document.querySelector("#specialMarket").value = item.market || "";
  document.querySelector("#specialRepeat").value = item.repeat || "none";
  document.querySelector("#specialNotes").value = item.notes || "";
  els.deleteSpecialDayBtn.classList.remove("hidden");
  els.specialDayDialog.showModal();
}

function closeSpecialDayDialog() {
  els.specialDayDialog.close();
  editingSpecialDayId = null;
}

async function saveSpecialDay(event) {
  event.preventDefault();
  const id = editingSpecialDayId || crypto.randomUUID();
  const item = {
    date: document.querySelector("#specialDate").value,
    name: document.querySelector("#specialName").value.trim(),
    category: document.querySelector("#specialCategory").value,
    market: document.querySelector("#specialMarket").value.trim(),
    repeat: document.querySelector("#specialRepeat").value,
    notes: document.querySelector("#specialNotes").value.trim(),
    updatedAt: Date.now(),
    updatedBy: auth.currentUser.uid
  };
  const ok = await write(`specialDays/${brandKey(currentBrand)}/${id}`, item);
  if (ok) closeSpecialDayDialog();
}

async function deleteSpecialDay() {
  if (!editingSpecialDayId || !confirm("Delete this special day?")) return;
  try {
    setSyncStatus("saving", "Saving…");
    await remove(ref(db, `${ROOT_PATH}/specialDays/${brandKey(currentBrand)}/${editingSpecialDayId}`));
    closeSpecialDayDialog();
    setSyncStatus("saved", "Saved online");
  } catch (error) {
    setSyncStatus("error", readableFirebaseError(error));
  }
}

function openCsvExportDialog() {
  const batches = new Set();
  getAllContentRecords().forEach((record) => { if (record.batch) batches.add(record.batch); });
  els.csvBatchSelect.innerHTML = [...batches].sort((a, b) => a.localeCompare(b)).map((batch) => `<option value="${escapeHtml(batch)}">${escapeHtml(batch)}</option>`).join("");
  els.csvScope.value = "all";
  els.csvDataset.value = "content";
  els.csvStartDate.value = "";
  els.csvEndDate.value = "";
  updateCsvExportFields();
  els.csvExportDialog.showModal();
}

function updateCsvExportFields() {
  const scope = els.csvScope.value;
  els.csvBatchField.classList.toggle("hidden", scope !== "batch");
  els.csvStartField.classList.toggle("hidden", scope !== "dateRange");
  els.csvEndField.classList.toggle("hidden", scope !== "dateRange");
}

function getAllContentRecords() {
  const records = [];
  for (const brand of getBrandNames()) {
    const months = remote.calendar?.[brandKey(brand)] || {};
    for (const [month, items] of Object.entries(months)) {
      for (const [id, item] of Object.entries(items || {})) records.push({ recordType: "Content", brand, month, id, ...item });
    }
  }
  return records;
}

function getAllSpecialDayRecords() {
  const records = [];
  for (const brand of getBrandNames()) {
    const items = remote.specialDays?.[brandKey(brand)] || {};
    for (const [id, item] of Object.entries(items)) records.push({ recordType: "Special Day", brand, month: (item.date || "").slice(0, 7), id, ...item });
  }
  return records;
}

function exportCsv(event) {
  event.preventDefault();
  const dataset = els.csvDataset.value;
  let records = dataset === "content" ? getAllContentRecords() : dataset === "specialDays" ? getAllSpecialDayRecords() : [...getAllContentRecords(), ...getAllSpecialDayRecords()];
  const scope = els.csvScope.value;
  if (scope === "brand") records = records.filter((record) => record.brand === currentBrand);
  if (scope === "month") records = records.filter((record) => record.brand === currentBrand && record.month === currentMonth);
  if (scope === "batch") records = records.filter((record) => record.recordType === "Content" && record.batch === els.csvBatchSelect.value);
  if (scope === "dateRange") {
    const start = els.csvStartDate.value;
    const end = els.csvEndDate.value;
    if (!start || !end) return alert("Please select both a start and end date.");
    if (start > end) return alert("The start date must be before the end date.");
    records = records.filter((record) => record.date && record.date >= start && record.date <= end);
  }
  if (!records.length) return alert("No records match this export selection.");
  const preferredHeaders = ["recordType","brand","month","id","batch","week","date","title","type","platform","pillar","contentFocus","assignee","caption","visual","link","status","notes","name","category","market","repeat","updatedAt","updatedBy"];
  const extraHeaders = [...new Set(records.flatMap((record) => Object.keys(record)))].filter((key) => !preferredHeaders.includes(key));
  const headers = [...preferredHeaders.filter((key) => records.some((record) => key in record)), ...extraHeaders];
  const csv = [headers.map(csvCell).join(","), ...records.map((record) => headers.map((header) => csvCell(record[header] ?? "")).join(","))].join("\r\n");
  downloadFile(csv, `studio5-${dataset}-${scope}-${new Date().toISOString().slice(0,10)}.csv`, "text/csv;charset=utf-8;");
  els.csvExportDialog.close();
}

function csvCell(value) {
  const text = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
