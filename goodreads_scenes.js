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
    .attr("transform", `translate(0, ${height / 2 + 35})`)
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

    // TODO: If you want Scene 1 to update:
    // updateScene1WithYears(startYear, endYear);
  }

  update();
})();
