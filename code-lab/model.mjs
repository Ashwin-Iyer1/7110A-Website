// Geometry is from Competition/src/main.cpp:68–74. Plant dynamics are assumptions.
export const SOURCE_GEOMETRY = Object.freeze({
  diameter: 3.25,
  ratio: 36 / 48,
  track: 11.5,
});
const finite = (n, name) => {
  if (!Number.isFinite(n)) throw Error(`${name} must be finite.`);
  return n;
};
export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
export function geometry(options = SOURCE_GEOMETRY) {
  const { diameter, ratio, track } = options;
  for (const [key, value, max] of [
    ["diameter", diameter, 12],
    ["ratio", ratio, 4],
    ["track", track, 36],
  ])
    if (!Number.isFinite(value) || value <= 0 || value > max)
      throw Error(`${key} must be positive and at most ${max}.`);
  return { diameter, ratio, track };
}
export function distanceToMotorDegrees(inches, options = SOURCE_GEOMETRY) {
  finite(inches, "Distance");
  const { diameter, ratio } = geometry(options);
  return ((inches / (Math.PI * diameter)) * 360) / ratio;
}
export function motorDegreesToDistance(degrees, options = SOURCE_GEOMETRY) {
  finite(degrees, "Rotation");
  const { diameter, ratio } = geometry(options);
  return (degrees / 360) * Math.PI * diameter * ratio;
}
export function toSeconds(value, unit) {
  if (!Number.isFinite(value) || value < 0)
    throw Error("Duration must be nonnegative and finite.");
  if (!["s", "ms"].includes(unit)) throw Error("Unit must be s or ms.");
  return unit === "ms" ? value / 1000 : value;
}
export function wrapDegrees(value) {
  finite(value, "Angle");
  return ((((value + 180) % 360) + 360) % 360) - 180;
}
export function stepPose(pose, left, right, track) {
  [pose.x, pose.y, pose.theta, left, right, track].forEach((n) =>
    finite(n, "Pose/step"),
  );
  if (track <= 0) throw Error("Track width must be positive.");
  const angle = (right - left) / track,
    mid = pose.theta + angle / 2,
    distance = (left + right) / 2;
  const sinc =
    Math.abs(angle) < 1e-7
      ? 1 - (angle * angle) / 24
      : Math.sin(angle / 2) / (angle / 2);
  return {
    x: pose.x + distance * sinc * Math.cos(mid),
    y: pose.y + distance * sinc * Math.sin(mid),
    theta: pose.theta + angle,
  };
}
export function parseSegments(text) {
  if (typeof text !== "string" || text.length > 10000)
    throw Error("Use a CSV smaller than 10 KB.");
  const lines = text.trim().split(/\r?\n/);
  if (lines.shift().trim() !== "left_rpm,right_rpm,duration_s")
    throw Error("Header must be left_rpm,right_rpm,duration_s.");
  if (!lines.length || lines.length > 20)
    throw Error("Supply 1–20 motion segments.");
  const segments = lines.map((line, i) => {
    const cells = line.split(",").map((v) => v.trim());
    if (
      cells.length !== 3 ||
      cells.some((v) => !v || !/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(v))
    )
      throw Error(`Segment ${i + 1} must contain three numbers.`);
    const [left, right, seconds] = cells.map(Number);
    if (
      Math.abs(left) > 600 ||
      Math.abs(right) > 600 ||
      seconds <= 0 ||
      seconds > 15
    )
      throw Error(
        `Segment ${i + 1}: RPM must be within ±600 and duration in (0,15] seconds.`,
      );
    return { left, right, seconds };
  });
  if (segments.reduce((sum, s) => sum + s.seconds, 0) > 30)
    throw Error("Total duration must be at most 30 seconds.");
  return segments;
}
export function simulatePath(segments, options = SOURCE_GEOMETRY) {
  const g = geometry(options);
  // Reuse the external contract even for callers supplying objects directly.
  segments = parseSegments(
    "left_rpm,right_rpm,duration_s\n" +
      segments.map((s) => [s.left, s.right, s.seconds].join(",")).join("\n"),
  );
  let pose = { x: 0, y: 0, theta: 0 },
    time = 0,
    travel = 0;
  const trace = [{ time, ...pose, leftRPM: 0, rightRPM: 0, segment: 0 }];
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    let elapsed = 0;
    while (elapsed < segment.seconds - 1e-12) {
      const dt = Math.min(0.02, segment.seconds - elapsed),
        left = motorDegreesToDistance(segment.left * 6 * dt, g),
        right = motorDegreesToDistance(segment.right * 6 * dt, g);
      pose = stepPose(pose, left, right, g.track);
      time += dt;
      elapsed += dt;
      travel += Math.abs((left + right) / 2);
      trace.push({
        time,
        ...pose,
        leftRPM: segment.left,
        rightRPM: segment.right,
        segment: index + 1,
      });
    }
  }
  return {
    mode: "kinematics",
    geometry: g,
    segments,
    trace,
    travel,
    status: "complete",
    assumptions: [
      "Ideal rolling, no slip, no acceleration limits.",
      "+x is initial forward; positive angle is counterclockwise.",
      "Commands are motor RPM, not measured hardware speed.",
    ],
  };
}
export function simulateTurn(settings = {}) {
  const {
    target = 90,
    kp = 0.285,
    ki = 0.1,
    kd = 0.0225,
    timeout = 4,
    limit = 80,
    maxRPM = 600,
    tau = 0.15,
    leftEfficiency = 1,
    rightEfficiency = 1,
    ...shape
  } = settings;
  const g = geometry({ ...SOURCE_GEOMETRY, ...shape });
  for (const [name, n, min, max] of [
    ["target", target, -180, 180],
    ["kp", kp, 0, 10],
    ["ki", ki, 0, 5],
    ["kd", kd, 0, 2],
    ["timeout", timeout, 0.2, 15],
    ["limit", limit, 1, 100],
    ["maxRPM", maxRPM, 1, 600],
    ["tau", tau, 0.01, 2],
    ["leftEfficiency", leftEfficiency, 0, 1],
    ["rightEfficiency", rightEfficiency, 0, 1],
  ])
    if (!Number.isFinite(n) || n < min || n > max)
      throw Error(`${name} must be in [${min},${max}].`);
  let pose = { x: 0, y: 0, theta: 0 },
    leftRPM = 0,
    rightRPM = 0,
    integral = 0,
    time = 0,
    settledFor = 0,
    travel = 0,
    status = "timeout";
  const trace = [
    {
      time,
      ...pose,
      leftRPM,
      rightRPM,
      error: wrapDegrees(target),
      command: 0,
      yawRate: 0,
      integral,
      saturated: false,
    },
  ];
  while (time < timeout - 1e-12) {
    const dt = Math.min(0.02, timeout - time),
      angle = (pose.theta * 180) / Math.PI,
      error = wrapDegrees(target - angle),
      yawRate = trace.at(-1).yawRate;
    const candidateIntegral = integral + error * dt,
      raw = kp * error + ki * candidateIntegral - kd * yawRate;
    // Conditional integration: don't accumulate error that drives further into saturation.
    if (Math.abs(raw) <= limit || Math.sign(error) !== Math.sign(raw))
      integral = candidateIntegral;
    const requested = kp * error + ki * integral - kd * yawRate,
      command = clamp(requested, -limit, limit),
      alpha = 1 - Math.exp(-dt / tau);
    leftRPM += ((-command / 100) * maxRPM * leftEfficiency - leftRPM) * alpha;
    rightRPM += ((command / 100) * maxRPM * rightEfficiency - rightRPM) * alpha;
    const left = motorDegreesToDistance(leftRPM * 6 * dt, g),
      right = motorDegreesToDistance(rightRPM * 6 * dt, g);
    pose = stepPose(pose, left, right, g.track);
    time += dt;
    travel += Math.abs((left + right) / 2);
    const actualError = wrapDegrees(target - (pose.theta * 180) / Math.PI),
      actualRate = (((right - left) / g.track / dt) * 180) / Math.PI;
    trace.push({
      time,
      ...pose,
      leftRPM,
      rightRPM,
      error: actualError,
      command,
      yawRate: actualRate,
      integral,
      saturated: Math.abs(requested) > limit,
    });
    settledFor =
      Math.abs(actualError) <= 2 && Math.abs(actualRate) <= 20
        ? settledFor + dt
        : 0;
    if (settledFor >= 0.2 - 1e-12) {
      status = "settled";
      break;
    }
  }
  return {
    mode: "turn",
    geometry: g,
    settings: {
      target,
      kp,
      ki,
      kd,
      timeout,
      limit,
      maxRPM,
      tau,
      leftEfficiency,
      rightEfficiency,
    },
    trace,
    travel,
    status,
    assumptions: [
      "First-order wheel response with a user-selected time constant, no slip model.",
      "Wheel effectiveness and max RPM are hypothetical, not hardware measurements.",
      "Controller uses derivative on measurement, bounded output and conditional integral accumulation.",
      "Settled means error ≤2° and speed ≤20°/s continuously for 0.2 s in this model.",
    ],
  };
}
export function csvTrace(result) {
  const keys = Object.keys(result.trace[0]);
  return (
    keys.join(",") +
    "\n" +
    result.trace.map((row) => keys.map((k) => row[k]).join(",")).join("\n") +
    "\n"
  );
}
