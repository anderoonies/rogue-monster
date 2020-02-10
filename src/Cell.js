const c = require("chalk");
const chalk = new c.Instance({ enabled: true, level: 3 });

export default function Cell(character, color, bg) {
  return chalk.bgHex(bg ? bg : "#eee").hex(color ? color : "#aaa")(character);
}

const floorCell = Cell(".", shadeHexColor("#eee", .6), "#ddd");
export { floorCell };

function shadeHexColor(color, percent) {
  var f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}
