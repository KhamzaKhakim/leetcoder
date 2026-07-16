const statusBanner = document.getElementById("status-banner");
const statusText = document.getElementById("status-text");
const statsEl = document.getElementById("stats");
const ioEl = document.getElementById("io-section");

function toText(value) {
  if (Array.isArray(value)) {
    return value.join("\\n");
  }
  return value === null ? "" : String(value);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

window.addEventListener("message", (event) => {
  const msg = event.data;

  if (msg.type === "pending") {
    statusText.textContent = "Judging your submission… (check " + msg.attempt + ")";
    return;
  }

  if (msg.type === "error") {
    statusBanner.className = "status-banner failed";
    statusBanner.innerHTML = "<span>⚠️</span><span>" + escapeHtml(msg.message) + "</span>";
    return;
  }

  if (msg.type === "result") {
    renderResult(msg.data);
  }
});

function renderResult(data) {
  const accepted = data.status_msg === "Accepted";
  statusBanner.className = "status-banner " + (accepted ? "accepted" : "failed");
  statusBanner.innerHTML =
    "<span>" +
    (accepted ? "✅" : "❌") +
    "</span><span>" +
    escapeHtml(data.status_msg || "Judged") +
    "</span>";

  const stats = [];
  if (typeof data.total_correct === "number" && typeof data.total_testcases === "number") {
    stats.push(["Testcases", data.total_correct + " / " + data.total_testcases]);
  }
  if (data.status_runtime) {
    stats.push(["Runtime", data.status_runtime]);
  }
  if (data.status_memory) {
    stats.push(["Memory", data.status_memory]);
  }
  if (typeof data.runtime_percentile === "number") {
    stats.push(["Runtime %ile", data.runtime_percentile.toFixed(1) + "%"]);
  }
  if (typeof data.memory_percentile === "number") {
    stats.push(["Memory %ile", data.memory_percentile.toFixed(1) + "%"]);
  }

  if (stats.length) {
    statsEl.classList.remove("hidden");
    statsEl.innerHTML = stats
      .map(
        ([label, value]) =>
          '<div class="stat-card"><div class="label">' +
          label +
          '</div><div class="value">' +
          escapeHtml(String(value)) +
          "</div></div>",
      )
      .join("");
  }

  let ioHtml = "";
  if (data.compile_error) {
    ioHtml +=
      '<div class="io-label">Compile Error</div><pre class="io-block">' +
      escapeHtml(toText(data.full_compile_error || data.compile_error)) +
      "</pre>";
  }
  if (!accepted && data.last_testcase) {
    ioHtml +=
      '<div class="io-label">Input</div><pre class="io-block">' +
      escapeHtml(toText(data.last_testcase)) +
      "</pre>";
  }
  if (!accepted && data.expected_output) {
    ioHtml +=
      '<div class="io-label">Expected Output</div><pre class="io-block">' +
      escapeHtml(toText(data.expected_output)) +
      "</pre>";
  }
  if (!accepted && data.code_output) {
    ioHtml +=
      '<div class="io-label">Your Output</div><pre class="io-block">' +
      escapeHtml(toText(data.code_output)) +
      "</pre>";
  }
  if (data.std_output) {
    ioHtml +=
      '<div class="io-label">Standard Output</div><pre class="io-block">' +
      escapeHtml(toText(data.std_output)) +
      "</pre>";
  }
  ioEl.innerHTML = ioHtml;
}
