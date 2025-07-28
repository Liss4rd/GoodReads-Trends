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
  // Scene1
  console.log("Scene 1: Genre Trends Timeline");
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