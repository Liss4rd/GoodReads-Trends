window.addEventListener("DOMContentLoaded", () => {
  // Year Slider Setup
  const minYear = 2000;
  const maxYear = 2025;

  const startYearInput = document.getElementById("year-start");
  const endYearInput = document.getElementById("year-end");
  const yearStartLabel = document.getElementById("year-start-label");
  const yearEndLabel = document.getElementById("year-end-label");

  startYearInput.min = minYear;
  startYearInput.max = maxYear;
  endYearInput.min = minYear;
  endYearInput.max = maxYear;

  startYearInput.value = minYear;
  endYearInput.value = maxYear;

  function updateSliderFill() {
    const start = parseInt(startYearInput.value);
    const end = parseInt(endYearInput.value);
    const range = maxYear - minYear;

    const startPercent = ((start - minYear) / range) * 100;
    const endPercent = ((end - minYear) / range) * 100;

    const gradient = `linear-gradient(to right, 
      #ccc ${startPercent}%, 
      #4CAF50 ${startPercent}%, 
      #4CAF50 ${endPercent}%, 
      #ccc ${endPercent}%)`;

    startYearInput.style.background = gradient;
    endYearInput.style.background = gradient;
  }

  function updateYearSlider() {
    let start = parseInt(startYearInput.value);
    let end = parseInt(endYearInput.value);

    // prevent overlap
    if (start >= end) {
      if (this === startYearInput) {
        start = end - 1;
        startYearInput.value = start;
      } else {
        end = start + 1;
        endYearInput.value = end;
      }
    }

    yearStartLabel.textContent = start;
    yearEndLabel.textContent = end;

    updateSliderFill();
    updateScene1();
  }

  startYearInput.addEventListener("input", updateYearSlider);
  endYearInput.addEventListener("input", updateYearSlider);

  updateSliderFill();
  yearStartLabel.textContent = startYearInput.value;
  yearEndLabel.textContent = endYearInput.value;

  // Genre Search + Chips
  const genreInput = document.getElementById("genre-input");
  const genreSuggestions = document.getElementById("genre-suggestions");
  const selectedGenresContainer = document.getElementById("selected-genres");

  let allGenres = [];
  let selectedGenres = [];

  function renderSuggestions(filtered) {
    genreSuggestions.innerHTML = "";
    if (filtered.length > 0) {
      genreSuggestions.style.display = "block";
      filtered.forEach(genre => {
        const div = document.createElement("div");
        div.textContent = genre;
        div.addEventListener("click", () => selectGenre(genre));
        genreSuggestions.appendChild(div);
      });
    } else {
      genreSuggestions.style.display = "none";
    }
  }

  function selectGenre(genre) {
    if (!selectedGenres.includes(genre) && selectedGenres.length < 5) {
      selectedGenres.push(genre);
      renderSelectedGenres();
    }
    genreSuggestions.style.display = "none";
    genreInput.value = "";
    updateScene1();
  }

  function renderSelectedGenres() {
    selectedGenresContainer.innerHTML = "";
    selectedGenres.forEach(genre => {
      const chip = document.createElement("div");
      chip.classList.add("genre-chip");
      chip.innerHTML = `${genre} <span>&times;</span>`;
      chip.querySelector("span").addEventListener("click", () => {
        selectedGenres = selectedGenres.filter(g => g !== genre);
        renderSelectedGenres();
        updateScene1();
      });
      selectedGenresContainer.appendChild(chip);
    });
  }

  genreInput.addEventListener("input", () => {
    const query = genreInput.value.toLowerCase();
    if (query.length === 0) {
      genreSuggestions.style.display = "none";
      return;
    }
    const filtered = allGenres.filter(
      g => g.toLowerCase().includes(query) && !selectedGenres.includes(g)
    );
    renderSuggestions(filtered);
  });

  // Scene 1 Data + Setup
  let fullData = [];
  let genreYearCounts = {};
  let genreTotalCounts = {};
  let allYears = [];

  function extractYear(pubInfo) {
    const match = pubInfo?.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  function Scene1() {
    d3.csv("Book_Details.csv").then(data => {
      fullData = data;
      genreYearCounts = {};
      genreTotalCounts = {};

      const genreSet = new Set();

      data.forEach(row => {
        const year = extractYear(row.publication_info);
        if (!year || year < 1900 || year > maxYear) return;

        let genres = [];
        if (row.genres) {
          genres = row.genres
            .replace(/[\[\]']+/g, "")
            .split(",")
            .map(g => g.trim())
            .filter(Boolean);
        }

        genres.forEach(genre => {
          genreSet.add(genre);
          if (!genreYearCounts[genre]) genreYearCounts[genre] = {};
          if (!genreYearCounts[genre][year]) genreYearCounts[genre][year] = 0;
          genreYearCounts[genre][year]++;
          genreTotalCounts[genre] = (genreTotalCounts[genre] || 0) + 1;
        });
      });

      allGenres = Array.from(genreSet).sort();
      allYears = Array.from(
        new Set(Object.values(genreYearCounts).flatMap(obj => Object.keys(obj).map(Number)))
      ).sort((a, b) => a - b);

      updateScene1();
    });
  }

  // Scene 1 Update Logic
  function updateScene1() {
    const startVal = parseInt(startYearInput.value);
    const endVal = parseInt(endYearInput.value);

    const chosenGenres = selectedGenres.length > 0
      ? selectedGenres
      : Object.entries(genreTotalCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(d => d[0]);

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

  // Chart Drawing
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

  // Load scene
  Scene1();
});

// Scene 2 & 3 
function Scene2() {
  console.log("Scene 2: Top Genres per Year");
}
function Scene3() {
  console.log("Scene 3: Drilldown by Genre");
}
