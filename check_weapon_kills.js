const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  let totalMatches = data.length;
  let matchesWithWeaponKills = 0;
  let totalKills = 0;
  let totalWeaponKills = 0;

  data.forEach(match => {
    match.team.forEach(player => {
      totalKills += player.kills;
      const wk = player.weaponKills || player.weapons || {};
      const wkCount = Object.values(wk).reduce((a, b) => a + b, 0);
      totalWeaponKills += wkCount;
      
      if (wkCount > 0) {
        matchesWithWeaponKills++;
      }
    });
  });

  const output = `Total matches: ${totalMatches}\nTotal kills (stats): ${totalKills}\nTotal weapon kills (telemetry): ${totalWeaponKills}\nMatches with weapon kills: ${matchesWithWeaponKills}`;
  console.log(output);
  fs.writeFileSync('check_output.txt', output);

} catch (e) {
  console.error(e);
}
