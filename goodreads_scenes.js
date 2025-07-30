const fromSlider = document.getElementById("fromSlider");
const toSlider = document.getElementById("toSlider");
const sliderTrack = document.querySelector(".slider-track");
const yearStartLabel = document.getElementById("yearStartLabel");
const yearEndLabel = document.getElementById("yearEndLabel");

function fillSlider() {
  const min = parseInt(fromSlider.min);
  const max = parseInt(fromSlider.max);
  let from = parseInt(fromSlider.value);
  let to = parseInt(toSlider.value);

  if (from >= to) {
    from = to - 1;
    fromSlider.value = from;
  }

  const percent1 = ((from - min) / (max - min)) * 100;
  const percent2 = ((to - min) / (max - min)) * 100;

  sliderTrack.style.left = percent1 + "%";
  sliderTrack.style.width = (percent2 - percent1) + "%";

  yearStartLabel.textContent = from;
  yearEndLabel.textContent = to;
}

fromSlider.addEventListener("input", fillSlider);
toSlider.addEventListener("input", fillSlider);
fillSlider();
