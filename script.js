import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
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
let remote = { brands: {}, targets: DEFAULT_TARGETS, calendar: {}, specialDays: {}, assetRequests: {}, brandResources: {}, contentLinks: {} };
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
  exportPdfBtn: document.querySelector("#exportPdfBtn"),
  exportWordBtn: document.querySelector("#exportWordBtn"),
  requestAssetsBtn: document.querySelector("#requestAssetsBtn"),
  assetRequestNotice: document.querySelector("#assetRequestNotice"),
  assetRequestDialog: document.querySelector("#assetRequestDialog"),
  assetRequestForm: document.querySelector("#assetRequestForm"),
  assetRequestMessage: document.querySelector("#assetRequestMessage"),
  closeAssetRequestBtn: document.querySelector("#closeAssetRequestBtn"),
  cancelAssetRequestBtn: document.querySelector("#cancelAssetRequestBtn"),
  removeAssetRequestBtn: document.querySelector("#removeAssetRequestBtn"),
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
  deleteMonthSpecialDaysBtn: document.querySelector("#deleteMonthSpecialDaysBtn"),
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
  brandResourcesForm: document.querySelector("#brandResourcesForm"),
  brandNotes: document.querySelector("#brandNotes"),
  brandSopLink: document.querySelector("#brandSopLink"),
  brandSopFile: document.querySelector("#brandSopFile"),
  brandSopFileStatus: document.querySelector("#brandSopFileStatus"),
  removeBrandSopFileBtn: document.querySelector("#removeBrandSopFileBtn"),
  deleteBrandResourcesBtn: document.querySelector("#deleteBrandResourcesBtn"),
  addContentLinkBtn: document.querySelector("#addContentLinkBtn"),
  contentLinksSearchInput: document.querySelector("#contentLinksSearchInput"),
  contentLinksBrandFilter: document.querySelector("#contentLinksBrandFilter"),
  contentLinksEmptyState: document.querySelector("#contentLinksEmptyState"),
  contentLinksMatrix: document.querySelector("#contentLinksMatrix"),
  contentLinksMatrixHead: document.querySelector("#contentLinksMatrixHead"),
  contentLinksMatrixBody: document.querySelector("#contentLinksMatrixBody"),
  contentLinkDialog: document.querySelector("#contentLinkDialog"),
  contentLinkForm: document.querySelector("#contentLinkForm"),
  contentLinkBrand: document.querySelector("#contentLinkBrand"),
  contentLinkType: document.querySelector("#contentLinkType"),
  contentLinkBatch: document.querySelector("#contentLinkBatch"),
  contentLinkUrl: document.querySelector("#contentLinkUrl"),
  closeContentLinkDialogBtn: document.querySelector("#closeContentLinkDialogBtn"),
  cancelContentLinkDialogBtn: document.querySelector("#cancelContentLinkDialogBtn"),
  cardTemplate: document.querySelector("#contentCardTemplate")
};

const ACCESS_SESSION_KEY = "studio5WorkspaceSession";
const ACCESS_SESSION_DAYS = 30;
const MANUAL_SIGNOUT_KEY = "studio5ManualSignOut";
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
const signOutBtn = document.querySelector("#signOutBtn");

startAccessGate();

