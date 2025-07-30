window.addEventListener("DOMContentLoaded", () => {
  // Tab functionality
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // Hide all scenes
      document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));

      // Show selected scene
      const targetId = button.getAttribute("data-tab");
      document.getElementById(targetId).classList.remove("hidden");

      // Load correct scene
      if (targetId === "scene1") Scene1();
      else if (targetId === "scene2") Scene2();
      else if (targetId === "scene3") Scene3();
    });
  });

  Scene1();
});

// Extract year from publication_info
function extractYear(pubInfo) {
  const match = pubInfo?.match(/(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

const minYear = 2000;
const maxYear = 2025;

const startSlider = document.getElementById("year-start");
const endSlider = document.getElementById("year-end");
const startLabel = document.getElementById("year-start-label");
const endLabel = document.getElementById("year-end-label");

startSlider.min = minYear;
startSlider.max = maxYear;
endSlider.min = minYear;
endSlider.max = maxYear;

startSlider.value = minYear;
endSlider.value = maxYear;
startLabel.textContent = minYear;
endLabel.textContent = maxYear;

let fullData = null;
let genreYearCounts = {};
let genreTotalCounts = {};
let allYears = [];

startSlider.addEventListener("input", updateScene1);
endSlider.addEventListener("input", updateScene1);
document.getElementById("genre-select").addEventListener("change", updateScene1);

// Scene 1
function Scene1() {
  console.log("Scene 1: Genre Trends Timeline");

  d3.csv("Book_Details.csv").then(data => {
    fullData = data;
    genreYearCounts = {};
    genreTotalCounts = {};

    data.forEach(row => {
      const year = extractYear(row.publication_info);
      if (!year || year < 1900 || year > 2025) return;

      let genres = [];
      if (row.genres) {
        genres = row.genres
          .replace(/[\[\]']+/g, "")
          .split(",")
          .map(g => g.trim())
          .filter(g => g.length > 0);
      }

      if (genres.length === 0) return;

      genres.forEach(genre => {
        if (!genreYearCounts[genre]) genreYearCounts[genre] = {};
        if (!genreYearCounts[genre][year]) genreYearCounts[genre][year] = 0;
        genreYearCounts[genre][year]++;
        genreTotalCounts[genre] = (genreTotalCounts[genre] || 0) + 1;
      });
    });

    // Build list of all years
    allYears = Array.from(
      new Set(Object.values(genreYearCounts).flatMap(obj => Object.keys(obj).map(Number)))
    ).sort((a, b) => a - b);

    // Populate genre dropdown
    const genreSelect = document.getElementById("genre-select");
    genreSelect.innerHTML = "";
    Object.keys(genreTotalCounts).sort().forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreSelect.appendChild(opt);
    });

    updateScene1();
  });
}

// Scene 1 redraw
function updateScene1() {
  const startVal = Math.min(+startSlider.value, +endSlider.value - 1);
  const endVal = Math.max(+endSlider.value, +startSlider.value + 1);
  startSlider.value = startVal;
  endSlider.value = endVal;
  startLabel.textContent = startVal;
  endLabel.textContent = endVal;

  const genreSelect = document.getElementById("genre-select");
  const selectedGenres = Array.from(genreSelect.selectedOptions).map(o => o.value);
  const chosenGenres = selectedGenres.length > 0
    ? selectedGenres
    : Object.entries(genreTotalCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0]);

  const stackedData = allYears.map(year => {
    const entry = { year };
    chosenGenres.forEach(genre => {
      entry[genre] = genreYearCounts[genre]?.[year] || 0;
    });
    return entry;
  });

  const filtered = stackedData.filter(d => d.year >= startVal && d.year <= endVal);
  drawGenreTrendsTimeline(filtered, chosenGenres);
}

// Chart
function drawGenreTrendsTimeline(data, keys) {
  d3.select("#chart1").html("");

  const margin = { top: 40, right: 150, bottom: 50, left: 60 },
        width = Math.max(window.innerWidth * 0.6, 800) - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, width]);

  const maxY = d3.max(data, d => d3.max(keys, k => d[k]));
  const y = d3.scaleLinear()
    .domain([0, maxY])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);
  const line = d3.line()
    .defined(d => d.value !== 0)
    .x(d => x(d.year))
    .y(d => y(d.value));

  keys.forEach(key => {
    const lineData = data.map(d => ({ year: d.year, value: d[key] || 0 }));
    g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", color(key))
      .attr("stroke-width", 2)
      .attr("d", line);
  });

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + 35)
    .attr("text-anchor", "middle")
    .text("Publishing Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", - (height / 2) - margin.top)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("Number of Books");

  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 10},${margin.top})`);

  keys.forEach((key, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(key));
    row.append("text").attr("x", 16).attr("y", 10).text(key).style("font-size", "12px");
  });
}

// Scene 2 & 3 
function Scene2() {
  console.log("Scene 2: Top Genres per Year");
}
function Scene3() {
  console.log("Scene 3: Drilldown by Genre");
}
