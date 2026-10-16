import { writeFile, readFile } from 'node:fs/promises';
// The deployed gh-pages branch has no CNAME. Preserve that live configuration.
await writeFile('dist/.nojekyll', '');
await writeFile('dist/404.html', `<!doctype html><html lang="en"><meta charset="utf-8"><title>7110A archive</title><p>Opening the archived page… <a href="./">Open the archive</a></p><script>
const parts=location.pathname.split('/').filter(Boolean);const repo=parts[0]==='7110A-Website';const base=repo?'/7110A-Website/':'/';const route=parts.slice(repo?1:0);const page=(route[0]||'').toLowerCase();const model=(route[1]||'').toLowerCase();const target=page==='members'?'team':page==='blocks'?'planner':page==='cads'?(model?'cad/'+encodeURIComponent(model):'cad'):'home';location.replace(base+'#'+target);</script></html>`);
const manifest = { originalWebsiteCommit:'6225069cd4ed532a59c2232d0122f965ce862758', originalTeamSeason:'2023–24', codeLab:JSON.parse(await readFile('public/code-lab/provenance.json','utf8')), build:'7110a-engineering-archive-2' };
await writeFile('dist/archive-source.json', JSON.stringify(manifest,null,2)+'\n');
console.log('Archive built with existing project-site configuration, legacy-route fallback, and code-lab provenance.');
