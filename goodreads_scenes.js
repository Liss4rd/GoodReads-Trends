(function () {
  const state = {
    minYear: 2000,
    maxYear: 2024,
    startYear: 2005,
    endYear: 2020,
    allData: [],
    allReviewsData: []
  };

    let reviewsLoaded = false;
  
  // =========================
  // Load Scene 2 Data
  // =========================
  d3.csv("Book_Details.csv").then(data => {
    state.allReviewsData = data.map(d => {
      let year = null;
      if (d.publication_info) {
        const match = d.publication_info.match(/\b(19|20)\d{2}\b/);
        if (match) year = +match[0];
      }
    
      let fiveStarCount = 0;
      if (d.rating_distribution) {
        try {
          const dist = JSON.parse(d.rating_distribution.replace(/'/g, '"'));
          fiveStarCount = +((dist["5"] || "0").replace(/,/g, ""));
        } catch (e) {
          fiveStarCount = 0;
        }
      }

      let mainGenre = "Other";
      if (d.genres) {
        try {
          const genreArray = JSON.parse(d.genres.replace(/'/g, '"'));
          if (Array.isArray(genreArray) && genreArray.length > 0) {
            mainGenre = genreArray[0];
          }
        } catch {
          mainGenre = d.genres;
        }
      }
      
      return {
        ...d,
        year: year || null,
        average_rating: +d.average_rating || 0,
        review_count: +((d.num_reviews || "").replace(/,/g, "")) || 0,
        fiveStarCount: fiveStarCount,
        mainGenre: mainGenre,     
        allGenres: d.genres || ""
      };
    }).filter(d => d.year);

      if (!state.genreColor) {
        state.genreColor = d3.scaleOrdinal()
          .domain([...new Set(state.allReviewsData.map(d => d.mainGenre))])
          .range(d3.schemeTableau10);
      }
  
    reviewsLoaded = true;

    if (!d3.select("#scene2").classed("hidden")) {
      updateScene2WithYears();
    }
  });

  // =========================
  // Year Range Slider with D3
  // =========================
  const width = 1000;
  const height = 80;

  const svg = d3.select("#yearSlider")
    .attr("width", width + 100)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([state.minYear, state.maxYear])
    .range([50, width + 50])
    .clamp(true);

  const axis = d3.axisBottom(x)
    .tickFormat(d3.format("d"))
    .ticks(state.maxYear - state.minYear);

  svg.append("g")
    .attr("class", "slider-axis")
    .attr("transform", `translate(0, ${height / 2 + 20})`)
    .call(axis);

  svg.append("line")
    .attr("class", "track")
    .attr("x1", x(state.minYear))
    .attr("x2", x(state.maxYear))
    .attr("y1", height / 2)
    .attr("y2", height / 2);

  const fillLine = svg.append("line")
    .attr("class", "track-fill")
    .attr("x1", x(state.startYear))
    .attr("x2", x(state.endYear))
    .attr("y1", height / 2)
    .attr("y2", height / 2);

  const thumbStart = svg.append("circle")
    .attr("class", "thumb")
    .attr("r", 8)
    .attr("cx", x(state.startYear))
    .attr("cy", height / 2)
    .call(d3.drag().on("drag", draggedStart));

  const thumbEnd = svg.append("circle")
    .attr("class", "thumb")
    .attr("r", 8)
    .attr("cx", x(state.endYear))
    .attr("cy", height / 2)
    .call(d3.drag().on("drag", draggedEnd));

  function draggedStart(event) {
    let newVal = Math.round(x.invert(event.x));
    if (newVal >= state.minYear && newVal < state.endYear) {
      state.startYear = newVal;
      updateSlider();
    }
  }

  function draggedEnd(event) {
    let newVal = Math.round(x.invert(event.x));
    if (newVal <= state.maxYear && newVal > state.startYear) {
      state.endYear = newVal;
      updateSlider();
    }
  }

  function updateSlider() {
    thumbStart.attr("cx", x(state.startYear));
    thumbEnd.attr("cx", x(state.endYear));
    fillLine.attr("x1", x(state.startYear)).attr("x2", x(state.endYear));
    d3.select("#yearStart").text(state.startYear);
    d3.select("#yearEnd").text(state.endYear);

    if (!d3.select("#scene1").classed("hidden")) {
      updateScene1WithYears();
    } else if (!d3.select("#scene2").classed("hidden")) {
      updateScene2WithYears();
    }
  }

  // =============================
  // Scene 1: Literary Genre Timeline
  // =============================
  d3.csv("Book_Details.csv").then(data => {
    const processed = [];

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
      } catch {
        genres = [];
      }

      genres.forEach(g => {
        processed.push({ year, genre: g.trim() });
      });
    });

    state.allData = processed;
    updateScene1WithYears();
  });

  function updateScene1WithYears() {
    const filtered = state.allData.filter(d => d.year >= state.startYear && d.year <= state.endYear);

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

    drawLineChart(nested, topGenres);
  }

  function drawLineChart(nested, topGenres) {
    const margin = { top: 40, right: 220, bottom: 80, left: 80 };
    const containerWidth = document.querySelector("#chart1").clientWidth;
    const width = containerWidth * 0.8 - margin.left - margin.right;
    const buffer = 10, bodyMargin = 32, targetHeight = 792;
    const availableHeight = window.innerHeight
      - document.querySelector("header").offsetHeight
      - document.querySelector(".tab-container").offsetHeight
      - document.querySelector("#slider-container").offsetHeight
      - buffer - margin.top - margin.bottom - bodyMargin - 200;
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
      .domain([state.startYear, state.endYear])
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

// =========================
// Scene 2: Popularity & Quality
// =========================
function updateScene2WithYears() {
  if (!reviewsLoaded) {
    console.warn("Scene 2 data not loaded yet.");
    return;
  }

  const filtered = state.allReviewsData.filter(
    d => d.year >= state.startYear && d.year <= state.endYear
  );

  d3.select("#chart2").selectAll("*").remove();

  if (filtered.length === 0) {
    d3.select("#chart2").append("div")
      .style("padding", "20px")
      .style("color", "#666")
      .style("text-align", "center")
      .text("No data available for this year range.");
    return;
  }

  drawBubbleChart(filtered);
}

function drawBubbleChart(data) {
  d3.select("#chart2").selectAll("*").remove();

  const margin = { top: 40, right: 60, bottom: 60, left: 80 };
  const containerWidth = document.querySelector("#chart2").clientWidth;
  const width = containerWidth * 0.8 - margin.left - margin.right;

  const buffer = 10, bodyMargin = 32, targetHeight = 792;
  const availableHeight = window.innerHeight
    - document.querySelector("header").offsetHeight
    - document.querySelector(".tab-container").offsetHeight
    - buffer - margin.top - margin.bottom - bodyMargin - 200;

  const height = Math.min(targetHeight, availableHeight);

  const color = state.genreColor;

  const svg = d3.select("#chart2").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, 5])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.review_count) || 1])
    .range([height, 0]);

  const size = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.fiveStarCount) || 1])
    .range([2, 40]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#000")
    .text("Average Rating");
  
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#000")
    .text("Number of Reviews");

  // Bubbles
  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.average_rating))
    .attr("cy", d => y(d.review_count))
    .attr("r", d => size(d.fiveStarCount))
    .attr("fill", d => color(d.mainGenre || "Other"))
    .attr("opacity", 0.7)
    .attr("stroke", "#333");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg.selectAll("circle")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <strong>${d.book_title || "Unknown Title"}</strong><br/>
        Genre(s): ${d.allGenres}<br/> <!-- full list -->
        Avg Rating: ${d.average_rating}<br/>
        Reviews: ${d.review_count}<br/>
        5* Ratings: ${d.fiveStarCount}
      `)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });
}

  // =========================
  // Scene 3: Genre Exploration
  // =========================
  state.selectedGenres = [];

  function populateGenreDropdown() {
    const genres = [...new Set(state.allReviewsData.map(d => d.mainGenre))].sort();
    const select = d3.select("#genreSelect");
    select.selectAll("option").remove();
    genres.forEach(genre => {
      select.append("option")
        .attr("value", genre)
        .text(genre);
    });
  }
  
  d3.select("#genreSelect").on("change", function() {
    const genre = this.value;
    if (genre && !state.selectedGenres.includes(genre)) {
      state.selectedGenres.push(genre);
      renderGenreChips();
      updateScene3WithYears();
    }
    this.value = "";
  });
  
  // Render chips
  function renderGenreChips() {
    const container = d3.select("#selectedGenresContainer");
    container.selectAll(".genre-chip").remove();
  
    const chips = container.selectAll(".genre-chip")
      .data(state.selectedGenres)
      .enter()
      .append("div")
      .attr("class", "genre-chip");
  
    chips.append("span").text(d => d);
  
    chips.append("span")
      .attr("class", "remove-chip")
      .text("×")
      .on("click", (event, genre) => {
        state.selectedGenres = state.selectedGenres.filter(g => g !== genre);
        renderGenreChips();
        updateScene3WithYears();
      });
  }
  
  // Filter & draw chart
  function updateScene3WithYears() {
    if (!state.selectedGenres.length) {
      d3.select("#chart3").html("<p style='padding:20px;color:#666;'>Select at least one genre to see results.</p>");
      return;
    }
  
    const filtered = state.allReviewsData.filter(d =>
      d.year >= state.startYear &&
      d.year <= state.endYear &&
      state.selectedGenres.every(g =>
        (d.allGenres || "").toLowerCase().includes(g.toLowerCase())
      )
    );
  
    drawScene3BarChart(filtered);
  }
  
function drawScene3BarChart(data) {
    d3.select("#chart3").selectAll("*").remove();
  
    if (!data.length) {
      d3.select("#chart3").append("p")
        .style("padding", "20px")
        .style("color", "#666")
        .text("No books found for selected genres and year range.");
      return;
    }
  
    const margin = { top: 40, right: 30, bottom: 40, left: 80 };
    const width = document.querySelector("#chart3").clientWidth - margin.left - margin.right;
    const height = Math.min(800, data.length * 60);
  
    const svg = d3.select("#chart3")
      .append("svg")
      .attr("width", width + margin.left + margin.right + 60) 
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left + 60},${margin.top})`); 
  
    // Sort & limit to top 20
    const sortedData = data.sort((a, b) => d3.descending(a.review_count, b.review_count)).slice(0, 20);
  
    // Add rank numbers
    sortedData.forEach((d, i) => d.rank = i + 1);
  
    const y = d3.scaleBand()
      .domain(sortedData.map(d => d.rank))
      .range([0, height])
      .padding(0.1);
  
    const x = d3.scaleLinear()
      .domain([0, d3.max(sortedData, d => d.review_count)])
      .nice()
      .range([0, width]);
  
    // Covers
    const covers = d3.select("#chart3 svg").append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    covers.selectAll(".cover")
      .data(sortedData)
      .enter()
      .append("image")
      .attr("xlink:href", d => d.cover_image_uri)
      .attr("x", -25) 
      .attr("y", d => y(d.rank))
      .attr("width", y.bandwidth())
      .attr("height", y.bandwidth())
      .attr("preserveAspectRatio", "xMidYMid slice");

    // Create unique color scale for Scene 3
    const scene3Color = d3.scaleOrdinal()
      .domain(sortedData.map(d => d.book_title))
      .range(d3.schemeTableau10.concat(d3.schemeSet3)); // more colors to reduce repeats
    
    // Bars
    svg.selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.rank))
      .attr("width", d => x(d.review_count))
      .attr("height", y.bandwidth())
      .attr("fill", d => scene3Color(d.book_title))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <strong>${d.book_title}</strong><br/>
          Author: ${d.author}<br/>
          Genres: ${d.allGenres}<br/>
          Avg Rating: ${d.average_rating}<br/>
          Reviews: ${d.review_count}
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", (event, d) => showBookPopup(d));
  
    // Y-axis (rank numbers)
    svg.append("g")
      .call(d3.axisLeft(y));
  
    // X-axis (review count)
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // X-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 7.5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Reviews");
  
    // Y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left - 30) 
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Top Ranked Books");
  
    // Tooltip
    let tooltip = d3.select("body").selectAll(".tooltip").data([null]);
    tooltip = tooltip.enter()
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .merge(tooltip);
  }
  
  // Popup
  function showBookPopup(d) {
    const popup = d3.select("#bookPopup");
    popup.html(`
      <img src="${d.cover_image_uri}" alt="Cover of ${d.book_title}">
      <h3>${d.book_title}</h3>
      <p><strong>Author:</strong> <a href="${d.authorlink}" target="_blank">${d.author}</a></p>
      <p><strong>Genres:</strong> ${d.allGenres}</p>
      <p><strong>Average Rating:</strong> ${d.average_rating}</p>
      <p><strong>Reviews:</strong> ${d.review_count}</p>
      <p><strong>5★ Ratings:</strong> ${d.fiveStarCount}</p>
      <button id="closePopup">Close</button>
    `);
    popup.classed("hidden", false);
  
    d3.select("#closePopup").on("click", () => {
      popup.classed("hidden", true);
    });
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
  
      if (tabId === "scene1") {
        updateScene1WithYears();
      }
  
      if (tabId === "scene2") {
        if (reviewsLoaded) {
          updateScene2WithYears();
        } else {
          const checkLoaded = setInterval(() => {
            if (reviewsLoaded) {
              updateScene2WithYears();
              clearInterval(checkLoaded);
            }
          }, 200);
        }
      }
  
      if (tabId === "scene3") {
        if (reviewsLoaded) {
          populateGenreDropdown();
          updateScene3WithYears();
        } else {
          const checkLoaded = setInterval(() => {
            if (reviewsLoaded) {
              populateGenreDropdown();
              updateScene3WithYears();
              clearInterval(checkLoaded);
            }
          }, 200);
        }
      }
    });
  });
})();





















































