const fromSlider = document.getElementById("fromSlider");
const toSlider = document.getElementById("toSlider");
const sliderTrack = document.querySelector(".slider-track");
const yearStartLabel = document.getElementById("yearStartLabel");
const yearEndLabel = document.getElementById("yearEndLabel");

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
