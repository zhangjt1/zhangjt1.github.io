
function preload() {

}

// Stores diagnal distance across the canvas
let canvas_dist;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // TODO: Use the dist() function to calculate the diagonal distance across the canvas
  canvas_dist = dist(0, 0, width, height)

   let link = createA('index.html', 'Come back soon!');
   link.position(width/2, height/2)

  
}

function draw() {
  background(255, 40);

  // Nested for loops tp draw a grid of ellipses
  for (let i = 0; i <= width; i += 15) {
    for (let j = 0; j <= height; j += 15) {
      // TODO: Calculate the distance between mouse position and each ellipse's position
      let size = dist(mouseX, mouseY, i, j) * 5;

      // TODO: Reassign size to be proportional to the size of the canvas
      size = (size / canvas_dist) * 70

      fill(0);
      // Try uncommenting the second fill function below:
      fill(j, i, size, 10);
      // TODO: set width and height of ellipse to size variable
      ellipse(i, j, size/2, size/2);
    }
  }
  
}
