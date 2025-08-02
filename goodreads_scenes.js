// =========================
// Year Range Slider with D3
// =========================
(function() {
  const minYear = 2000;
  const maxYear = 2025;
  let startYear = 2005;
  let endYear = 2020;

  const width = 1000;
  const height = 100;

  const svg = d3.select("#yearSlider")
    .attr("width", width + 100)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([50, width + 50])
    .clamp(true);

  const axis = d3.axisBottom(x)
    .tickFormat(d3.format("d")) 
    .ticks(maxYear - minYear); 

  svg.append("g")
    .attr("class", "slider-axis")
    .attr("transform", `translate(0, ${height / 2 + 20})`)
    .call(axis);
  
  // Track line
  svg.append("line")
    .attr("class", "track")
    .attr("x1", x(minYear))
    .attr("x2", x(maxYear))
    .attr("y1", height / 2)
    .attr("y2", height / 2);

  // Fill line between thumbs
  const fillLine = svg.append("line")
    .attr("class", "track-fill")
    .attr("x1", x(startYear))
    .attr("x2", x(endYear))
    .attr("y1", height / 2)
    .attr("y2", height / 2);

  // Start thumb
  const thumbStart = svg.append("circle")
    .attr("class", "thumb")
    .attr("r", 8)
    .attr("cx", x(startYear))
    .attr("cy", height / 2)
    .call(d3.drag().on("drag", draggedStart));

  // End thumb
  const thumbEnd = svg.append("circle")
    .attr("class", "thumb")
    .attr("r", 8)
    .attr("cx", x(endYear))
    .attr("cy", height / 2)
    .call(d3.drag().on("drag", draggedEnd));

  function draggedStart(event) {
    let newVal = Math.round(x.invert(event.x));
    if (newVal >= minYear && newVal < endYear) {
      startYear = newVal;
      update();
    }
  }

  function draggedEnd(event) {
    let newVal = Math.round(x.invert(event.x));
    if (newVal <= maxYear && newVal > startYear) {
      endYear = newVal;
      update();
    }
  }

  function update() {
    thumbStart.attr("cx", x(startYear));
    thumbEnd.attr("cx", x(endYear));
    fillLine.attr("x1", x(startYear)).attr("x2", x(endYear));
    d3.select("#yearStart").text(startYear);
    d3.select("#yearEnd").text(endYear);

    updateScene1WithYears(startYear, endYear);
  }

// =============================
// Scene 1: Genre Timeline Chart
// =============================
let allData = [];

d3.csv("Book_Details.csv").then(data => {
  const processed = [];

data.forEach(d => {
    let year = null;
    if (d.publication_info) {
      const match = d.publication_info.match(/\b(19|20)\d{2}\b/);
      if (match) {
        year = +match[0];
      }
    }
    if (!year || isNaN(year)) return;

    let genres = [];
    try {
      genres = JSON.parse(d.genres.replace(/'/g, '"')); 
    } catch (e) {
      genres = [];
    }
  
    genres.forEach(g => {
      processed.push({
        year: year,
        genre: g.trim()
      });
    });
  });

  allData = processed;
  updateScene1WithYears(2005, 2020);
});


function updateScene1WithYears(startYear, endYear) {
  const filtered = allData.filter(d => d.year >= startYear && d.year <= endYear);

  const topGenres = Array.from(
    d3.rollup(filtered, v => v.length, d => d.genre),
    ([genre, total]) => ({ genre, total })
  )
    .sort((a, b) => d3.descending(a.total, b.total))
    .slice(0, 5)
    .map(d => d.genre);

  const nested = topGenres.map(genre => ({
    genre,
    values: Array.from(
      d3.rollup(
        filtered.filter(d => d.genre === genre),
        v => v.length,
        d => d.year
      ),
      ([year, count]) => ({ year: +year, count })
    ).sort((a, b) => d3.ascending(a.year, b.year))
  }));

  drawLineChart(nested, topGenres, startYear, endYear);
}

function drawLineChart(nested, topGenres, startYear, endYear) {
  const margin = { top: 40, right: 200, bottom: 60, left: 80 };
  
  const containerWidth = document.querySelector("#chart1").clientWidth;
  const width = containerWidth * 0.8 - margin.left - margin.right;
  const height = 550 - margin.top - margin.bottom;

  d3.select("#chart1").selectAll("*").remove();

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([startYear, endYear])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(nested, g => d3.max(g.values, v => v.count))])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(topGenres)
    .range(d3.schemeTableau10);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Publication Year");

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Number of Books Published");

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count))
    .curve(d3.curveMonotoneX);

  svg.selectAll(".line")
    .data(nested)
    .join("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", d => color(d.genre))
    .attr("stroke-width", 2.5)
    .attr("d", d => line(d.values));

  nested.forEach(series => {
    svg.selectAll(`.point-${series.genre}`)
      .data(series.values)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.count))
      .attr("r", 3)
      .attr("fill", color(series.genre));
  });

  const legend = svg.selectAll(".legend")
    .data(topGenres)
    .join("g")
    .attr("transform", (d, i) => `translate(${width + 30},${i * 24})`);

  legend.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", color);

  legend.append("text")
    .attr("x", 20)
    .attr("y", 7)
    .attr("dy", "0.32em")
    .style("font-size", "14px")
    .text(d => d);
}

update();

window.addEventListener("resize", () => {
  updateScene1WithYears(startYear, endYear);
});

})();


