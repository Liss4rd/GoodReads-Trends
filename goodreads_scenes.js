const fromSlider = document.getElementById("fromSlider");
const toSlider = document.getElementById("toSlider");
const sliderTrack = document.querySelector(".slider-track");
const yearStartLabel = document.getElementById("yearStartLabel");
const yearEndLabel = document.getElementById("yearEndLabel");

// =========================
// Year Range Slider with D3
// =========================
(function() {
  const minYear = 2000;
  const maxYear = 2025;
  let startYear = 2005;
  let endYear = 2020;

  const width = 400;
  const height = 60;

  const svg = d3.select("#yearSlider")
    .attr("width", width + 100)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([50, width + 50])
    .clamp(true);

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

  // Thumbs
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

    // TODO: Call your scene 1 update function here:
    // updateScene1WithYears(startYear, endYear);
  }

  update();
})();

function controlFromSlider() {
  const fromVal = Math.min(parseInt(fromSlider.value), parseInt(toSlider.value) - 1);
  fromSlider.value = fromVal;
  fillSlider();
}

function controlToSlider() {
  const toVal = Math.max(parseInt(toSlider.value), parseInt(fromSlider.value) + 1);
  toSlider.value = toVal;
  fillSlider();
}

function fillSlider() {
  const min = parseInt(fromSlider.min);
  const max = parseInt(fromSlider.max);
  const from = parseInt(fromSlider.value);
  const to = parseInt(toSlider.value);

  const percent1 = ((from - min) / (max - min)) * 100;
  const percent2 = ((to - min) / (max - min)) * 100;

  sliderTrack.style.left = percent1 + "%";
  sliderTrack.style.width = (percent2 - percent1) + "%";

  yearStartLabel.textContent = from;
  yearEndLabel.textContent = to;
}

fromSlider.addEventListener("input", controlFromSlider);
toSlider.addEventListener("input", controlToSlider);
fillSlider();
