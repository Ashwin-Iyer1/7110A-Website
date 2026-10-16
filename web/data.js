export const source = 'https://github.com/Ashwin-Iyer1/7110A-Website';
const media = 'https://media.githubusercontent.com/media/Ashwin-Iyer1/7110A-Website/main/7110a-website/Models/';
const photos = import.meta.glob('../7110a-website/src/Images/*', { eager: true, query: '?url', import: 'default' });
export const photo = name => photos[`../7110a-website/src/Images/${name}`];
export const models = [
  { id: 'intake', name: 'Intake', category: 'Game mechanisms', size: 9988448, preview: 'Intake.JPG', file: 'intake.glb' },
  { id: 'sled', name: 'Sled', category: 'Game mechanisms', size: 6872, preview: 'Sled.JPG', file: 'sled.glb' },
  { id: 'ratchet', name: 'Ratchet', category: 'Game mechanisms', size: 3185952, preview: 'Ratchet.JPG', file: 'ratchet.glb' },
  { id: 'slapper', name: 'Slapper', category: 'Game mechanisms', size: 8053936, preview: 'Slapper.JPG', file: 'slapper.glb' },
  { id: 'launcher', name: 'Launcher', category: 'Game mechanisms', size: 8478160, preview: 'Launcher.JPG', file: 'launcher.glb' },
  { id: 'wing', name: 'Wing', category: 'Game mechanisms', size: 1616260, preview: 'Wing.JPG', file: 'wing.glb' },
  { id: 'drivetrain', name: 'Drivetrain', category: 'Robot systems', size: 29599960, preview: 'Drivetrain.JPG', file: 'drivetrain.glb' },
  { id: 'elevation', name: 'Elevation', category: 'Robot systems', size: 44898468, preview: 'Elevation.JPG', file: 'elevation.glb' },
  { id: 'robot', name: 'Complete robot', category: 'Robot systems', size: 50348156, preview: 'Drivetrain.JPG', file: 'Bot.glb', previewNote: 'Drivetrain detail shown as a lightweight preview.' },
].map(model => ({ ...model, url: media + model.file, image: photo(model.preview) }));
export const members = [
  { name: 'Ryan Brown', role: 'Designer and builder', images: ['Ryan1.jpg', 'Ryan2.jpg', 'Ryan3.jpg'] },
  { name: 'Ashwin Iyer', role: 'Driver, builder, off-coder', images: ['Ashwin1.png', 'Ashwin2.png', 'Ashwin3.png'] },
  { name: 'Bailey Koh', role: 'Builder', images: ['Bailey1.jpg', 'Bailey2.jpg', 'Bailey3.jpg'] },
  { name: 'Krish Dalela', role: 'Coder', images: ['Krish1.png', 'Krish2.png', 'Krish3.png'] },
  { name: 'Spandan Patel', role: 'Coder, off-builder', images: ['Spandan1.jpg', 'Spandan2.jpg', 'Spandan3.jpg'] },
  { name: 'Joshua Landgraff', role: 'Notebooker', images: ['Josh1.jpg', 'Josh2.jpg', 'Josh3.jpg'] },
  { name: 'Saarim Sayed', role: 'Documenter', images: ['Saarim1.jpg', 'Saarim2.jpg', 'Saarim3.jpg'] },
];
export function sizeLabel(bytes) { return bytes < 1_000_000 ? `${Math.round(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`; }
