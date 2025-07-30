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
      if (targetId === "scene2") Scene2();
      if (targetId === "scene3") Scene3();
    });
  });

  // Load initial scene
  Scene1();
});

// SCENE 1
function Scene1() {
  d3.csv("Book_Details.csv").then(data => {
    const genreYearMap = {};

    data.forEach(row => {
      const year = +row.publication_year || +row.year || null;
      const genres = row.genres ? row.genres.split(",").map(g => g.trim()) : [];

      if (!year || genres.length === 0) return;

      genres.forEach(genre => {
        if (!genreYearMap[genre]) genreYearMap[genre] = {};
        genreYearMap[genre][year] = (genreYearMap[genre][year] || 0) + 1;
      });
    });

    const flatData = [];
    Object.entries(genreYearMap).forEach(([genre, yearCounts]) => {
      Object.entries(yearCounts).forEach(([year, count]) => {
        flatData.push({ genre, year: +year, count: +count });
      });
    });

    drawGenreTimeline(flatData);
  });
}

function drawGenreTimeline(data) {
  d3.select("#chart1").html("");

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 40, right: 150, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
  const genres = [...new Set(data.map(d => d.genre))];

  const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(genres);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count));

  const genreData = genres.map(genre => {
    const filtered = data.filter(d => d.genre === genre);
    return {
      genre,
      values: years.map(year => {
        const found = filtered.find(d => d.year === year);
        return { year, count: found ? found.count : 0 };
      })
    };
  });

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g").call(d3.axisLeft(y));

  g.selectAll(".line")
    .data(genreData)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d.genre))
    .attr("stroke-width", 1.5)
    .attr("d", d => line(d.values));

  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 10},${margin.top})`);

  genres.slice(0, 10).forEach((genre, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(genre));
    row.append("text").attr("x", 16).attr("y", 10).text(genre).style("font-size", "12px");
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