function startAccessGate() {
  toggleAccessCode?.addEventListener("click", () => {
    const revealing = accessCode.type === "password";
    accessCode.type = revealing ? "text" : "password";
    toggleAccessCode.textContent = revealing ? "Hide" : "Show";
  });

  accessForm?.addEventListener("submit", verifyAccessCode);
  signOutBtn?.addEventListener("click", async () => {
    signOutBtn.disabled = true;
    try {
      if (auth?.currentUser) await signOut(auth);
    } catch (error) {
      console.warn("Firebase sign-out warning:", error);
    } finally {
      // End the current workspace visit without deleting the remembered
      // 30-day device authorization stored in localStorage.
      sessionStorage.removeItem(ACCESS_SESSION_KEY);
      sessionStorage.setItem(MANUAL_SIGNOUT_KEY, "true");
      location.reload();
    }
  });

  const manuallySignedOut = sessionStorage.getItem(MANUAL_SIGNOUT_KEY) === "true";
  const session = getAccessSession();
  if (!manuallySignedOut && session?.expiresAt > Date.now()) unlockWorkspace();
  else {
    // Only remove an actually expired remembered authorization.
    if (session?.expiresAt && session.expiresAt <= Date.now()) {
      localStorage.removeItem(ACCESS_SESSION_KEY);
    }
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
    sessionStorage.removeItem(MANUAL_SIGNOUT_KEY);
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
    assetRequests: {},
    brandResources: {},
    contentLinks: {},
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
    assetRequests: data.assetRequests && typeof data.assetRequests === "object" ? data.assetRequests : {},
    brandResources: data.brandResources && typeof data.brandResources === "object" ? data.brandResources : {},
    contentLinks: data.contentLinks && typeof data.contentLinks === "object" ? data.contentLinks : {},
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
  renderAssetRequest();
  renderOverview();
  renderSpecialDays();
  renderBrandManagement();
  renderTargets();
  renderBrandResources();
  renderContentLinks();
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
      [`assetRequests/${key}`]: null,
      [`brandResources/${key}`]: null,
      [`contentLinks/${key}`]: null,
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

function getBrandResources(brand = currentBrand) {
  return remote.brandResources?.[brandKey(brand)] || null;
}

function renderBrandResources() {
  if (!els.brandResourcesForm) return;
  const resource = getBrandResources();
  els.brandNotes.value = resource?.notes || "";
  els.brandSopLink.value = resource?.sopLink || "";
  els.brandSopFile.value = "";
  const hasFile = Boolean(resource?.sopFile?.dataUrl);
  els.removeBrandSopFileBtn.classList.toggle("hidden", !hasFile);
  els.brandSopFileStatus.classList.toggle("hidden", !hasFile);
  if (hasFile) {
    const file = resource.sopFile;
    els.brandSopFileStatus.innerHTML = `<strong>Current SOP file: <a href="${escapeHtml(file.dataUrl)}" download="${escapeHtml(file.name || "SOP-file")}">${escapeHtml(file.name || "SOP file")}</a></strong><small>${formatFileSize(file.size || 0)} · Uploaded ${file.updatedAt ? new Date(file.updatedAt).toLocaleString() : "previously"}</small>`;
  } else {
    els.brandSopFileStatus.innerHTML = "";
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read the SOP file."));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

async function saveBrandResources(event) {
  event.preventDefault();
  const existing = getBrandResources() || {};
  const file = els.brandSopFile.files?.[0] || null;
  if (file && file.size > 2 * 1024 * 1024) return alert("Please upload an SOP file no larger than 2 MB.");
  setSyncStatus("saving", "Saving…");
  try {
    let sopFile = existing.sopFile || null;
    if (file) {
      sopFile = {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: await readFileAsDataUrl(file),
        updatedAt: Date.now(),
        updatedBy: auth.currentUser.uid
      };
    }
    const payload = {
      notes: els.brandNotes.value.trim(),
      sopLink: els.brandSopLink.value.trim(),
      sopFile,
      updatedAt: Date.now(),
      updatedBy: auth.currentUser.uid
    };
    const ok = await write(`brandResources/${brandKey(currentBrand)}`, payload, "Brand resources saved");
    if (ok) els.brandSopFile.value = "";
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
    alert(`Save failed: ${readableFirebaseError(error)}`);
  }
}

async function removeBrandSopFile() {
  const resource = getBrandResources();
  if (!resource?.sopFile || !confirm(`Remove the SOP file for ${currentBrand}? Notes and the SOP link will be kept.`)) return;
  const payload = { ...resource, sopFile: null, updatedAt: Date.now(), updatedBy: auth.currentUser.uid };
  await write(`brandResources/${brandKey(currentBrand)}`, payload, "SOP file removed");
}

async function deleteBrandResources() {
  const resource = getBrandResources();
  if (!resource) return alert("There are no saved notes or SOP resources for this brand.");
  if (!confirm(`Delete all saved notes, SOP link, and SOP file for ${currentBrand}?`)) return;
  setSyncStatus("saving", "Saving…");
  try {
    await remove(ref(db, `${ROOT_PATH}/brandResources/${brandKey(currentBrand)}`));
    setSyncStatus("saved", "Brand resources deleted");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
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
        assetRequests: imported.assetRequests || {},
        brandResources: imported.brandResources || {},
        contentLinks: imported.contentLinks || {},
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
  if (!confirm(`Reset all content and the new-assets response for ${currentBrand} in ${currentMonth}? Brand notes and SOP resources will be kept.`)) return;
  setSyncStatus("saving", "Saving…");
  try {
    const key = brandKey(currentBrand);
    await update(ref(db, ROOT_PATH), {
      [`calendar/${key}/${currentMonth}`]: null,
      [`assetRequests/${key}/${currentMonth}`]: null,
      "meta/updatedAt": serverTimestamp(),
      "meta/updatedBy": auth.currentUser.uid
    });
    setSyncStatus("saved", "Month reset saved");
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
    document.querySelector("#pageTitle").textContent = { calendar: "Monthly Content Calendar", special: "Special Days Calendar", overview: "Brand Overview", links: "Content Links", usecase: "Use Case Diagram", settings: "Settings" }[button.dataset.view];
  }));
  els.exportDataBtn.addEventListener("click", exportData);
  els.exportPdfBtn.addEventListener("click", exportPdf);
  els.exportWordBtn.addEventListener("click", exportWord);
  els.requestAssetsBtn.addEventListener("click", openAssetRequestDialog);
  els.assetRequestForm.addEventListener("submit", saveAssetRequest);
  els.closeAssetRequestBtn.addEventListener("click", closeAssetRequestDialog);
  els.cancelAssetRequestBtn.addEventListener("click", closeAssetRequestDialog);
  els.removeAssetRequestBtn.addEventListener("click", removeAssetRequest);
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
  els.deleteMonthSpecialDaysBtn?.addEventListener("click", deleteSpecialDaysForCurrentMonth);
  els.specialSearchInput.addEventListener("input", renderSpecialDays);
  els.specialCategoryFilter.addEventListener("change", renderSpecialDays);
  els.importDataInput.addEventListener("change", importData);
  els.resetMonthBtn.addEventListener("click", resetCurrentMonth);
  els.addBrandForm.addEventListener("submit", addBrand);
  els.saveTargetsBtn.addEventListener("click", saveTargets);
  els.brandResourcesForm.addEventListener("submit", saveBrandResources);
  els.removeBrandSopFileBtn.addEventListener("click", removeBrandSopFile);
  els.deleteBrandResourcesBtn.addEventListener("click", deleteBrandResources);
  els.addContentLinkBtn?.addEventListener("click", openContentLinkDialog);
  els.contentLinkForm?.addEventListener("submit", saveContentLink);
  els.closeContentLinkDialogBtn?.addEventListener("click", closeContentLinkDialog);
  els.cancelContentLinkDialogBtn?.addEventListener("click", closeContentLinkDialog);
  els.contentLinksSearchInput?.addEventListener("input", renderContentLinks);
  els.contentLinksBrandFilter?.addEventListener("change", renderContentLinks);
}


function getContentLinks() {
  const records = [];
  for (const brand of getBrandNames()) {
    const items = remote.contentLinks?.[brandKey(brand)] || {};
    for (const [id, item] of Object.entries(items)) {
      if (item && typeof item === "object") records.push({ id, brand, ...item });
    }
  }
  return records;
}

function contentTypeRank(value) {
  const order = ["Carousels", "Reels", "Static", "Talking Head", "Other"];
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

function renderContentLinks() {
  if (!els.contentLinksMatrix) return;
  const brands = getBrandNames();
  const selectedBrand = els.contentLinksBrandFilter?.value || "all";
  if (els.contentLinksBrandFilter) {
    const previous = selectedBrand;
    els.contentLinksBrandFilter.innerHTML = '<option value="all">All brands</option>' + brands.map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join("");
    els.contentLinksBrandFilter.value = brands.includes(previous) ? previous : "all";
  }
  if (els.contentLinkBrand) {
    const previousFormBrand = els.contentLinkBrand.value;
    els.contentLinkBrand.innerHTML = brands.map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join("");
    els.contentLinkBrand.value = brands.includes(previousFormBrand) ? previousFormBrand : currentBrand;
  }

  const query = (els.contentLinksSearchInput?.value || "").trim().toLowerCase();
  const activeBrandFilter = els.contentLinksBrandFilter?.value || "all";
  let records = getContentLinks().filter((record) => activeBrandFilter === "all" || record.brand === activeBrandFilter);
  if (query) {
    records = records.filter((record) => [record.brand, record.contentType, record.batchLabel, record.url].join(" ").toLowerCase().includes(query));
  }

  const labels = [];
  records.slice().sort((a, b) => Number(a.updatedAt || 0) - Number(b.updatedAt || 0)).forEach((record) => {
    const label = record.batchLabel || "Untitled Batch";
    if (!labels.includes(label)) labels.push(label);
  });

  const rowKeys = [];
  records.forEach((record) => {
    const key = `${record.brand}|||${record.contentType || "Other"}`;
    if (!rowKeys.includes(key)) rowKeys.push(key);
  });
  rowKeys.sort((a, b) => {
    const [brandA, typeA] = a.split("|||");
    const [brandB, typeB] = b.split("|||");
    return brandA.localeCompare(brandB) || contentTypeRank(typeA) - contentTypeRank(typeB) || typeA.localeCompare(typeB);
  });

  const hasRecords = records.length > 0;
  els.contentLinksEmptyState?.classList.toggle("hidden", hasRecords);
  els.contentLinksMatrix.classList.toggle("hidden", !hasRecords);
  if (!hasRecords) {
    els.contentLinksMatrixHead.innerHTML = "";
    els.contentLinksMatrixBody.innerHTML = "";
    return;
  }

  els.contentLinksMatrixHead.innerHTML = `<tr><th>Brand</th><th>Content</th>${labels.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>`;
  els.contentLinksMatrixBody.innerHTML = "";
  for (const key of rowKeys) {
    const [brand, contentType] = key.split("|||");
    const row = document.createElement("tr");
    const brandCell = document.createElement("td");
    brandCell.textContent = brand;
    row.appendChild(brandCell);
    const typeCell = document.createElement("td");
    typeCell.textContent = contentType;
    row.appendChild(typeCell);

    for (const label of labels) {
      const cell = document.createElement("td");
      cell.className = "content-link-cell";
      const matches = records.filter((record) => record.brand === brand && (record.contentType || "Other") === contentType && (record.batchLabel || "Untitled Batch") === label);
      if (matches.length) {
        cell.classList.add("has-links");
        const list = document.createElement("div");
        list.className = "content-link-list";
        matches.forEach((record, index) => {
          const entry = document.createElement("div");
          entry.className = "content-link-entry";
          const anchor = document.createElement("a");
          anchor.href = record.url;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = matches.length > 1 ? `Open link ${index + 1}` : "Open link";
          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "content-link-delete";
          deleteButton.title = "Delete this link";
          deleteButton.setAttribute("aria-label", `Delete ${label} link for ${brand}`);
          deleteButton.textContent = "×";
          deleteButton.addEventListener("click", () => deleteContentLink(record));
          entry.append(anchor, deleteButton);
          list.appendChild(entry);
        });
        cell.appendChild(list);
      }
      row.appendChild(cell);
    }
    els.contentLinksMatrixBody.appendChild(row);
  }
}

function openContentLinkDialog() {
  if (!els.contentLinkDialog) return;
  els.contentLinkForm.reset();
  renderContentLinks();
  els.contentLinkBrand.value = currentBrand;
  els.contentLinkType.value = "Carousels";
  els.contentLinkDialog.showModal();
}

function closeContentLinkDialog() {
  els.contentLinkDialog?.close();
}

async function saveContentLink(event) {
  event.preventDefault();
  const brand = els.contentLinkBrand.value;
  const batchLabel = els.contentLinkBatch.value.trim();
  const url = els.contentLinkUrl.value.trim();
  if (!brand || !batchLabel || !url) return;
  const id = crypto.randomUUID();
  const payload = {
    contentType: els.contentLinkType.value,
    batchLabel,
    url,
    updatedAt: Date.now(),
    updatedBy: auth.currentUser.uid
  };
  const ok = await write(`contentLinks/${brandKey(brand)}/${id}`, payload, "Content link saved");
  if (ok) closeContentLinkDialog();
}

async function deleteContentLink(record) {
  if (!record?.id || !record?.brand) return;
  if (!confirm(`Delete the ${record.batchLabel || "content"} link for ${record.brand}?`)) return;
  setSyncStatus("saving", "Deleting link…");
  try {
    await remove(ref(db, `${ROOT_PATH}/contentLinks/${brandKey(record.brand)}/${record.id}`));
    setSyncStatus("saved", "Content link deleted");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
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
    row.innerHTML = `<td>${item.date ? formatDate(item.date) : "—"}${item.repeat === "yearly" ? "<br><small>Repeats yearly</small>" : ""}</td><td class="special-day-name">${escapeHtml(item.name || "Untitled")}</td><td><span class="category-pill">${escapeHtml(item.category || "Other")}</span></td><td>${escapeHtml(item.market || "—")}</td><td class="special-day-notes">${escapeHtml(item.notes || "—")}</td><td><div class="special-day-row-actions"><button type="button" class="ghost-btn edit-special-day">Edit</button><button type="button" class="danger-btn delete-special-day">Delete</button></div></td>`;
    row.querySelector(".edit-special-day").addEventListener("click", () => openEditSpecialDayDialog(item.id));
    row.querySelector(".delete-special-day").addEventListener("click", () => deleteSpecialDayById(item.id, item.name));
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


async function deleteSpecialDayById(id, name = "this special day") {
  if (!id || !confirm(`Delete ${name || "this special day"}?`)) return;
  try {
    setSyncStatus("saving", "Saving…");
    await remove(ref(db, `${ROOT_PATH}/specialDays/${brandKey(currentBrand)}/${id}`));
    setSyncStatus("saved", "Special day deleted");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

async function deleteSpecialDaysForCurrentMonth() {
  const monthItems = getSpecialDays().filter((item) => String(item.date || "").slice(0, 7) === currentMonth);
  if (!monthItems.length) {
    alert(`There are no special days to delete for ${currentBrand} in ${monthLabel(currentMonth)}.`);
    return;
  }
  if (!confirm(`Delete all ${monthItems.length} special day${monthItems.length === 1 ? "" : "s"} for ${currentBrand} in ${monthLabel(currentMonth)}? This cannot be undone.`)) return;
  setSyncStatus("saving", "Deleting special days…");
  try {
    const updates = {};
    monthItems.forEach((item) => { updates[`specialDays/${brandKey(currentBrand)}/${item.id}`] = null; });
    updates["meta/updatedAt"] = serverTimestamp();
    updates["meta/updatedBy"] = auth.currentUser.uid;
    await update(ref(db, ROOT_PATH), updates);
    setSyncStatus("saved", "Month special days deleted");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
    alert(`Delete failed: ${readableFirebaseError(error)}`);
  }
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
      const brandNotes = getBrandResources(brand)?.notes || "";
      for (const [id, item] of Object.entries(items || {})) records.push({ recordType: "Content", brand, brandNotes, month, id, ...item });
    }
  }
  return records;
}

function getAllSpecialDayRecords() {
  const records = [];
  for (const brand of getBrandNames()) {
    const items = remote.specialDays?.[brandKey(brand)] || {};
    const brandNotes = getBrandResources(brand)?.notes || "";
    for (const [id, item] of Object.entries(items)) records.push({ recordType: "Special Day", brand, brandNotes, month: (item.date || "").slice(0, 7), id, ...item });
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
  const preferredHeaders = ["recordType","brand","brandNotes","month","id","batch","week","date","title","type","platform","pillar","contentFocus","assignee","caption","visual","link","status","notes","name","category","market","repeat","updatedAt","updatedBy"];
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


function getAssetRequest(brand = currentBrand, month = currentMonth) {
  return remote.assetRequests?.[brandKey(brand)]?.[month] || null;
}

function renderAssetRequest() {
  if (!els.assetRequestNotice) return;
  const request = getAssetRequest();
  if (!request) {
    els.assetRequestNotice.classList.add("hidden");
    els.assetRequestNotice.innerHTML = "";
    return;
  }
  const needed = request.needed === true;
  els.assetRequestNotice.classList.remove("hidden");
  els.assetRequestNotice.dataset.needed = needed ? "yes" : "no";
  els.assetRequestNotice.innerHTML = `<div><strong>${needed ? "New assets requested" : "No new assets required"}</strong><p>${escapeHtml(request.message || "")}</p></div><button type="button" class="ghost-btn asset-edit-btn">Edit response</button>`;
  els.assetRequestNotice.querySelector(".asset-edit-btn")?.addEventListener("click", openAssetRequestDialog);
}

function openAssetRequestDialog() {
  const request = getAssetRequest();
  els.assetRequestForm.reset();
  els.removeAssetRequestBtn.classList.toggle("hidden", !request);
  if (request) {
    const value = request.needed === true ? "yes" : "no";
    const radio = els.assetRequestForm.querySelector(`input[name="assetNeeded"][value="${value}"]`);
    if (radio) radio.checked = true;
    els.assetRequestMessage.value = request.message || "";
  }
  els.assetRequestDialog.showModal();
}

function closeAssetRequestDialog() {
  els.assetRequestDialog.close();
}

async function removeAssetRequest() {
  const request = getAssetRequest();
  if (!request || !confirm(`Remove the new-assets response for ${currentBrand} in ${monthLabel(currentMonth)}? You can add a new response again afterward.`)) return;
  setSyncStatus("saving", "Saving…");
  try {
    await remove(ref(db, `${ROOT_PATH}/assetRequests/${brandKey(currentBrand)}/${currentMonth}`));
    closeAssetRequestDialog();
    setSyncStatus("saved", "Asset response removed");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
  }
}

async function saveAssetRequest(event) {
  event.preventDefault();
  const selected = els.assetRequestForm.querySelector('input[name="assetNeeded"]:checked');
  if (!selected) return alert("Please choose Yes or No.");
  const message = els.assetRequestMessage.value.trim();
  if (!message) return alert("Please add a message for the client.");
  const payload = {
    needed: selected.value === "yes",
    message,
    updatedAt: Date.now(),
    updatedBy: auth.currentUser.uid
  };
  const ok = await write(`assetRequests/${brandKey(currentBrand)}/${currentMonth}`, payload, "Asset response saved");
  if (ok) closeAssetRequestDialog();
}

function getClientExportRecords() {
  return getMonthItems().slice().sort((a, b) => Number(a.week) - Number(b.week) || (a.date || "").localeCompare(b.date || ""));
}

function monthLabel(month) {
  const [year, monthNumber] = String(month).split("-").map(Number);
  return new Date(year, Math.max(0, monthNumber - 1), 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function buildExportHtml() {
  const items = getClientExportRecords();
  const asset = getAssetRequest();
  const brandNotes = getBrandResources()?.notes || "";
  const rows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>Week ${escapeHtml(item.week || "")}</td>
      <td>${escapeHtml(item.date ? formatDate(item.date) : "—")}</td>
      <td><strong>${escapeHtml(item.title || "Untitled")}</strong>${item.contentFocus ? `<div class="focus">${escapeHtml(item.contentFocus)}</div>` : ""}</td>
      <td>${escapeHtml(item.type || "—")}</td>
      <td>${escapeHtml(item.platform || "—")}</td>
      <td>${escapeHtml(item.pillar || "—")}</td>
      <td>${escapeHtml(item.status || "Pending")}</td>
    </tr>`).join("");
  const brandNotesBlock = brandNotes ? `<div class="brand-notes-box"><strong>Brand Notes</strong><p>${escapeHtml(brandNotes).replaceAll("\n", "<br>")}</p></div>` : "";
  const assetBlock = asset ? `<div class="asset-box"><strong>Asset Requirement: ${asset.needed ? "New assets requested" : "No new assets required"}</strong><p>${escapeHtml(asset.message || "")}</p></div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;color:#171412;margin:38px;font-size:10.5pt;line-height:1.45}h1{font-size:24pt;margin:0 0 4px}h2{font-size:12pt;color:#95161b;margin:0 0 24px;text-transform:uppercase;letter-spacing:.08em}.meta{border-top:3px solid #c52026;border-bottom:1px solid #ddd;padding:10px 0;margin-bottom:20px}.meta strong{display:inline-block;min-width:80px}.brand-notes-box{background:#f7f4ee;border-left:5px solid #513525;padding:12px 14px;margin:16px 0}.brand-notes-box p{margin:6px 0 0;white-space:normal}.asset-box{background:#fff8e5;border-left:5px solid #e4b82e;padding:12px 14px;margin:16px 0 22px}.asset-box p{margin:6px 0 0}table{width:100%;border-collapse:collapse}th{background:#111;color:#fff;text-align:left;padding:8px 7px;font-size:8.5pt}td{border-bottom:1px solid #ddd;padding:8px 7px;vertical-align:top}.focus{margin-top:4px;color:#655;font-size:9pt}.footer{margin-top:26px;padding-top:10px;border-top:1px solid #ddd;color:#777;font-size:8.5pt}</style></head><body>
    <h1>Proposed Content Plan</h1><h2>Studio 5 · Client Review Document</h2>
    <div class="meta"><div><strong>Brand:</strong> ${escapeHtml(currentBrand)}</div><div><strong>Month:</strong> ${escapeHtml(monthLabel(currentMonth))}</div><div><strong>Prepared:</strong> ${escapeHtml(new Date().toLocaleDateString())}</div><div><strong>Total:</strong> ${items.length} proposed content item${items.length === 1 ? "" : "s"}</div></div>
    ${brandNotesBlock}
    ${assetBlock}
    <table><thead><tr><th>#</th><th>Week</th><th>Date</th><th>Proposed Content</th><th>Type</th><th>Platform</th><th>Pillar</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="8">No proposed content has been added for this brand and month.</td></tr>'}</tbody></table>
    <div class="footer">This document is generated from the Studio 5 Content Calendar for client review and approval.</div>
  </body></html>`;
}

function exportWord() {
  const html = buildExportHtml();
  const filename = `Studio5-${safeFilename(currentBrand)}-${currentMonth}-Proposed-Content.doc`;
  downloadFile(html, filename, "application/msword;charset=utf-8");
}

async function exportPdf() {
  const items = getClientExportRecords();
  if (!items.length && !confirm("There is no content for this brand and month yet. Export an empty proposal anyway?")) return;
  setSyncStatus("saving", "Preparing PDF…");
  try {
    await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-lib");
    await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js", "jspdf-autotable-lib");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Proposed Content Plan", 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${currentBrand} · ${monthLabel(currentMonth)} · Prepared ${new Date().toLocaleDateString()}`, 14, 23);
    doc.setDrawColor(197, 32, 38);
    doc.setLineWidth(1.2);
    doc.line(14, 27, 283, 27);
    let startY = 32;
    const brandNotes = getBrandResources()?.notes || "";
    if (brandNotes) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(23);
      doc.text("Brand Notes", 14, startY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      const noteLines = doc.splitTextToSize(brandNotes, 260);
      doc.text(noteLines, 14, startY + 5);
      startY += 10 + noteLines.length * 4;
    }
    const asset = getAssetRequest();
    if (asset) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(23);
      doc.text(`Asset Requirement: ${asset.needed ? "New assets requested" : "No new assets required"}`, 14, startY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      const assetLines = doc.splitTextToSize(asset.message || "", 260);
      doc.text(assetLines, 14, startY + 5);
      startY += 10 + assetLines.length * 4;
    }
    doc.autoTable({
      startY,
      head: [["Week", "Date", "Proposed Content", "Type", "Platform", "Pillar", "Status"]],
      body: items.map((item) => [
        `Week ${item.week || ""}`,
        item.date ? formatDate(item.date) : "—",
        [item.title || "Untitled", item.contentFocus || ""].filter(Boolean).join("\n"),
        item.type || "—",
        item.platform || "—",
        item.pillar || "—",
        item.status || "Pending"
      ]),
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3, valign: "top" },
      headStyles: { fillColor: [17,17,17], textColor: [255,255,255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250,248,244] },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { cellWidth: 17 }, 1: { cellWidth: 27 }, 2: { cellWidth: 92 }, 3: { cellWidth: 29 }, 4: { cellWidth: 34 }, 5: { cellWidth: 34 }, 6: { cellWidth: 27 } },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Studio 5 · Client Review · Page ${pageCount}`, 14, 202);
      }
    });
    doc.save(`Studio5-${safeFilename(currentBrand)}-${currentMonth}-Proposed-Content.pdf`);
    setSyncStatus("saved", "PDF exported");
  } catch (error) {
    console.error("PDF export error:", error);
    setSyncStatus("error", "PDF export failed");
    alert("PDF export could not be prepared. Please check your connection and try again.");
  }
}

function loadScriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function safeFilename(value) {
  return String(value || "brand").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
}
