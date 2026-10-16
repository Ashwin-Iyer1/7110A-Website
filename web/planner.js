export const example = [{ type: 'straight', value: 24 }, { type: 'turn', value: 90 }, { type: 'straight', value: 24 }, { type: 'turn', value: 90 }, { type: 'straight', value: 24 }, { type: 'turn', value: 90 }, { type: 'straight', value: 24 }];
const allowed = new Set(['straight', 'turn', 'heading', 'point']);
export function validateCommands(input) {
  if (!Array.isArray(input) || input.length > 100) throw new Error('Use at most 100 route steps.');
  return input.map((item, index) => {
    if (!item || !allowed.has(item.type)) throw new Error(`Step ${index + 1} is not a supported command.`);
    const keys = item.type === 'point' ? ['x', 'y'] : ['value'];
    const result = { type: item.type };
    for (const key of keys) {
      const value = item[key]; const max = item.type === 'turn' || item.type === 'heading' ? 360 : 144;
      if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > max) throw new Error(`Step ${index + 1}: enter a finite value between −${max} and ${max}.`);
      result[key] = value;
    }
    return result;
  });
}
const normalize = angle => ((angle % 360) + 360) % 360;
const tidy = number => Math.abs(number) < 1e-9 ? 0 : Math.round(number * 1000) / 1000;
export function simulate(commands, start = { x: 72, y: 72, heading: 0 }) {
  const steps = validateCommands(commands);
  if (![start.x, start.y, start.heading].every(Number.isFinite) || start.x < 0 || start.x > 144 || start.y < 0 || start.y > 144) throw new Error('Start coordinates must be inside the 144-inch field.');
  let pose = { ...start, heading: normalize(start.heading) }; const poses = [{ ...pose }]; const warnings = [];
  let distance = 0;
  for (const [index, step] of steps.entries()) {
    const previous = { ...pose };
    if (step.type === 'straight') { const radians = pose.heading * Math.PI / 180; pose.x += Math.cos(radians) * step.value; pose.y += Math.sin(radians) * step.value; }
    if (step.type === 'turn') pose.heading = normalize(pose.heading + step.value);
    if (step.type === 'heading') pose.heading = normalize(step.value);
    if (step.type === 'point') { pose.x = step.x; pose.y = step.y; }
    pose = { x: tidy(pose.x), y: tidy(pose.y), heading: tidy(pose.heading) };
    distance += Math.hypot(pose.x - previous.x, pose.y - previous.y);
    if (pose.x < 0 || pose.x > 144 || pose.y < 0 || pose.y > 144) warnings.push(`Step ${index + 1} leaves the field. The preview does not model a robot footprint.`);
    poses.push({ ...pose });
  }
  return { poses, distance: tidy(distance), warnings };
}
export function generateCode(commands) {
  const steps = validateCommands(commands);
  const lines = steps.map(step => step.type === 'straight' ? `straight(${step.value});` : step.type === 'turn' ? `smartTurn(${step.value});` : step.type === 'heading' ? `turnToHeading(${step.value});` : `moveToPoint(${step.x}, ${step.y});`);
  return '// Educational route sketch — verify units, coordinates, and robot APIs.\n// Adapt and test safely before running on hardware.\n' + lines.join('\n') + '\n';
}
export function parsePlan(text) {
  if (typeof text !== 'string' || text.length > 50_000) throw new Error('Plan files must be smaller than 50 KB.');
  let value; try { value = JSON.parse(text); } catch { throw new Error('Choose a valid route JSON file.'); }
  if (!value || typeof value !== 'object' || value.version !== 1) throw new Error('This plan version is not supported.');
  return validateCommands(value.commands);
}
