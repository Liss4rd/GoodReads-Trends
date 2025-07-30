// Tab functionality
document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));

    // Show selected tab content
    const targetId = button.getAttribute("data-tab");
    document.getElementById(targetId).classList.remove("hidden");
  });
});


function Scene1() {
  console.log("Scene 1: Genre Trends Timeline");

  d3.select("#chart1").selectAll("*").remove();

  const margin = { top: 40, right: 80, bottom: 40, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Test data
  const data = [
    { year: 2010, fantasy: 100, romance: 90, scifi: 40 },
    { year: 2011, fantasy: 110, romance: 95, scifi: 55 },
    { year: 2012, fantasy: 115, romance: 100, scifi: 60 },
    { year: 2013, fantasy: 130, romance: 105, scifi: 70 },
    { year: 2014, fantasy: 125, romance: 110, scifi: 85 },
    { year: 2015, fantasy: 140, romance: 120, scifi: 95 }
  ];

  const keys = ["fantasy", "romance", "scifi"];

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d3.max(keys, key => d[key]))])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#8e44ad", "#e74c3c", "#3498db"]);

  const line = d3.line()
    .x(d => x(d.year))
    .y((d, i, arr) => y(d[arr[i].key]));

  keys.forEach((key, i) => {
    const genreData = data.map(d => ({ year: d.year, [key]: d[key], key }));
    svg.append("path")
      .datum(genreData)
      .attr("fill", "none")
      .attr("stroke", color(key))
      .attr("stroke-width", 2)
      .attr("d", line);
  });

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Legend
  const legend = svg.selectAll(".legend")
    .data(keys)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`);

  legend.append("rect")
    .attr("x", 0)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => color(d));

  legend.append("text")
    .attr("x", 15)
    .attr("y", 10)
    .text(d => d);
}

function Scene2() {
  // Scene2
  console.log("Scene 2: Top Genres per Year");
}

function Scene3() {
  // Scene3
  console.log("Scene 3: Drilldown by Genre");
}

// User Exploration
function BookCards() {
  d3.csv("Book_Details.csv").then(data => {
    const container = d3.select("#vis-container");
    container.selectAll(".book-card")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "book-card")
      .html(d => `
        <img src="${d.cover_image_uri}" alt="Book cover" class="book-cover" />
        <div class="book-title">${d.book_title || 'No title'}</div>
        <div class="book-author">${d.author || 'Unknown author'}</div>
      `);
  });
}

// Initialized scene 
Scene1();

document.querySelector("[data-tab='scene1']").addEventListener("click", Scene1);
document.querySelector("[data-tab='scene2']").addEventListener("click", Scene2);
document.querySelector("[data-tab='scene3']").addEventListener("click", Scene3);
