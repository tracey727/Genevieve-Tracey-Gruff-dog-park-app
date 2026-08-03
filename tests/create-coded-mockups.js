const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'mockups');
const logo = fs.readFileSync(path.join(root, 'assets', 'ga-logo-192.png')).toString('base64');
const img = `data:image/png;base64,${logo}`;

const phone = ({ title, eyebrow, body, cards, active = 'Today', emergency = 'Emergency Help', emergencySmall = 'Hold 3 sec for nearby services', slider = false }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
  <rect width="390" height="844" rx="34" fill="#042d1b"/>
  <rect x="7" y="7" width="376" height="830" rx="29" fill="#eef8f1"/>
  <rect x="7" y="7" width="376" height="124" rx="29" fill="#06391f"/>
  <rect x="7" y="103" width="376" height="28" fill="#06391f"/>
  <image href="${img}" x="22" y="26" width="62" height="62" preserveAspectRatio="xMidYMid meet"/>
  <text x="96" y="41" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#c9a227" letter-spacing="1.4">GENEVIEVE APP™</text>
  <text x="96" y="62" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#ffffff">Dog Parks</text>
  <text x="96" y="79" font-family="Arial, sans-serif" font-size="10" font-weight="600" fill="#dcefe4">Safety &amp; Compatibility System</text>
  <rect x="22" y="103" width="346" height="38" rx="11" fill="#ffffff" stroke="#c9a227" stroke-width="2"/>
  <text x="34" y="126" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#06391f">← Back one step</text>
  <text x="354" y="126" text-anchor="end" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#06391f">${title}</text>
  <rect x="18" y="153" width="354" height="126" rx="18" fill="#ffffff" stroke="#c9a227" stroke-width="2"/>
  <text x="34" y="178" font-family="Arial, sans-serif" font-size="10" font-weight="800" fill="#0f6a3d" letter-spacing="1.2">${eyebrow}</text>
  <text x="34" y="205" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#12211a">${body[0]}</text>
  <text x="34" y="230" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#12211a">${body[1] || ''}</text>
  <rect x="34" y="246" width="215" height="22" rx="11" fill="#fff8c7"/>
  <text x="45" y="261" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#5c4c00">${body[2] || ''}</text>
  ${cards.map((card, i) => `<rect x="18" y="${294 + i * 94}" width="354" height="78" rx="16" fill="#ffffff" stroke="rgba(4,45,27,.18)"/><text x="34" y="${321 + i * 94}" font-family="Arial, sans-serif" font-size="14" font-weight="800" fill="#12211a">${card[0]}</text><text x="34" y="${344 + i * 94}" font-family="Arial, sans-serif" font-size="11" fill="#5b6c62">${card[1]}</text>`).join('')}
  ${slider ? '<rect x="36" y="586" width="318" height="62" rx="18" fill="#fff0f0" stroke="#f10b0b" stroke-width="2"/><text x="195" y="609" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="#9b1c1c">Final confirmation</text><rect x="56" y="621" width="278" height="12" rx="6" fill="#efb3b3"/><circle cx="68" cy="627" r="16" fill="#f10b0b"/><text x="195" y="666" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#5b6c62">Slide right to open the 000 dialler</text>' : ''}
  <rect x="14" y="698" width="362" height="61" rx="15" fill="#c60000" stroke="#ffffff" stroke-width="3"/>
  <text x="195" y="724" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#ffffff">${emergency}</text>
  <text x="195" y="743" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#ffffff">${emergencySmall}</text>
  <rect x="7" y="768" width="376" height="69" rx="0" fill="#042d1b"/>
  ${['Today','Journey','Parks','Dogs','More'].map((name, i) => `<rect x="${14 + i * 73}" y="778" width="67" height="46" rx="10" fill="${name === active ? '#c9a227' : '#16442f'}" stroke="rgba(255,255,255,.25)"/><text x="${47.5 + i * 73}" y="806" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="800" fill="${name === active ? '#111111' : '#ffffff'}">${name}</text>`).join('')}
</svg>`;

const screens = [
  ['today-coded.png', {title:'Today',eyebrow:'TODAY’S QUESTION',body:['Is this a suitable park visit','for my dog right now?','Checks needed · choose dog and park'],cards:[['Today’s live snapshot','Weather, park needs and quick status'],['GENEVIEVE risk scale','Green · Yellow · Amber · Red'],['Plan the whole journey','Before leaving → travel → park → home']],active:'Today'}],
  ['membership-coded.png', {title:'Emergency Help',eyebrow:'NEARBY SERVICE CHOOSER',body:['Use suburb or request','current device location','No service is contacted automatically'],cards:[['Nearest emergency veterinarian','Open current nearby results in Google Maps'],['Council ranger · pound · shelter','Find the relevant local service'],['RSPCA · rescue · wildlife help','Check hours, distance and phone number']],active:'More'}],
  ['emergency-coded.png', {title:'Triple Zero',eyebrow:'PROTECTED 000 CONTROL',body:['Immediate danger only.','Hold, then confirm.','GENEVIEVE does not dispatch help'],cards:[['Step 1 · Hold 000 for 3 seconds','Interrupted touch or pointer cancels safely'],['Step 2 · Deliberate slide','Only then request the device dialler']],active:'More',slider:true}]
];

async function run() {
  for (const [name, options] of screens) await sharp(Buffer.from(phone(options))).png().toFile(path.join(output, name));
  const panels = await Promise.all(screens.map(([name]) => sharp(path.join(output, name)).resize(390, 844).toBuffer()));
  const composite = [{input: Buffer.from('<svg width="1320" height="1040" xmlns="http://www.w3.org/2000/svg"><rect width="1320" height="1040" fill="#dcefe4"/><text x="660" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#06391f">GENEVIEVE Dog Parks · coded launch candidate</text><text x="660" y="89" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#0f6a3d">Persistent Emergency hub · nearby animal services · separately protected Triple Zero</text></svg>'), left:0, top:0}];
  panels.forEach((input, index) => composite.push({input, left:55 + index * 425, top:130}));
  await sharp({create:{width:1320,height:1040,channels:4,background:'#dcefe4'}}).composite(composite).png().toFile(path.join(output,'genevieve-coded-screen-mockups.png'));
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
