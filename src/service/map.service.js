var archifacile = require("./loadPlan.json");

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var jsdom = require("jsdom");
const { JSDOM } = jsdom;

const d3 = require("d3");

const dom = new JSDOM("<!DOCTYPE html><body></body>");

const body = d3.select(dom.window.document.querySelector("body"));
const svg = body.append("svg").attr("xmlns", "http://www.w3.org/2000/svg");
const { minX, minY, maxX, maxY } = parseWall(archifacile, svg);

parseHole(archifacile, svg);

for (const plan of archifacile.data.plan.plans) {
  for (const room of plan.pieces) {
    svg.selectAll(`.wall.ofroom${room.id}`).style("stroke", getRandomColor());
  }
}

svg.style("width", "100%");
svg.attr("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

function parseHole(houseDescription, svg) {
  for (const plan of houseDescription.data.plan.plans) {
    for (const hole of plan.trous) {
      const wall = svg.select(`#wall${hole.imur}`);
      const isHorizontal = wall.attr("x1") === wall.attr("x2");
      const x = isHorizontal
        ? wall.attr("x2")
        : Math.min(wall.attr("x1"), wall.attr("x2")) + hole.dcoin1;
      const y = !isHorizontal
        ? wall.attr("y2")
        : Math.min(wall.attr("y1"), wall.attr("y2")) + hole.dcoin1;

      const w = !isHorizontal ? hole.large : wall.attr("epais");
      const h = isHorizontal ? hole.large : wall.attr("epais");

      svg
        .append("rect")
        .attr("x", x - w / 2)
        .attr("y", y - h / 2)
        .attr("width", w)
        .attr("height", h)
        .style("fill", "blue");
    }
  }
}

function parseWall(houseDescription, svg) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const plan of houseDescription.data.plan.plans) {
    for (const wall of plan.murs) {
      minX = Math.min(minX, wall.x1 - wall.epais, wall.x2 - wall.epais);
      minY = Math.min(minY, wall.y1 - wall.epais, wall.y2 - wall.epais);

      maxX = Math.max(maxX, wall.x1 + wall.epais, wall.x2 + wall.epais);
      maxY = Math.max(maxY, wall.y1 + wall.epais, wall.y2 + wall.epais);

      svg
        .append("line")
        .attr("id", `wall${wall.id}`)
        .attr("x1", wall.x1)
        .attr("y1", wall.y1)
        .attr("x2", wall.x2)
        .attr("y2", wall.y2)
        .attr("epais", wall.epais)
        .style("stroke-width", wall.epais)
        .style("stroke", "orange")
        .style("stroke-linecap", "square")

        //.attr("class", `wall ofroom${wall.cote[0].iPiece}`);

        .attr(
          "class",
          `wall ${wall.cote.map((e) => `ofroom${e.iPiece}`).join(" ")}`
        );
    }
  }
  return {
    minX,
    minY,
    maxX,
    maxY
  };
}

module.exports = {
  getMap: () => body.html()
};
