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

// SCENE 1
function Scene1() {
  console.log("Scene 1: Genre Trends Timeline");

  d3.csv("Book_Details.csv").then(data => {
    const genreYearCounts = {};
    const genreTotalCounts = {};

    data.forEach(row => {
      const year = extractYear(row.publication_info);
      if (!year) return;

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

    // Find available years
    const allYears = Array.from(
      new Set(Object.values(genreYearCounts).flatMap(yearsObj => Object.keys(yearsObj).map(Number)))
    ).sort((a, b) => a - b);

    // Populate year sliders from data
    const minYear = d3.min(allYears) || 2000;
    const maxYear = d3.max(allYears) || 2020;

    const yearMinSlider = document.getElementById("year-min");
    const yearMaxSlider = document.getElementById("year-max");
    const yearMinLabel = document.getElementById("year-min-label");
    const yearMaxLabel = document.getElementById("year-max-label");

    yearMinSlider.min = minYear;
    yearMinSlider.max = maxYear;
    yearMinSlider.value = minYear;
    yearMinLabel.textContent = minYear;

    yearMaxSlider.min = minYear;
    yearMaxSlider.max = maxYear;
    yearMaxSlider.value = maxYear;
    yearMaxLabel.textContent = maxYear;

    // Populate genre multi-select
    const genreSelect = document.getElementById("genre-select");
    genreSelect.innerHTML = "";
    Object.keys(genreTotalCounts).sort().forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreSelect.appendChild(opt);
    });

    // Function to update chart based on filters
    function updateScene1() {
      const yearMin = +yearMinSlider.value;
      const yearMax = +yearMaxSlider.value;
      yearMinLabel.textContent = yearMin;
      yearMaxLabel.textContent = yearMax;

      const selectedGenres = Array.from(genreSelect.selectedOptions).map(o => o.value);
      let chosenGenres;
      if (selectedGenres.length > 0) {
        chosenGenres = selectedGenres;
      } else {
        chosenGenres = Object.entries(genreTotalCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(d => d[0]);
      }

      const stackedData = allYears.map(year => {
        const entry = { year };
        chosenGenres.forEach(genre => {
          entry[genre] = genreYearCounts[genre]?.[year] || 0;
        });
        return entry;
      });

      const filteredData = stackedData.filter(d => d.year >= yearMin && d.year <= yearMax);
      drawGenreTrendsTimeline(filteredData, chosenGenres);
    }

    yearMinSlider.addEventListener("input", updateScene1);
    yearMaxSlider.addEventListener("input", updateScene1);
    genreSelect.addEventListener("change", updateScene1);

    updateScene1();
  });
}

// Draw line chart for Scene 1
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

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);
  const line = d3.line()
    .defined(d => d.value !== 0)
    .x(d => x(d.year))
    .y(d => y(d.value));

  // Draw lines
  keys.forEach(key => {
    const lineData = data.map(d => ({ year: d.year, value: d[key] || 0 }));
    g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", color(key))
      .attr("stroke-width", 2)
      .attr("d", line);
  });

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g").call(d3.axisLeft(y));

  // Labels
  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + 35)
    .text("Publishing Year");

  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", - (height / 2) - margin.top)
    .attr("y", 15)
    .text("Number of Books");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 10},${margin.top})`);

  keys.forEach((key, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(key));
    row.append("text").attr("x", 16).attr("y", 10).text(key).style("font-size", "12px");
  });
}

// SCENE 2
function Scene2() {
  console.log("Scene 2: Top Genres per Year");
}

// SCENE 3
function Scene3() {
  console.log("Scene 3: Drilldown by Genre");
}
