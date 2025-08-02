// =========================
// Shared Variables & Data Loader
// =========================
let allData = [];
let allReviewsData = [];
let dataLoaded = false;

const minYear = 2000;
const maxYear = 2024;
window.startYear = 2005;
window.endYear = 2020;

function loadDataOnce(callback) {
  if (dataLoaded) {
    callback();
    return;
  }

  d3.csv("Book_Details.csv").then(data => {
    const processedGenres = [];
    data.forEach(d => {
      let year = null;
      if (d.publication_info) {
        const match = d.publication_info.match(/\b(19|20)\d{2}\b/);
        if (match) year = +match[0];
      }
      if (!year || isNaN(year)) return;

      let genres = [];
      try {
        genres = JSON.parse(d.genres.replace(/'/g, '"'));
      } catch (e) {
        genres = [];
      }

      genres.forEach(g => {
        processedGenres.push({
          year: year,
          genre: g.trim()
        });
      });
    });
    allData = processedGenres;

    allReviewsData = data.map(d => {
      let year = null;
      if (d.publication_info) {
        const match = d.publication_info.match(/\b(19|20)\d{2}\b/);
        if (match) year = +match[0];
      }
      return {
        title: d.book_title,
        genre: d.genre || "Unknown",
        year: year,
        average_rating: +d.average_rating || 0,
        num_reviews: +d.num_reviews || 0,
        num_ratings: +d.num_ratings || 0
      };
    }).filter(d => d.year);

    dataLoaded = true;
    callback();
  });
}

// =========================
// Year Range Slider
// =========================
(function () {
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

  svg.append("line")
    .attr("class", "track")
    .attr("x1", x(minYear))
    .attr("x2", x(maxYear))
    .attr("y1", height / 2)
    .attr("y2", height / 2);

  const fillLine = svg.append("line")
    .attr("class", "track-fill")
    .attr("x1", x(startYear))
    .attr("x2", x(endYear))
    .attr("y1", height / 2)
    .attr("y2", height / 2);

  const thumbStart = svg.append("circle")
    .attr("class", "thumb")
    .attr("r", 8)
    .attr("cx", x(startYear))
    .attr("cy", height / 2)
    .call(d3.drag().on("drag", draggedStart));

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

    const activeTab = document.querySelector(".tab-button.active").dataset.tab;
    if (activeTab === "scene1") {
      updateScene1WithYears(startYear, endYear);
    } else if (activeTab === "scene2") {
      updateScene2WithYears(startYear, endYear);
    }
  }

  window.addEventListener("resize", () => update());

  update();
})();

// =============================
// Scene 1
// =============================
function updateScene1WithYears(startYear, endYear) {
  const filtered = allData.filter(d => d.year >= startYear && d.year <= endYear);

  const svg = d3.select("#chart1")
    .attr("width", 900)
    .attr("height", 400);
  svg.selectAll("*").remove();

  const margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d.year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.count)])
    .nice()
    .range([height, 0]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count));

  g.append("path")
    .datum(filtered)
    .attr("fill", "none")
    .attr("stroke", "#ff9900")
    .attr("stroke-width", 2)
    .attr("d", line);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Literary Genre Timeline");
}

// =============================
// Scene 2
// =============================
function updateScene2WithYears(startYear, endYear) {
  const filtered = allReviewsData.filter(d => d.year >= startYear && d.year <= endYear);

  const svg = d3.select("#chart2")
    .attr("width", 900)
    .attr("height", 400);
  svg.selectAll("*").remove();

  const margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(filtered, d => d.year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.likes)])
    .nice()
    .range([height, 0]);

  const r = d3.scaleSqrt()
    .domain([0, d3.max(filtered, d => d.reviewCount)])
    .range([3, 30]);

  g.selectAll("circle")
    .data(filtered)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.likes))
    .attr("r", d => r(d.reviewCount))
    .attr("fill", "rgba(70, 130, 180, 0.7)")
    .attr("stroke", "#333");

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Popularity & Quality");
}

// =============================
// Tab Switcher
// =============================
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(tc => tc.classList.add("hidden"));
    const tabId = btn.dataset.tab;
    document.getElementById(tabId).classList.remove("hidden");

    loadDataOnce(() => {
      if (tabId === "scene1") {
        updateScene1WithYears(startYear, endYear);
      } else if (tabId === "scene2") {
        updateScene2WithYears(startYear, endYear);
      }
    });
  });
});

// =============================
// First Load
// =============================
loadDataOnce(() => {
  updateScene1WithYears(startYear, endYear);
});














