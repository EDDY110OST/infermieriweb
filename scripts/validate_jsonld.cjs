const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const s = fs.readFileSync(file, 'utf8');
const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
const m = s.match(re);
if(!m){
  console.error('JSON-LD not found');
  process.exit(2);
}
const json = m[1].trim();
try{
  const obj = JSON.parse(json);
  console.log('JSON-LD parsed OK');
  console.log(JSON.stringify(obj, null, 2));
}catch(e){
  console.error('JSON parse error:', e.message);
  process.exit(1);
}
