// =========================
// Year Range Slider with D3
// =========================
(function () {
  const minYear = 2000;
  const maxYear = 2024;
  window.startYear = 2005;
  window.endYear = 2020;

  const width = 1000;
  const height = 80;

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
    updateScene1WithYears(startYear, endYear);
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
        ([year, count]) => ({ year: +year, count, genre })
      ).sort((a, b) => d3.ascending(a.year, b.year))
    }));

    drawLineChart(nested, topGenres, startYear, endYear);
  }

  function drawLineChart(nested, topGenres, startYear, endYear) {
    const margin = { top: 40, right: 220, bottom: 80, left: 80 };

    const containerWidth = document.querySelector("#chart1").clientWidth;
    const width = containerWidth * 0.8 - margin.left - margin.right;

    const buffer = 10;
    const bodyMargin = 32;
    const targetHeight = 792;
    const availableHeight = window.innerHeight
      - document.querySelector("header").offsetHeight
      - document.querySelector(".tab-container").offsetHeight
      - document.querySelector("#slider-container").offsetHeight
      - buffer
      - margin.top
      - margin.bottom
      - bodyMargin
      - 200;

    const height = Math.min(targetHeight, availableHeight);

    d3.select("#chart1").selectAll("*").remove();

    const svg = d3.select("#chart1")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip
    let tooltip = d3.select(".tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    }
    
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

    // Axes + Labels
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

    // Draw lines with animation
    const paths = svg.selectAll(".line")
      .data(nested)
      .join("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", d => color(d.genre))
      .attr("stroke-width", 2.5)
      .attr("d", d => line(d.values))
      .style("filter", "drop-shadow(0px 0px 3px rgba(0,0,0,0.3))");

    paths.each(function () {
      const totalLength = this.getTotalLength();
      d3.select(this)
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeCubic)
        .attr("stroke-dashoffset", 0);
    });

    // Points + Tooltips
    nested.forEach(series => {
      svg.selectAll(`.point-${series.genre}`)
        .data(series.values)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", color(series.genre))
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>${d.genre}</strong><br/>${d.year}: ${d.count} books`)
            .style("left", (event.pageX + 8) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(300).style("opacity", 0);
        });
    });

    // Legend 
    const legend = svg.selectAll(".legend")
      .data(topGenres)
      .join("g")
      .attr("transform", (d, i) => `translate(${width + 30},${i * 24})`)
      .on("mouseover", function (event, genre) {
        svg.selectAll(".line").attr("opacity", d => d.genre === genre ? 1 : 0.1);
        svg.selectAll("circle").attr("opacity", d => d.genre === genre ? 1 : 0.1);
      })
      .on("mouseout", function () {
        svg.selectAll(".line").attr("opacity", 1);
        svg.selectAll("circle").attr("opacity", 1);
      });

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

function loadScene2() {
  const chart1SVG = document.querySelector("#chart1 svg");
  let width = 800, height = 400;

  if (chart1SVG) {
    width = chart1SVG.getAttribute("width");
    height = chart1SVG.getAttribute("height");
  }

  const svg = d3.select("#chart2")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .attr("x", 50)
    .attr("y", 50)
    .text("Scene 2 chart will go here")
    .attr("font-size", "20px");
}

// =============================
// Tab Switching Logic
// =============================
document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.add("hidden"));

            this.classList.add("active");
            const sceneId = this.getAttribute("data-tab");
            document.getElementById(sceneId).classList.remove("hidden");

            if (sceneId === "scene2" && !document.querySelector("#chart2 svg")) {
                loadScene2();
            }
        });
    });
});

// =============================
// Scene 2 Loader 
// =============================
function loadScene2() {
    const svg = d3.select("#chart2")
        .append("svg")
        .attr("width", 800)
        .attr("height", 400);

    svg.append("text")
        .attr("x", 50)
        .attr("y", 50)
        .text("Scene 2 chart will go here")
        .attr("font-size", "20px");
}











