const EMISSION_FACTORS = {
  transport: 0.192,
  electricity: 0.82,
  lpg: 3.0,
  flight: 90.0
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

function toFixed(value) {
  return Number(value).toFixed(2);
}

function addEntry(type, details, impact) {
  data.entries.unshift({
    date: new Date().toLocaleDateString(DATE_LOCALE),
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
  profileSummary.textContent = `Citizen: ${name} (${city}) · Monthly target: ${target} kg CO₂`;
}

function renderHistory() {
  historyTable.innerHTML = "";
  if (!data.entries.length) {
    historyTable.innerHTML = `<tr><td colspan="4" class="muted">No records yet. Start logging your activities.</td></tr>`;
    return;
  }
  data.entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.type}</td>
      <td>${entry.details}</td>
      <td>${entry.impact > 0 ? "+" : ""}${toFixed(entry.impact)}</td>
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

  document.getElementById("totalEmissions").textContent = toFixed(totalEmissions);
  document.getElementById("totalOffset").textContent = toFixed(totalOffset);
  document.getElementById("netFootprint").textContent = toFixed(netFootprint);
  document.getElementById("targetProgress").textContent = toFixed(safeProgress);
  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = `${safeProgress}%`;
  progressBar.setAttribute("aria-valuenow", toFixed(safeProgress));
  const targetMessage = document.getElementById("targetMessage");
  if (!target) {
    targetMessage.textContent = "Set a monthly carbon target in your profile to track progress.";
    return;
  }

  targetMessage.textContent = exceeded
    ? `You have exceeded your monthly target by ${toFixed(netFootprint - target)} kg CO₂e.`
    : `You are within target. ${toFixed(target - netFootprint)} kg CO₂e remaining this month.`;
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
  const category = document.getElementById("category").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value.trim();
  const factor = EMISSION_FACTORS[category] || 0;
  const impact = quantity * factor;
  const details = `${category} - ${quantity} ${unit} (factor: ${factor})`;

  addEntry("Emission", details, impact);
  emissionForm.reset();
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

loadData();
render();
