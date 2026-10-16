import {
  simulatePath,
  simulateTurn,
  parseSegments,
  distanceToMotorDegrees,
  csvTrace,
  SOURCE_GEOMETRY,
} from "./model.mjs";
const $ = (id) => document.getElementById(id),
  fmt = (n, d = 2) => n.toFixed(d),
  ns = "http://www.w3.org/2000/svg";
let result = null;
function element(svg, tag, attributes, text) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  svg.append(node);
  return node;
}
function presets() {
  const spinSeconds =
    ((Math.PI / 2) * SOURCE_GEOMETRY.track) /
    (2 *
      ((160 / 60) *
        Math.PI *
        SOURCE_GEOMETRY.diameter *
        SOURCE_GEOMETRY.ratio));
  return {
    arc: "120,240,2",
    straight: "240,240,1.5",
    pivot: "-180,180,1",
    square: Array.from(
      { length: 4 },
      () => `200,200,1\n-160,160,${spinSeconds.toFixed(8)}`,
    ).join("\n"),
  };
}
function setPreset() {
  $("segments").value =
    "left_rpm,right_rpm,duration_s\n" + presets()[$("preset").value];
  invalidate();
}
function invalidate() {
  result = null;
  $("json").disabled = $("csv").disabled = true;
  $("message").textContent =
    "Inputs changed. Run the experiment to update the plots.";
  $("status").textContent = "NEEDS RUN";
}
function path(svg, values, color, x, y) {
  element(svg, "path", {
    d: values.map((v, i) => `${i ? "L" : "M"}${x(v, i)},${y(v, i)}`).join(" "),
    fill: "none",
    stroke: color,
    "stroke-width": 2,
    "stroke-linejoin": "round",
  });
}
function drawPose() {
  if (!result) return;
  const svg = $("trajectory"),
    trace = result.trace,
    index = Number($("scrub").value),
    pose = trace[index];
  svg.replaceChildren();
  const xs = trace.map((s) => s.x),
    ys = trace.map((s) => s.y),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2,
    scale = Math.min(620 / (maxX - minX + 30), 320 / (maxY - minY + 30)),
    x = (v) => 360 + (v - cx) * scale,
    y = (v) => 210 - (v - cy) * scale;
  const grid = 10;
  for (
    let gx = Math.floor((cx - 310 / scale) / grid) * grid;
    gx <= cx + 310 / scale;
    gx += grid
  ) {
    element(svg, "path", { d: `M${x(gx)},35V385`, class: "gridline" });
    element(
      svg,
      "text",
      { x: x(gx), y: 408, "text-anchor": "middle" },
      fmt(gx, 0),
    );
  }
  for (
    let gy = Math.floor((cy - 160 / scale) / grid) * grid;
    gy <= cy + 160 / scale;
    gy += grid
  ) {
    element(svg, "path", { d: `M50,${y(gy)}H670`, class: "gridline" });
    element(svg, "text", { x: 5, y: y(gy) + 4 }, fmt(gy, 0));
  }
  path(
    svg,
    trace,
    "#687f99",
    (p) => x(p.x),
    (p) => y(p.y),
  );
  path(
    svg,
    trace.slice(0, index + 1),
    "#f4bd72",
    (p) => x(p.x),
    (p) => y(p.y),
  );
  element(svg, "circle", { cx: x(0), cy: y(0), r: 4, fill: "#9fc8da" });
  const group = element(svg, "g", {
    transform: `translate(${x(pose.x)} ${y(pose.y)}) rotate(${(-pose.theta * 180) / Math.PI})`,
  });
  element(group, "rect", {
    x: -5 * scale,
    y: (-result.geometry.track / 2) * scale,
    width: 10 * scale,
    height: result.geometry.track * scale,
    rx: 3,
    fill: "#233b52",
    stroke: "#9fc8da",
    "stroke-width": 1.5,
  });
  element(group, "path", {
    d: `M${-2 * scale},0H${7 * scale}M${4 * scale},${-2 * scale}L${7 * scale},0L${4 * scale},${2 * scale}`,
    stroke: "#f4bd72",
    "stroke-width": 2,
    fill: "none",
  });
  $("sample-value").textContent = `${index + 1} / ${trace.length}`;
  $("pose").textContent =
    `t = ${fmt(pose.time)} s · x = ${fmt(pose.x)} in · y = ${fmt(pose.y)} in · θ = ${fmt((pose.theta * 180) / Math.PI)}°`;
}
function drawResponse() {
  const svg = $("response");
  svg.replaceChildren();
  const turn = result.mode === "turn",
    trace = result.trace,
    keys = turn ? ["error", "command"] : ["leftRPM", "rightRPM"],
    max = Math.max(1, ...trace.flatMap((p) => keys.map((k) => Math.abs(p[k])))),
    x = (p) => 45 + (p.time / trace.at(-1).time) * 630,
    y = (v) => 110 - (v / max) * 75;
  for (const value of [-max, 0, max]) {
    element(svg, "path", { d: `M45,${y(value)}H675`, class: "gridline" });
    element(svg, "text", { x: 0, y: y(value) + 4 }, fmt(value, 0));
  }
  keys.forEach((key, i) =>
    path(svg, trace, i ? "#9fc8da" : "#f4bd72", x, (p) => y(p[key])),
  );
  element(svg, "text", { x: 45, y: 215 }, "0 s");
  element(svg, "text", { x: 620, y: 215 }, `${fmt(trace.at(-1).time)} s`);
  $("response-title").textContent = turn
    ? "Heading error & bounded output"
    : "Wheel commands over time";
  $("response-note").textContent = turn
    ? `Amber: heading error in degrees. Blue: output command in percent (shared numeric axis, distinct units). Final error ${fmt(trace.at(-1).error)}°. ${result.status === "settled" ? "Settling condition reached for 0.2 seconds." : "Timeout reached; the settling condition was not satisfied."}`
    : "Amber: left motor RPM. Blue: right motor RPM. Motor speed is an ideal command in this experiment, without acceleration or slip.";
}
function run() {
  try {
    const shape = Object.fromEntries(
      ["diameter", "ratio", "track"].map((id) => [id, Number($(id).value)]),
    );
    result =
      $("mode").value === "path"
        ? simulatePath(parseSegments($("segments").value), shape)
        : simulateTurn({
            ...shape,
            ...Object.fromEntries(
              [
                "target",
                "kp",
                "ki",
                "kd",
                "timeout",
                "limit",
                "maxRPM",
                "tau",
                "leftEfficiency",
                "rightEfficiency",
              ].map((id) => [id, Number($(id).value)]),
            ),
          });
    $("scrub").max = result.trace.length - 1;
    $("scrub").value = result.trace.length - 1;
    $("elapsed").textContent = fmt(result.trace.at(-1).time);
    $("travel").textContent = fmt(result.travel);
    $("angle").textContent = fmt((result.trace.at(-1).theta * 180) / Math.PI);
    $("status").textContent = result.status.toUpperCase();
    $("json").disabled = $("csv").disabled = false;
    $("message").className = "";
    $("message").textContent =
      "Simulation complete. Scrub the trajectory or export the inputs and full trace.";
    $("conversion").textContent =
      `With this geometry, 12 inches of wheel travel requires ${fmt(distanceToMotorDegrees(12, result.geometry))} motor degrees.`;
    drawPose();
    drawResponse();
  } catch (error) {
    invalidate();
    $("message").className = "error";
    $("message").textContent = error.message;
  }
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("run").onclick = run;
$("scrub").oninput = drawPose;
$("preset").onchange = setPreset;
$("mode").onchange = () => {
  $("path-controls").hidden = $("mode").value !== "path";
  $("turn-controls").hidden = $("mode").value !== "turn";
  invalidate();
};
for (const input of document.querySelectorAll("aside input,aside textarea"))
  input.addEventListener("input", invalidate);
$("json").onclick = () =>
  result &&
  download(
    "drive-lab.json",
    JSON.stringify(
      {
        schemaVersion: 1,
        source:
          "7110A archived team competition source; new educational simulator",
        ...result,
      },
      null,
      2,
    ),
    "application/json",
  );
$("csv").onclick = () =>
  result && download("drive-trace.csv", csvTrace(result), "text/csv");
setPreset();
run();
