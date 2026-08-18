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

// Brand-specific suggested special days for 2026. These are curated content
// opportunities based on each brand category, not imported from an external sheet.
const BRAND_SPECIAL_DAY_SEEDS_2026 = {
  "Ely Roofing": [
    ["2026-03-23","World Meteorological Day","Awareness Day","Global","Weather-readiness content: roof inspections, storm damage prevention and seasonal maintenance."],
    ["2026-04-28","World Day for Safety and Health at Work","Awareness Day","Global","Highlight safe working practices, trained teams and responsible roofing standards."],
    ["2026-06-05","World Environment Day","Awareness Day","Global","Discuss durable roofing, insulation, energy efficiency and responsible material choices."],
    ["2026-10-31","Halloween","Seasonal Event","UK / Global","Light seasonal creative around scary leaks, roof problems or maintenance myths."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Optional lead-generation or winter roof-check campaign rather than forced discounting."]
  ],
  "TWF": [
    ["2026-03-08","International Women's Day","Awareness Day","Global","Celebrate women connected to the brand, customers, team or community where relevant."],
    ["2026-06-05","World Environment Day","Awareness Day","Global","Sustainability, responsible choices and behind-the-scenes brand practices."],
    ["2026-09-05","International Day of Charity","Awareness Day","Global","Community impact, partnerships or values-led storytelling."],
    ["2026-11-13","World Kindness Day","Awareness Day","Global","Customer appreciation, team recognition or community-focused content."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Promotional opportunity if commercially appropriate for the brand."]
  ],
  "Cottage Wellness": [
    ["2026-03-08","International Women's Day","Awareness Day","Global","Wellbeing-focused celebration of women and self-care."],
    ["2026-03-20","International Day of Happiness","Awareness Day","Global","Connect happiness with restorative wellbeing and everyday self-care."],
    ["2026-04-07","World Health Day","Awareness Day","Global","Educational wellness content and healthy-routine guidance."],
    ["2026-08-01","National Wellness Month","Awareness Day","UK / Global","Month-long wellness treatments, routines and restorative wellbeing content."],
    ["2026-08-15","National Relaxation Day","Awareness Day","UK / Global","Promote relaxation rituals, treatments and taking intentional time to reset."],
    ["2026-10-10","World Mental Health Day","Awareness Day","Global","Supportive wellbeing messaging; keep it useful and non-clinical."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Promotional treatment, gift or package content where appropriate."]
  ],
  "Bullens Jewellery": [
    ["2026-02-14","Valentine's Day","Seasonal Event","UK / Global","Romantic gifting, jewellery stories, proposals and meaningful pieces."],
    ["2026-03-15","Mother's Day (UK)","Seasonal Event","UK","Mother's Day gifting and sentimental jewellery storytelling."],
    ["2026-06-21","Father's Day (UK)","Seasonal Event","UK","Men's jewellery, watches or gifting content where relevant."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Gift-led promotional content and seasonal shopping campaign."],
    ["2026-12-25","Christmas Day","Seasonal Event","UK / Global","Festive brand message and jewellery gifting storytelling."]
  ],
  "N-Ergise": [
    ["2026-03-20","International Day of Happiness","Awareness Day","Global","Energy, positive routines, motivation and wellbeing-led brand content."],
    ["2026-04-07","World Health Day","Awareness Day","Global","Educational health and wellbeing content aligned with the brand offer."],
    ["2026-06-05","World Environment Day","Awareness Day","Global","Connect energy and sustainability themes where relevant."],
    ["2026-08-01","National Wellness Month","Awareness Day","UK / Global","A month of practical energy, wellness and healthy-routine content."],
    ["2026-10-10","World Mental Health Day","Awareness Day","Global","Supportive content around energy, balance and sustainable routines."]
  ],
  "Hemstocks Jewellery": [
    ["2026-02-14","Valentine's Day","Seasonal Event","UK / Global","Romantic jewellery gifting, proposals and meaningful keepsakes."],
    ["2026-03-15","Mother's Day (UK)","Seasonal Event","UK","Sentimental Mother's Day jewellery and gifting inspiration."],
    ["2026-06-21","Father's Day (UK)","Seasonal Event","UK","Men's jewellery and gifting where relevant."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Seasonal sales and Christmas gifting campaign opportunity."],
    ["2026-12-25","Christmas Day","Seasonal Event","UK / Global","Festive message, gifting inspiration and heirloom storytelling."]
  ],
  "Tannery": [
    ["2026-03-20","First Day of Spring","Seasonal Event","UK","Spring refresh, new-season products, styling or brand storytelling."],
    ["2026-06-05","World Environment Day","Awareness Day","Global","Craftsmanship, longevity, materials and sustainability where appropriate."],
    ["2026-09-22","First Day of Autumn","Seasonal Event","UK","Autumn collection, textures, seasonal styling and product storytelling."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Promotional or value-led seasonal campaign."],
    ["2026-12-25","Christmas Day","Seasonal Event","UK / Global","Festive gifting and brand message."]
  ],
  "Newrooms": [
    ["2026-03-20","First Day of Spring","Seasonal Event","UK","Spring interiors refresh, renovation inspiration and before/after content."],
    ["2026-06-05","World Environment Day","Awareness Day","Global","Energy-efficient spaces, durable design and responsible material choices."],
    ["2026-09-22","First Day of Autumn","Seasonal Event","UK","Cosy interiors, autumn renovation and home-improvement inspiration."],
    ["2026-10-31","Halloween","Seasonal Event","UK / Global","Playful before/after or 'scary interiors' creative if on-brand."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Offer or consultation-led campaign if commercially relevant."]
  ],
  "Blossoms": [
    ["2026-02-14","Valentine's Day","Seasonal Event","UK / Global","Romantic gifting, flowers and celebration-led content."],
    ["2026-03-15","Mother's Day (UK)","Seasonal Event","UK","Mother's Day gifting, appreciation and seasonal products."],
    ["2026-03-20","First Day of Spring","Seasonal Event","UK","Spring colour, fresh arrivals and seasonal inspiration."],
    ["2026-06-05","World Environment Day","Awareness Day","Global","Seasonality, sourcing, nature and sustainability content where relevant."],
    ["2026-12-25","Christmas Day","Seasonal Event","UK / Global","Festive arrangements, gifting and seasonal brand message."]
  ],
  "Dr Libby": [
    ["2026-02-04","World Cancer Day","Awareness Day","Global","Sensitive awareness content only where appropriate to the brand's professional scope."],
    ["2026-03-08","International Women's Day","Awareness Day","Global","Women's health, confidence or professional education where relevant."],
    ["2026-04-07","World Health Day","Awareness Day","Global","Evidence-led health education and practical guidance."],
    ["2026-10-10","World Mental Health Day","Awareness Day","Global","Supportive educational content within the brand's appropriate scope."],
    ["2026-11-13","World Kindness Day","Awareness Day","Global","Patient/community appreciation and compassionate care messaging."]
  ],
  "Poringland Dental": [
    ["2026-03-20","World Oral Health Day","Awareness Day","Global","Core educational opportunity: prevention, hygiene, check-ups and oral-health habits."],
    ["2026-04-07","World Health Day","Awareness Day","Global","Connect oral health with wider health and preventive care."],
    ["2026-06-15","National Smile Month","Awareness Day","UK","Smile confidence, hygiene education, team tips and patient-friendly content."],
    ["2026-10-31","Halloween","Seasonal Event","UK / Global","Sugar, sweets and tooth-care tips with a light seasonal angle."],
    ["2026-11-13","World Kindness Day","Awareness Day","Global","Patient appreciation, team culture and gentle-dentistry messaging."]
  ],
  "Pollard and Read": [
    ["2026-02-14","Valentine's Day","Seasonal Event","UK / Global","Romantic gifting, engagement rings and meaningful jewellery stories."],
    ["2026-03-15","Mother's Day (UK)","Seasonal Event","UK","Sentimental gifting and family jewellery stories."],
    ["2026-06-21","Father's Day (UK)","Seasonal Event","UK","Men's jewellery, watches and gifting where relevant."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Christmas shopping, gifting and promotional campaign opportunity."],
    ["2026-12-25","Christmas Day","Seasonal Event","UK / Global","Festive message, gifting and celebration content."]
  ],
  "Studio 5": [
    ["2026-06-30","World Social Media Day","Awareness Day","Global","Showcase strategy, content creation, social trends and client work."],
    ["2026-09-21","World Gratitude Day","Awareness Day","Global","Client appreciation, team recognition and community storytelling."],
    ["2026-11-13","World Kindness Day","Awareness Day","Global","Celebrate team culture, clients and positive partnerships."],
    ["2026-11-27","Black Friday","Seasonal Event","UK / Global","Campaign-planning insight, creative examples and client marketing reminders."],
    ["2026-12-31","New Year's Eve","Seasonal Event","UK / Global","Year-in-review, campaign highlights and next-year planning content."]
  ]
};

const ROOT_PATH = "sharedMonthlyContentCalendarV2";

let app;
let auth;
let db;
let rootRef;
let unsubscribeRoot = null;
let remote = { brands: {}, targets: DEFAULT_TARGETS, calendar: {}, specialDays: {}, assetRequests: {}, brandResources: {}, brandBibles: {}, sopResources: {}, contentLinks: {} };
let currentBrand = DEFAULT_BRANDS[0];
let currentMonth = getCurrentMonth();
let editingId = null;
let editingSpecialDayId = null;
let editingQcId = null;
let currentLayout = "board";
let connected = false;

const els = {
  brandSelect: document.querySelector("#brandSelect"),
  monthPicker: document.querySelector("#monthPicker"),
  calendarBoard: document.querySelector("#calendarBoard"),
  calendarTableWrap: document.querySelector("#calendarTableWrap"),
  calendarTableBody: document.querySelector("#calendarTableBody"),
  qcQueue: document.querySelector("#qcQueue"),
  qcStageFilter: document.querySelector("#qcStageFilter"),
  qcTypeFilter: document.querySelector("#qcTypeFilter"),
  qcSearchInput: document.querySelector("#qcSearchInput"),
  qcSummaryMini: document.querySelector("#qcSummaryMini"),
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
    await ensureBrandSpecialDays2026();
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
    brandBibles: {},
    sopResources: {},
    meta: { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  });
}

async function ensureBrandSpecialDays2026() {
  const snapshot = await get(rootRef);
  const data = snapshot.val() || {};
  const brands = data.brands && typeof data.brands === "object" ? data.brands : {};
  const specialDays = data.specialDays && typeof data.specialDays === "object" ? data.specialDays : {};
  const updates = {};

  for (const [key, entry] of Object.entries(brands)) {
    const brandName = typeof entry === "string" ? entry : entry?.name;
    const seeds = BRAND_SPECIAL_DAY_SEEDS_2026[brandName] || [];
    if (!brandName || !seeds.length) continue;
    const existing = specialDays[key] && typeof specialDays[key] === "object" ? specialDays[key] : {};
    const signatures = new Set(Object.values(existing).map((item) => `${item?.date || ""}|||${String(item?.name || "").trim().toLowerCase()}`));
    for (const [date, name, category, market, notes] of seeds) {
      const signature = `${date}|||${name.toLowerCase()}`;
      if (signatures.has(signature)) continue;
      const id = `brand-seed-${date}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      if (existing[id]) continue;
      updates[`specialDays/${key}/${id}`] = { date, name, category, market, repeat: "yearly", notes, seeded: true, seedSource: "brand-curated-2026", updatedAt: Date.now(), updatedBy: auth.currentUser.uid };
    }
  }
  if (!Object.keys(updates).length) return;
  updates["meta/updatedAt"] = serverTimestamp();
  updates["meta/updatedBy"] = auth.currentUser.uid;
  await update(ref(db, ROOT_PATH), updates);
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
    brandBibles: data.brandBibles && typeof data.brandBibles === "object" ? data.brandBibles : {},
    sopResources: data.sopResources && typeof data.sopResources === "object" ? data.sopResources : {},
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
  renderQualityControl();
  renderAssetRequest();
  renderOverview();
  renderSpecialDays();
  renderBrandManagement();
  renderTargets();
  renderBrandResources();
  renderContentLinks();
  renderBrandBibleReminder();
  renderSopResources();
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
  node.querySelector(".card-title").insertAdjacentHTML("afterend", `<span class="ready-pill qc-stage-pill" data-stage="${escapeHtml(qcStageKey(item))}">QC: ${escapeHtml(qcStageLabel(item))}</span>`);
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
      row.innerHTML = `<td>Week ${escapeHtml(item.week)}</td><td>${item.date ? formatDate(item.date) : "—"}</td><td><strong>${escapeHtml(item.title || "Untitled")}</strong><br><small>${escapeHtml(item.pillar || "")}</small></td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.platform || "—")}</td><td><span class="status-pill" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span><br><span class="table-qc-status">QC: ${escapeHtml(qcStageLabel(item))}</span></td><td>${escapeHtml(item.notes || "—")}</td><td><button class="ghost-btn table-edit">Edit</button></td>`;
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
  renderContentBrandRules();
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
    contentGoal: item.contentGoal || "",
    productFocus: item.productFocus || "",
    contentHook: item.hook || "",
    audienceBenefit: item.audienceBenefit || "",
    contentCta: item.cta || "",
    requiredAssets: item.requiredAssets || "",
    referenceContent: item.referenceContent || "",
    avoidContent: item.avoidContent || "",
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
  renderContentBrandRules();
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
    contentGoal: document.querySelector("#contentGoal").value.trim(),
    productFocus: document.querySelector("#productFocus").value.trim(),
    hook: document.querySelector("#contentHook").value.trim(),
    audienceBenefit: document.querySelector("#audienceBenefit").value.trim(),
    cta: document.querySelector("#contentCta").value.trim(),
    requiredAssets: document.querySelector("#requiredAssets").value.trim(),
    referenceContent: document.querySelector("#referenceContent").value.trim(),
    avoidContent: document.querySelector("#avoidContent").value.trim(),
    qc: editingId ? (getMonthItems().find((entry) => entry.id === editingId)?.qc || defaultQcState(document.querySelector("#contentType").value)) : defaultQcState(document.querySelector("#contentType").value),
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
        brandBibles: imported.brandBibles || {},
        sopResources: imported.sopResources || {},
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
  [els.qcStageFilter, els.qcTypeFilter].forEach((el) => el?.addEventListener("change", renderQualityControl));
  els.qcSearchInput?.addEventListener("input", renderQualityControl);
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
    document.querySelector("#pageTitle").textContent = { calendar: "Monthly Content Calendar", qc: "Quality Control", special: "Special Days Calendar", overview: "Brand Overview", links: "Content Links", usecase: "Use Case Diagram", sop: "SOP Library", settings: "Settings" }[button.dataset.view];
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
  els.brandResourcesForm?.addEventListener("submit", saveBrandResources);
  els.removeBrandSopFileBtn?.addEventListener("click", removeBrandSopFile);
  els.deleteBrandResourcesBtn?.addEventListener("click", deleteBrandResources);
  els.addContentLinkBtn?.addEventListener("click", openContentLinkDialog);
  els.contentLinkForm?.addEventListener("submit", saveContentLink);
  els.closeContentLinkDialogBtn?.addEventListener("click", closeContentLinkDialog);
  els.cancelContentLinkDialogBtn?.addEventListener("click", closeContentLinkDialog);
  els.contentLinksSearchInput?.addEventListener("input", renderContentLinks);
  els.contentLinksBrandFilter?.addEventListener("change", renderContentLinks);
  document.querySelector("#brandBibleBtn")?.addEventListener("click", openBrandBible);
  document.querySelector("#brandBibleForm")?.addEventListener("submit", saveBrandBible);
  document.querySelector("#closeBrandBibleBtn")?.addEventListener("click", () => document.querySelector("#brandBibleDialog").close());
  document.querySelector("#cancelBrandBibleBtn")?.addEventListener("click", () => document.querySelector("#brandBibleDialog").close());
  document.querySelector("#addSopResourceBtn")?.addEventListener("click", openSopResourceDialog);
  document.querySelector("#sopResourceForm")?.addEventListener("submit", saveSopResource);
  document.querySelector("#closeSopResourceBtn")?.addEventListener("click", closeSopResourceDialog);
  document.querySelector("#cancelSopResourceBtn")?.addEventListener("click", closeSopResourceDialog);
  document.querySelector("#sopResourceType")?.addEventListener("change", updateSopResourceFields);
  bindStageQcDialogs();
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
          deleteButton.textContent = "Delete";
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
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const bottomMargin = 16;
    let y = 16;

    const addPageFooter = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Studio 5 · ${currentBrand} · ${monthLabel(currentMonth)}`, margin, pageHeight - 8);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    };

    const ensureSpace = (needed = 20) => {
      if (y + needed > pageHeight - bottomMargin) {
        addPageFooter();
        doc.addPage();
        y = 16;
      }
    };

    const drawLabelValue = (label, value, options = {}) => {
      const text = String(value || "—");
      const labelWidth = options.labelWidth || 35;
      const valueX = margin + labelWidth;
      const valueWidth = contentWidth - labelWidth;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(45);
      const labelLines = doc.splitTextToSize(label, labelWidth - 3);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      const valueLines = doc.splitTextToSize(text, valueWidth);
      const lineCount = Math.max(labelLines.length, valueLines.length);
      const rowHeight = Math.max(6, lineCount * 4.2 + 2);

      ensureSpace(rowHeight + 1);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(45);
      doc.text(labelLines, margin, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      if (options.link && value && value !== "—") {
        doc.setTextColor(30, 85, 180);
        doc.textWithLink(valueLines[0], valueX, y + 4, { url: value });
        if (valueLines.length > 1) {
          doc.text(valueLines.slice(1), valueX, y + 8.2);
        }
      } else {
        doc.text(valueLines, valueX, y + 4);
      }

      doc.setDrawColor(232);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
      y += rowHeight + 1.5;
    };

    // Cover / document header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17);
    doc.text("Content Plan - Full Details", margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(95);
    doc.text(`${currentBrand} · ${monthLabel(currentMonth)} · Prepared ${new Date().toLocaleDateString()}`, margin, y);
    y += 5;

    doc.setDrawColor(197, 32, 38);
    doc.setLineWidth(1.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const brandNotes = getBrandResources()?.notes || "";
    if (brandNotes) {
      doc.setFillColor(247, 244, 238);
      const noteLines = doc.splitTextToSize(brandNotes, contentWidth - 10);
      const boxHeight = 11 + noteLines.length * 4.2;
      ensureSpace(boxHeight);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50);
      doc.text("Brand Notes", margin + 5, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(noteLines, margin + 5, y + 11);
      y += boxHeight + 5;
    }

    const asset = getAssetRequest();
    if (asset) {
      const assetTitle = asset.needed ? "Asset Requirement: New assets requested" : "Asset Requirement: No new assets required";
      const assetLines = doc.splitTextToSize(asset.message || "", contentWidth - 10);
      const boxHeight = 11 + assetLines.length * 4.2;
      ensureSpace(boxHeight);
      doc.setFillColor(255, 248, 229);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(70);
      doc.text(assetTitle, margin + 5, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text(assetLines, margin + 5, y + 11);
      y += boxHeight + 7;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`Total content items: ${items.length}`, margin, y);
    y += 8;

    if (!items.length) {
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text("No content has been added for this brand and month.", margin, y);
    }

    items.forEach((item, index) => {
      ensureSpace(34);

      // Content item heading
      doc.setFillColor(17, 17, 17);
      doc.roundedRect(margin, y, contentWidth, 13, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255);
      const heading = `${index + 1}. ${item.title || "Untitled Content"}`;
      const headingLines = doc.splitTextToSize(heading, contentWidth - 8);
      doc.text(headingLines[0], margin + 4, y + 8.5);
      y += 17;

      drawLabelValue("Week", item.week ? `Week ${item.week}` : "—");
      drawLabelValue("Publish Date", item.date ? formatDate(item.date) : "—");
      drawLabelValue("Content Title / Topic", item.title || "—");
      drawLabelValue("Content Category", item.type || "—");
      drawLabelValue("Content Focus / Content Text", item.contentFocus || "—");
      drawLabelValue("Batch", item.batch || "—");
      drawLabelValue("Platform", item.platform || "—");
      drawLabelValue("Content Pillar", item.pillar || "—");
      drawLabelValue("Assigned To", item.assignee || "—");
      drawLabelValue("Caption / Content Copy", item.caption || "—");
      drawLabelValue("Visual Direction / Reel Notes", item.visual || "—");
      drawLabelValue("Reference Link", item.link || "—", { link: true });
      drawLabelValue("Approval Status", item.status || "Pending");
      drawLabelValue("Client Notes", item.notes || "—");

      y += 7;
    });

    addPageFooter();
    doc.save(`Studio5-${safeFilename(currentBrand)}-${currentMonth}-Full-Content-Details.pdf`);
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



// ===== Dedicated Quality Control workspace =====
const QC_STAGE_ORDER = ["creator", "internal", "nicole"];
const QC_STAGE_LABELS = { creator: "Creator Check", internal: "Internal Review", nicole: "Nicole / Lead Approval" };

function stageDefaultItems(type = "") {
  return [...DEFAULT_QC, ...(type === "Reel" ? REEL_QC : [])].map((label) => ({ label, checked: false }));
}

function defaultQcState(type = "") {
  return {
    creator: { items: stageDefaultItems(type), completed: false, outcome: "", failureReason: "", notes: "" },
    internal: { items: stageDefaultItems(type), completed: false, outcome: "", failureReason: "", notes: "" },
    nicole: { items: stageDefaultItems(type), completed: false, outcome: "", failureReason: "", notes: "" },
    proceedToCreate: false,
    overallOutcome: ""
  };
}

function normalizedQc(item) {
  const type = item?.type || "";
  const q = item?.qc && typeof item.qc === "object" ? item.qc : {};
  if (q.creator || q.internal || q.nicole) {
    const base = defaultQcState(type);
    for (const stage of QC_STAGE_ORDER) {
      const src = q[stage] && typeof q[stage] === "object" ? q[stage] : {};
      const rawItems = Array.isArray(src.items) ? src.items : (src.items && typeof src.items === "object" ? Object.values(src.items) : base[stage].items);
      base[stage] = {
        items: rawItems.map((x) => ({ label: String(x?.label || ""), checked: !!x?.checked })).filter((x) => x.label),
        completed: !!src.completed,
        outcome: src.outcome || (src.completed ? "approved" : ""),
        failureReason: src.failureReason || "",
        notes: src.notes || ""
      };
    }
    base.proceedToCreate = !!q.proceedToCreate;
    base.overallOutcome = q.overallOutcome || "";
    return base;
  }

  // Backward compatibility with the original single-window QC records.
  const legacyItems = Array.isArray(q.items) ? q.items : (q.items && typeof q.items === "object" ? Object.values(q.items) : stageDefaultItems(type));
  const legacyRows = legacyItems.map((x) => ({ label: String(x?.label || ""), checked: !!x?.checked })).filter((x) => x.label);
  const base = defaultQcState(type);
  base.creator.items = legacyRows.length ? legacyRows : stageDefaultItems(type);
  base.creator.completed = !!q.creatorCheck;
  base.creator.outcome = q.creatorCheck ? "approved" : "";
  base.internal.completed = !!q.internalReview;
  base.internal.outcome = q.internalReview ? "approved" : "";
  base.nicole.completed = !!q.leadApproval;
  base.nicole.outcome = q.leadApproval ? "approved" : "";
  if (q.failureReason) {
    const target = !q.creatorCheck ? "creator" : !q.internalReview ? "internal" : "nicole";
    base[target].failureReason = q.failureReason;
    base[target].outcome = "revise";
    base.overallOutcome = "revise";
  }
  base.proceedToCreate = !!q.readyForClient;
  return base;
}

function qcStageKey(item) {
  const q = normalizedQc(item);
  if (q.overallOutcome === "rejected" || QC_STAGE_ORDER.some((stage) => q[stage].outcome === "rejected")) return "rejected";
  if (q.overallOutcome === "revise" || QC_STAGE_ORDER.some((stage) => q[stage].outcome === "revise")) return "revision";
  if (q.proceedToCreate) return "ready";
  if (!q.creator.completed) return "creator";
  if (!q.internal.completed) return "internal";
  if (!q.nicole.completed) return "lead";
  return "lead";
}

function qcStageLabel(item) {
  return { creator: "Creator Check", internal: "Internal Review", lead: "Nicole Approval", ready: "Proceed to Create", revision: "Needs Revision", rejected: "Rejected" }[qcStageKey(item)] || "Creator Check";
}

function renderQualityControl() {
  if (!els.qcQueue) return;
  const items = getMonthItems();
  const stage = els.qcStageFilter?.value || "all";
  const type = els.qcTypeFilter?.value || "all";
  const query = (els.qcSearchInput?.value || "").trim().toLowerCase();
  const filtered = items.filter((item) => {
    const stageMatch = stage === "all" || qcStageKey(item) === stage;
    const typeMatch = type === "all" || item.type === type;
    const haystack = [item.title, item.hook, item.productFocus, item.assignee, item.caption, item.contentGoal].join(" ").toLowerCase();
    return stageMatch && typeMatch && (!query || haystack.includes(query));
  }).sort((a, b) => (qcStageKey(a) === "ready" ? 1 : 0) - (qcStageKey(b) === "ready" ? 1 : 0) || Number(a.week) - Number(b.week) || (a.date || "").localeCompare(b.date || ""));

  const counts = { creator: 0, internal: 0, lead: 0, ready: 0, revision: 0, rejected: 0 };
  items.forEach((item) => { counts[qcStageKey(item)] = (counts[qcStageKey(item)] || 0) + 1; });
  if (els.qcSummaryMini) els.qcSummaryMini.innerHTML = `<span>${counts.creator} creator</span><span>${counts.internal} internal</span><span>${counts.lead} Nicole</span><span>${counts.ready} proceed</span><span>${counts.revision} revise</span><span>${counts.rejected} rejected</span>`;

  els.qcQueue.innerHTML = "";
  if (!filtered.length) {
    els.qcQueue.innerHTML = '<div class="qc-empty-state">No content matches this QC filter for the selected brand and month.</div>';
    return;
  }

  filtered.forEach((item) => {
    const q = normalizedQc(item);
    const activeKey = qcStageKey(item);
    const stageStatus = (key) => q[key].outcome === "rejected" ? "Rejected" : q[key].outcome === "revise" ? "Needs Revision" : q[key].completed ? "Approved" : "Pending";
    const totalChecks = QC_STAGE_ORDER.reduce((sum, key) => sum + q[key].items.length, 0);
    const checkedChecks = QC_STAGE_ORDER.reduce((sum, key) => sum + q[key].items.filter((x) => x.checked).length, 0);
    const card = document.createElement("article");
    card.className = "qc-queue-card qc-stage-card";
    card.dataset.stage = activeKey;
    card.innerHTML = `<div class="qc-card-main"><div class="qc-card-top"><span class="type-badge" data-type="${escapeHtml(item.type || "")}">${escapeHtml(item.type || "Content")}</span><span class="qc-stage-badge" data-stage="${escapeHtml(activeKey)}">${escapeHtml(qcStageLabel(item))}</span></div><h4>${escapeHtml(item.title || "Untitled content")}</h4><p>${escapeHtml(item.productFocus || item.contentFocus || item.contentGoal || "No strategy focus added.")}</p><div class="qc-card-meta"><span>Week ${escapeHtml(item.week || "—")}</span><span>${escapeHtml(item.date ? formatDate(item.date) : "No date")}</span><span>${escapeHtml(item.assignee || "Unassigned")}</span></div><div class="qc-stage-window-grid"><button type="button" class="ghost-btn qc-stage-open" data-stage="creator"><strong>Creator</strong><span>${escapeHtml(stageStatus("creator"))}</span></button><button type="button" class="ghost-btn qc-stage-open" data-stage="internal" ${!q.creator.completed ? "disabled" : ""}><strong>Internal</strong><span>${escapeHtml(stageStatus("internal"))}</span></button><button type="button" class="ghost-btn qc-stage-open" data-stage="nicole" ${!q.internal.completed ? "disabled" : ""}><strong>Nicole</strong><span>${escapeHtml(stageStatus("nicole"))}</span></button></div></div><div class="qc-card-progress"><strong>${checkedChecks}/${totalChecks || 0}</strong><small>checks across all stages</small><div class="progress"><span style="width:${percent(checkedChecks, totalChecks || 1)}"></span></div><div class="qc-calendar-status">Calendar: <b>${escapeHtml(item.status || "Pending")}</b></div>${q.proceedToCreate ? '<div class="qc-proceed-note">✓ Approved — proceed to create</div>' : ""}</div>`;
    card.querySelectorAll(".qc-stage-open").forEach((button) => button.addEventListener("click", () => openStageQcDialog(item.id, button.dataset.stage)));
    els.qcQueue.appendChild(card);
  });
}

function qcContextHtml(item) {
  return `<div><span>Content Goal</span><strong>${escapeHtml(item.contentGoal || "—")}</strong></div><div><span>Product / Service Focus</span><strong>${escapeHtml(item.productFocus || item.contentFocus || "—")}</strong></div><div><span>Hook</span><strong>${escapeHtml(item.hook || "—")}</strong></div><div><span>Why should they care?</span><strong>${escapeHtml(item.audienceBenefit || "—")}</strong></div><div><span>Content Direction</span><strong>${escapeHtml(item.contentFocus || "—")}</strong></div><div><span>CTA</span><strong>${escapeHtml(item.cta || "—")}</strong></div><div><span>Required Assets</span><strong>${escapeHtml(item.requiredAssets || "—")}</strong></div><div><span>Do Not Use / Avoid</span><strong>${escapeHtml(item.avoidContent || "—")}</strong></div>`;
}

function qcBrandRulesHtml() {
  const entries = bibleEntries();
  if (!entries.length) return '<strong>Brand Bible</strong><p>No Brand Bible rules saved yet for this brand.</p>';
  return `<div class="content-rules-head"><strong>${escapeHtml(currentBrand)} Brand Bible</strong><span>Review before approving</span></div>${entries.map((entry) => `<div><strong>${escapeHtml(entry.section || entry.category || "Brand Rule")}:</strong> ${escapeHtml(entry.text || entry.note || "")}</div>`).join("")}`;
}

function stageDialog(stage) {
  return document.querySelector(`#${stage === "nicole" ? "nicole" : stage}QcDialog`);
}

function openStageQcDialog(id, stage) {
  const item = getMonthItems().find((entry) => entry.id === id);
  if (!item || !QC_STAGE_ORDER.includes(stage)) return;
  const q = normalizedQc(item);
  if (stage === "internal" && !q.creator.completed) return alert("Creator Check must be approved first.");
  if (stage === "nicole" && !q.internal.completed) return alert("Internal Review must be approved first.");
  editingQcId = id;
  const dialog = stageDialog(stage);
  if (!dialog) return;
  dialog.querySelector(".modal-header h3").textContent = `${QC_STAGE_LABELS[stage]} — ${item.title || "Review Content"}`;
  dialog.querySelector(".stage-qc-context").innerHTML = qcContextHtml(item);
  dialog.querySelector(".stage-qc-brand-rules").innerHTML = qcBrandRulesHtml();
  loadStageQc(dialog, item, stage);
  dialog.showModal();
}

function closeStageQcDialog(dialog) {
  dialog?.close();
  editingQcId = null;
}

function ensureStageRows(stageData, type) {
  const rows = Array.isArray(stageData?.items) ? stageData.items : [];
  const labels = new Set(rows.map((x) => x.label));
  const merged = [...rows];
  [...DEFAULT_QC, ...(type === "Reel" ? REEL_QC : [])].forEach((label) => {
    if (!labels.has(label)) merged.push({ label, checked: false });
  });
  return merged;
}

function addStageQcRow(dialog, label = "", checked = false) {
  const list = dialog.querySelector(".stage-qc-checklist");
  const row = document.createElement("div");
  row.className = "qc-row";
  row.innerHTML = `<label><input type="checkbox" class="qc-check" ${checked ? "checked" : ""}><input type="text" class="qc-label" value="${escapeHtml(label)}" placeholder="QC check..."></label><button type="button" class="danger-btn qc-delete">Delete</button>`;
  row.querySelector(".qc-delete").addEventListener("click", () => { row.remove(); updateStageQcMessage(dialog); });
  row.querySelector(".qc-check").addEventListener("change", () => updateStageQcMessage(dialog));
  list.appendChild(row);
}

function loadStageQc(dialog, item, stage) {
  const q = normalizedQc(item);
  const stageData = q[stage];
  const list = dialog.querySelector(".stage-qc-checklist");
  list.innerHTML = "";
  ensureStageRows(stageData, item.type).forEach((x) => addStageQcRow(dialog, x.label || "", !!x.checked));
  dialog.querySelector(".stage-failure-reason").value = stageData.failureReason || "";
  dialog.querySelector(".stage-review-notes").value = stageData.notes || "";
  updateStageQcMessage(dialog);
}

function collectStageQc(dialog) {
  return {
    items: [...dialog.querySelectorAll(".qc-row")].map((row) => ({ label: row.querySelector(".qc-label").value.trim(), checked: row.querySelector(".qc-check").checked })).filter((x) => x.label),
    failureReason: dialog.querySelector(".stage-failure-reason").value,
    notes: dialog.querySelector(".stage-review-notes").value.trim()
  };
}

function stageChecksComplete(dialog) {
  const rows = [...dialog.querySelectorAll(".qc-row")];
  return rows.length > 0 && rows.every((row) => row.querySelector(".qc-check").checked);
}

function updateStageQcMessage(dialog) {
  const msg = dialog.querySelector(".stage-qc-message");
  const approve = dialog.querySelector(".stage-approve");
  const complete = stageChecksComplete(dialog);
  approve.disabled = !complete;
  msg.textContent = complete ? "All checks are complete. This stage can now be approved." : "Complete every required check before approving this stage. You can still save progress or send the item for revision/rejection.";
}

function resetFollowingStages(q, stage) {
  const index = QC_STAGE_ORDER.indexOf(stage);
  QC_STAGE_ORDER.slice(index + 1).forEach((key) => {
    q[key].completed = false;
    q[key].outcome = "";
    q[key].failureReason = "";
    q[key].notes = "";
    q[key].items = q[key].items.map((x) => ({ ...x, checked: false }));
  });
  q.proceedToCreate = false;
}

async function saveStageQc(dialog, outcome = "progress") {
  if (!editingQcId) return;
  const stage = dialog.dataset.qcStage;
  const item = getMonthItems().find((entry) => entry.id === editingQcId);
  if (!item) return;
  const q = normalizedQc(item);
  const collected = collectStageQc(dialog);
  q[stage].items = collected.items;
  q[stage].failureReason = collected.failureReason;
  q[stage].notes = collected.notes;

  let calendarStatus = item.status || "Pending";
  if (outcome === "approved") {
    if (!stageChecksComplete(dialog)) return alert("Please complete every QC check before approving this stage.");
    q[stage].completed = true;
    q[stage].outcome = "approved";
    q[stage].failureReason = "";
    q.overallOutcome = "";
    if (calendarStatus === "Revise" || calendarStatus === "Rejected") calendarStatus = "Pending";
    if (stage === "nicole") {
      q.proceedToCreate = true;
      calendarStatus = "Approved";
    }
  } else if (outcome === "revise" || outcome === "rejected") {
    if (!collected.failureReason) return alert("Please select a revision / rejection reason first.");
    q[stage].completed = false;
    q[stage].outcome = outcome;
    q.overallOutcome = outcome;
    resetFollowingStages(q, stage);
    calendarStatus = outcome === "rejected" ? "Rejected" : "Revise";
  }

  const itemRef = ref(db, `${ROOT_PATH}/calendar/${brandKey(currentBrand)}/${currentMonth}/${editingQcId}`);
  setSyncStatus("saving", "Saving QC...");
  try {
    await update(itemRef, { qc: q, status: calendarStatus, updatedAt: Date.now(), updatedBy: auth.currentUser.uid });
    await update(ref(db, `${ROOT_PATH}/meta`), { updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
    setSyncStatus("saved", outcome === "approved" && stage === "nicole" ? "Approved — proceed to create" : "QC saved");
    closeStageQcDialog(dialog);
  } catch (error) {
    console.error(error);
    setSyncStatus("error", readableFirebaseError(error));
    alert(`QC save failed: ${readableFirebaseError(error)}`);
  }
}

function bindStageQcDialogs() {
  document.querySelectorAll(".stage-qc-dialog").forEach((dialog) => {
    dialog.querySelector(".qc-close-btn")?.addEventListener("click", () => closeStageQcDialog(dialog));
    dialog.querySelector(".qc-cancel-btn")?.addEventListener("click", () => closeStageQcDialog(dialog));
    dialog.querySelector(".stage-add-qc")?.addEventListener("click", () => addStageQcRow(dialog, "", false));
    dialog.querySelector(".stage-approve")?.addEventListener("click", () => saveStageQc(dialog, "approved"));
    dialog.querySelector(".stage-revise")?.addEventListener("click", () => saveStageQc(dialog, "revise"));
    dialog.querySelector(".stage-reject")?.addEventListener("click", () => saveStageQc(dialog, "rejected"));
    dialog.querySelector(".stage-save-progress")?.addEventListener("click", () => saveStageQc(dialog, "progress"));
  });
}

// ===== Studio 5 production + QA amendments =====
const DEFAULT_BIBLE_SECTIONS = ["Brand Rules","Fonts & Colours","Tone / UK English","Products & Services","Imagery Rules","Content Priorities","Do Not Use","Locations / Stores","Important Facts / Contact Details","Recurring Content Directions","Other Notes"];
const DEFAULT_QC = ["Client brief followed exactly","Brand Bible followed","UK English checked","Fonts, colours and brand styling checked","Facts, phone numbers and locations verified","Latest relevant imagery used","One clear content focus","Product / service shown correctly","Strong hook","Caption matches the content","CTA checked","Not generic or repetitive","References and assets checked"];
const REEL_QC = ["Premium Music Vibe","Reel has one clear purpose","Opening / hook is scroll-stopping","Footage is relevant to the exact focus","Pacing and edit feel premium"];
function getBrandBible(){ return remote.brandBibles?.[brandKey(currentBrand)] || {}; }
function bibleEntries(){ const b=getBrandBible(); if(Array.isArray(b.entries)) return b.entries; if(b.entries&&typeof b.entries==='object') return Object.values(b.entries); const legacy=getBrandResources()?.notes; return legacy ? [{section:'Other Notes',text:legacy}] : []; }
function renderBrandBibleReminder(){ const el=document.querySelector('#brandBibleReminder'); if(!el)return; const entries=bibleEntries().filter(x=>x?.text); el.classList.toggle('hidden',!entries.length); el.innerHTML=entries.length?`<strong>${escapeHtml(currentBrand)} Brand Bible</strong><span>${entries.length} active rule${entries.length===1?'':'s'} — automatically shown in Add Content.</span>`:''; }
function openBrandBible(){
  document.querySelector('#brandBibleTitle').textContent=`${currentBrand} — Brand Bible`;
  const list=document.querySelector('#brandBibleList');
  list.innerHTML='';
  const grouped=Object.fromEntries(DEFAULT_BIBLE_SECTIONS.map(section=>[section,[]]));
  bibleEntries().forEach(entry=>{
    const section=DEFAULT_BIBLE_SECTIONS.includes(entry?.section)?entry.section:'Other Notes';
    const text=String(entry?.text||entry?.note||'').trim();
    if(text) grouped[section].push(text);
  });
  DEFAULT_BIBLE_SECTIONS.forEach(section=>renderBibleCategory(section,grouped[section]));
  document.querySelector('#brandBibleDialog').showModal();
}
function renderBibleCategory(section,notes=[]){
  const wrapper=document.createElement('section');
  wrapper.className='bible-category';
  wrapper.dataset.section=section;
  wrapper.innerHTML=`<div class="bible-category-head"><div><h4>${escapeHtml(section)}</h4><span>Saved only under this category</span></div><button type="button" class="ghost-btn bible-add-note">+ Add Note</button></div><div class="bible-category-notes"></div>`;
  const notesWrap=wrapper.querySelector('.bible-category-notes');
  (notes.length?notes:['']).forEach(text=>addBibleEntryRow(section,text,notesWrap));
  wrapper.querySelector('.bible-add-note').addEventListener('click',()=>addBibleEntryRow(section,'',notesWrap));
  document.querySelector('#brandBibleList').appendChild(wrapper);
}
function addBibleEntryRow(section='Brand Rules',text='',target=null){
  const row=document.createElement('div');
  row.className='bible-entry';
  row.dataset.section=section;
  row.innerHTML=`<div class="bible-note-label">Note</div><textarea class="bible-text" rows="3" placeholder="Add a specific ${escapeHtml(section.toLowerCase())} rule, preference or instruction...">${escapeHtml(text)}</textarea><button type="button" class="danger-btn bible-delete">Delete</button>`;
  row.querySelector('.bible-delete').onclick=()=>{
    const notesWrap=row.parentElement;
    row.remove();
    if(notesWrap && !notesWrap.querySelector('.bible-entry')) addBibleEntryRow(section,'',notesWrap);
  };
  (target||document.querySelector('#brandBibleList')).appendChild(row);
}
async function saveBrandBible(e){
  e.preventDefault();
  const entries=[...document.querySelectorAll('#brandBibleList .bible-entry')].map(r=>({section:r.dataset.section||'Other Notes',text:r.querySelector('.bible-text').value.trim()})).filter(x=>x.text);
  await write(`brandBibles/${brandKey(currentBrand)}`,{entries,updatedAt:Date.now(),updatedBy:auth.currentUser.uid},'Brand Bible saved');
  document.querySelector('#brandBibleDialog').close();
}
function renderContentBrandRules(){ const el=document.querySelector('#contentBrandRules'); if(!el)return; const entries=bibleEntries().filter(x=>x.text); el.innerHTML=entries.length?`<div class="content-rules-head"><strong>${escapeHtml(currentBrand)} — rules to follow</strong><span>Automatic Brand Bible reminder</span></div>${entries.map(x=>`<div><b>${escapeHtml(x.section)}:</b> ${escapeHtml(x.text)}</div>`).join('')}`:`<div class="content-rules-head"><strong>${escapeHtml(currentBrand)} — no Brand Bible rules saved yet</strong><span>Ask for clarification rather than assume.</span></div>`; }
function getSopResources(){ const obj=remote.sopResources?.[brandKey(currentBrand)]||{}; return Object.entries(obj).map(([id,x])=>({id,...x})); }
function renderSopResources(){ const list=document.querySelector('#sopResourceList'); if(!list)return; const items=getSopResources(); list.innerHTML=items.length?'':`<div class="content-links-empty">No SOP resources saved for ${escapeHtml(currentBrand)} yet.</div>`; items.forEach(x=>{const card=document.createElement('article');card.className='sop-resource-card'; const link=x.type==='pdf'&&x.dataUrl?`<a href="${escapeHtml(x.dataUrl)}" download="${escapeHtml(x.fileName||x.title)}">Open / download PDF</a>`:x.url?`<a href="${escapeHtml(x.url)}" target="_blank" rel="noopener">Open SOP link</a>`:''; card.innerHTML=`<div><span class="category-pill">${x.type==='pdf'?'PDF':'LINK'}</span><h4>${escapeHtml(x.title||'Untitled SOP')}</h4><p>${escapeHtml(x.notes||'No notes.')}</p>${link}</div><button class="danger-btn">Delete</button>`; card.querySelector('button').onclick=()=>deleteSopResource(x.id); list.appendChild(card);}); }
function openSopResourceDialog(){ const f=document.querySelector('#sopResourceForm'); f.reset(); updateSopResourceFields(); document.querySelector('#sopResourceDialog').showModal(); }
function closeSopResourceDialog(){document.querySelector('#sopResourceDialog').close();}
function updateSopResourceFields(){ const pdf=document.querySelector('#sopResourceType').value==='pdf'; document.querySelector('#sopLinkField').classList.toggle('hidden',pdf); document.querySelector('#sopFileField').classList.toggle('hidden',!pdf); }
async function saveSopResource(e){e.preventDefault(); const type=document.querySelector('#sopResourceType').value,title=document.querySelector('#sopResourceTitle').value.trim(),notes=document.querySelector('#sopResourceNotes').value.trim(),url=document.querySelector('#sopResourceUrl').value.trim(),file=document.querySelector('#sopResourceFile').files?.[0]; if(type==='link'&&!url)return alert('Please add the SOP link.'); if(type==='pdf'&&!file)return alert('Please choose a PDF file.'); if(file&&file.size>4*1024*1024)return alert('Please upload a PDF no larger than 4 MB.'); let dataUrl='',fileName=''; if(file){dataUrl=await readFileAsDataUrl(file);fileName=file.name;} const id=crypto.randomUUID(); const ok=await write(`sopResources/${brandKey(currentBrand)}/${id}`,{type,title,notes,url:type==='link'?url:'',dataUrl,fileName,size:file?.size||0,updatedAt:Date.now(),updatedBy:auth.currentUser.uid},'SOP resource saved'); if(ok)closeSopResourceDialog();}
async function deleteSopResource(id){if(!confirm('Delete this SOP resource?'))return; await remove(ref(db,`${ROOT_PATH}/sopResources/${brandKey(currentBrand)}/${id}`));}
