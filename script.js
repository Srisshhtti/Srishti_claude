const EMISSION_FACTORS = {
  transport: 0.192,
  electricity: 0.82,
  lpg: 3.0,
  flight: 90.0
};

const CATEGORY_UNITS = {
  transport: "km",
  electricity: "kWh",
  lpg: "kg",
  flight: "hour"
};

const OFFSET_FACTORS = {
  trees: 21,
  greenKm: 0.15,
  recycled: 0.5
};

const STORAGE_KEY = "srishtiTrackerData";
const DATE_LOCALE = navigator.language || "en-IN";

const data = {
  profile: { name: "", city: "", target: 0 },
  entries: []
};

const profileForm = document.getElementById("profileForm");
const emissionForm = document.getElementById("emissionForm");
const contributionForm = document.getElementById("contributionForm");
const historyTable = document.getElementById("historyTable");
const profileSummary = document.getElementById("profileSummary");
const categorySelect = document.getElementById("category");
const unitSelect = document.getElementById("unit");

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (parsed?.profile && Array.isArray(parsed.entries)) {
      data.profile = parsed.profile;
      data.entries = parsed.entries;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatNumber(value, decimals = 2) {
  return value != null && !Number.isNaN(Number(value))
    ? Number(value).toFixed(decimals)
    : (0).toFixed(decimals);
}

function addEntry(type, details, impact) {
  data.entries.unshift({
    date: new Date().toISOString(),
    type,
    details,
    impact
  });
  saveData();
  render();
}

function renderProfile() {
  const { name, city, target } = data.profile;
  if (!name || !city || !target) {
    profileSummary.textContent = "Save your profile to personalize monthly target tracking.";
    return;
  }
  profileSummary.textContent = `Citizen: ${name} (${city}) · Monthly target: ${target} kg CO2`;
}

function renderHistory() {
  historyTable.innerHTML = "";
  if (!data.entries.length) {
    historyTable.innerHTML = `<tr><td colspan="4" class="muted">No records yet. Start logging your activities.</td></tr>`;
    return;
  }
  data.entries.forEach((entry) => {
    const parsedDate = new Date(entry.date);
    const displayDate = Number.isNaN(parsedDate.getTime())
      ? entry.date
      : parsedDate.toLocaleDateString(DATE_LOCALE);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${displayDate}</td>
      <td>${entry.type}</td>
      <td>${entry.details}</td>
      <td>${entry.impact > 0 ? "+" : ""}${formatNumber(entry.impact)}</td>
    `;
    historyTable.appendChild(row);
  });
}

function renderDashboard() {
  const totalEmissions = data.entries
    .filter((item) => item.type === "Emission")
    .reduce((sum, item) => sum + item.impact, 0);

  const totalOffset = data.entries
    .filter((item) => item.type === "Contribution")
    .reduce((sum, item) => sum + Math.abs(item.impact), 0);

  const netFootprint = totalEmissions - totalOffset;
  const target = Number(data.profile.target || 0);
  const usage = target > 0 ? (netFootprint / target) * 100 : 0;
  const safeProgress = Math.max(0, Math.min(100, usage));
  const exceeded = target > 0 && netFootprint > target;

  document.getElementById("totalEmissions").textContent = formatNumber(totalEmissions);
  document.getElementById("totalOffset").textContent = formatNumber(totalOffset);
  document.getElementById("netFootprint").textContent = formatNumber(netFootprint);
  document.getElementById("targetProgress").textContent = formatNumber(safeProgress, 1);
  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = `${safeProgress}%`;
  progressBar.setAttribute("aria-valuenow", formatNumber(safeProgress, 1));
  const targetMessage = document.getElementById("targetMessage");
  if (!target) {
    targetMessage.textContent = "Set a monthly carbon target in your profile to track progress.";
    return;
  }

  targetMessage.textContent = exceeded
    ? `You have exceeded your monthly target by ${formatNumber(netFootprint - target)} kg CO2e.`
    : `You are within target. ${formatNumber(target - netFootprint)} kg CO2e remaining this month.`;
}

function render() {
  renderProfile();
  renderHistory();
  renderDashboard();
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  data.profile = {
    name: document.getElementById("name").value.trim(),
    city: document.getElementById("city").value.trim(),
    target: Number(document.getElementById("target").value)
  };
  saveData();
  render();
});

emissionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const category = categorySelect.value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = unitSelect.value;
  const factor = EMISSION_FACTORS[category];
  if (factor == null) {
    return;
  }
  const impact = quantity * factor;
  const details = `${category} - ${quantity} ${unit} (factor: ${factor})`;

  addEntry("Emission", details, impact);
  emissionForm.reset();
  unitSelect.value = CATEGORY_UNITS[categorySelect.value];
});

contributionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const trees = Number(document.getElementById("trees").value);
  const greenKm = Number(document.getElementById("greenKm").value);
  const recycled = Number(document.getElementById("recycled").value);

  const impact =
    trees * OFFSET_FACTORS.trees +
    greenKm * OFFSET_FACTORS.greenKm +
    recycled * OFFSET_FACTORS.recycled;
  const details = `Trees: ${trees}, Green Travel: ${greenKm} km, Recycled: ${recycled} kg`;

  addEntry("Contribution", details, -impact);
  contributionForm.reset();
});

categorySelect.addEventListener("change", () => {
  unitSelect.value = CATEGORY_UNITS[categorySelect.value];
});

unitSelect.value = CATEGORY_UNITS[categorySelect.value];
loadData();
render();
