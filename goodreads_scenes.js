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

      // Load the correct scene
      if (targetId === "scene1") Scene1();
      else if (targetId === "scene2") Scene2();
      else if (targetId === "scene3") Scene3();
    });
  });

  // Load initial scene
  Scene1();
});

// Publication info func
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
    if (!year) console.warn("Missing year for row:", row);

    let genres = [];
    if (row.genres) {
      genres = row.genres
        .replace(/[\[\]']+/g, "")  
        .split(",")
        .map(g => g.trim())
        .filter(g => g.length > 0);
    }

    if (!year || genres.length === 0) return;

    // Count genres per year
    genres.forEach(genre => {
      if (!genreYearCounts[genre]) genreYearCounts[genre] = {};
      if (!genreYearCounts[genre][year]) genreYearCounts[genre][year] = 0;
      genreYearCounts[genre][year] += 1;

      // Count total genre mentions
      genreTotalCounts[genre] = (genreTotalCounts[genre] || 0) + 1;
    });
  });

  // Sort genres by total count descending and take top 15
  const topGenres = Object.entries(genreTotalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(d => d[0]);

  console.log("Top 15 genres:", topGenres);

  const allYears = Array.from(
    new Set(Object.values(genreYearCounts).flatMap(yearsObj => Object.keys(yearsObj).map(Number)))
  ).sort((a, b) => a - b);

  // Prepare data for top genres only
  const stackedData = allYears.map(year => {
    const entry = { year };
    topGenres.forEach(genre => {
      entry[genre] = genreYearCounts[genre]?.[year] || 0;
    });
    return entry;
  });

  const filteredData = stackedData.filter(d => d.year >= 2000 && d.year <= 2020);

  drawGenreTrendsTimeline(filteredData, topGenres);
});
}

function drawGenreTrendsTimeline(data, keys) {
  d3.select("#chart1").html(""); //

  const margin = { top: 40, right: 150, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, width]);

  const maxY = d3.max(data, d => d3.max(keys, k => d[k]));
  console.log("Max Y (count):", maxY);

  const y = d3.scaleLinear()
    .domain([0, maxY])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);

  const line = d3.line()
    .defined(d => d.value !== 0)
    .x(d => x(d.year))
    .y(d => y(d.value));

  // Just plot top 3 genres for testing
  const topKeys = keys.slice(0, 3);

  topKeys.forEach(key => {
    const lineData = data.map(d => ({ year: d.year, value: d[key] || 0 }));
    console.log(`Drawing line for ${key}:`, lineData);
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

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 10},${margin.top})`);

  topKeys.forEach((key, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(key));
    row.append("text").attr("x", 16).attr("y", 10).text(key).style("font-size", "12px");
  });
}

// SCENE 2
function Scene2() {
  console.log("Scene 2: Top Genres per Year");

  d3.csv("Book_Details.csv").then(data => {
    const genreYearRatings = {};

    data.forEach(row => {
      const year = extractYear(row.publication_info);
      const rating = parseFloat(row.average_rating);
      const genres = row.genres ? row.genres.split(",").map(g => g.trim()) : [];

      if (!year || !rating || isNaN(rating) || genres.length === 0) return;

      genres.forEach(genre => {
        if (!genreYearRatings[year]) genreYearRatings[year] = {};
        if (!genreYearRatings[year][genre]) genreYearRatings[year][genre] = { total: 0, count: 0 };

        genreYearRatings[year][genre].total += rating;
        genreYearRatings[year][genre].count += 1;
      });
    });

    const topGenres = Object.entries(genreYearRatings).map(([year, genres]) => {
      let topGenre = null;
      let topAvg = -Infinity;

      Object.entries(genres).forEach(([genre, stats]) => {
        const avg = stats.total / stats.count;
        if (avg > topAvg) {
          topAvg = avg;
          topGenre = genre;
        }
      });

      return {
        year: +year,
        genre: topGenre,
        avgRating: +topAvg.toFixed(2)
      };
    }).sort((a, b) => a.year - b.year);

    drawTopGenrePerYear(topGenres);
  });
}

function drawTopGenrePerYear(data) {
  d3.select("#chart2").html(""); 

  const svg = d3.select("#chart2")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 40, right: 20, bottom: 50, left: 100 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.avgRating)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, height])
    .padding(0.2);

  const color = d3.scaleOrdinal(d3.schemeSet2);

  g.append("g").call(d3.axisLeft(y).tickFormat(d3.format("d")));

  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", d => y(d.year))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.avgRating))
    .attr("fill", d => color(d.genre));

  // Add labels
  g.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => x(d.avgRating) + 5)
    .attr("y", d => y(d.year) + y.bandwidth() / 2 + 4)
    .text(d => `${d.genre} (${d.avgRating})`)
    .style("font-size", "12px")
    .style("fill", "#444");
}

// SCENE 3
function Scene3() {
  console.log("Scene 3: Drilldown by Genre");

}
