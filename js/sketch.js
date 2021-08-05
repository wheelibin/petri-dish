// Inputs
let totalLifeFormsSlider;
let simulationSpeedSlider;
let totalPredatorsSlider;
let preyReactionDistanceSlider;
let startStopButton;

// App variables
let lifeForms = [];
let boundaryRadius;
let boundaryCenter;
let totalLifeForms = 250;
let nextId = 0;
let maxVelocity = 25;
let simulationSpeed = 5;
let isStopped = false;
let totalPredators = 1;
let lifeFormsDontGrow = false;
let preyEatsPrey = false;
let populationIsMaintained = true;
let preyCollide = true;
let preyReactionDistance = 300;

// App constants
const fps = 60;
const maxRadius = 16;
const maxLifeForms = 250;
const minRadius = 1;
const minPredatorRadius = 3;
const controlWidth = 200;

const predatorVelocityIncrease = 2.25;

// Colours
const backgroundColour = "#292929";
const textColour = "#c6c6c6";
const circleBackgroundColour = "#333";

const preyAlpha = 0.5;
const predatorAlpha = 0.5;

const predatorColour = `rgba(255, 107, 107, ${predatorAlpha})`;
const huntedPreyColour = `rgba(255, 230, 109, ${preyAlpha})`;
const preyColours = [
  "99e2b4",
  "88d4ab",
  "78c6a3",
  "67b99a",
  "56ab91",
  "469d89",
  "358f80",
  "248277",
  "14746f",
  "036666",
];

// eslint-disable-next-line no-unused-vars
function setup() {
  frameRate(fps);
  createCanvas(windowWidth, windowHeight);

  createInputs();

  boundaryRadius = (Math.min(windowWidth, windowHeight) - 100) / 2;
  boundaryCenter = createVector(windowWidth / 2, windowHeight / 2);

  createLifeForms(totalLifeForms);
}

// eslint-disable-next-line no-unused-vars
function draw() {
  // if (!keyIsPressed) return;
  // noLoop();

  background(backgroundColour);

  // display input values
  fill(textColour);
  text(totalLifeForms, controlWidth + 40, totalLifeFormsSlider.position().y + 12);
  text(totalPredators, controlWidth + 40, totalPredatorsSlider.position().y + 12);
  text(simulationSpeed, controlWidth + 40, simulationSpeedSlider.position().y + 12);
  text(preyReactionDistance, controlWidth + 40, preyReactionDistanceSlider.position().y + 12);

  // Display FPS
  fill(textColour);
  stroke(0);
  text(`FPS: ${frameRate().toFixed(2)}`, 10, height - 10);

  fill(circleBackgroundColour);
  circle(boundaryCenter.x, boundaryCenter.y, boundaryRadius * 2);

  // options
  totalLifeForms = totalLifeFormsSlider.value();
  simulationSpeed = isStopped ? 0 : simulationSpeedSlider.value();
  preyReactionDistance = preyReactionDistanceSlider.value();

  if (populationIsMaintained) {
    // ensure correct number of life forms
    if (lifeForms.length < totalLifeForms) {
      createLifeForms(totalLifeForms - lifeForms.length);
    }
    if (lifeForms.length > totalLifeForms) {
      const deleteCount = lifeForms.length - totalLifeForms;
      const startIndex = lifeForms.length - deleteCount;
      lifeForms.splice(startIndex, deleteCount);
    }
  }

  for (let i = lifeForms.length - 1; i >= 0; i--) {
    const lifeForm = lifeForms[i];
    if (lifeForm) {
      if (lifeForm.isPredator) {
        lifeForm.radius = Math.max(minPredatorRadius, lifeForm.radius - 0.02);
      }

      lifeForm.draw();
      lifeForm.move(simulationSpeed / 2000);

      const others = lifeForms.filter((lf) => lf.id !== lifeForm.id);
      lifeForm.interact(others);
    }
  }
}

// eslint-disable-next-line no-unused-vars
function handleWindowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function resetSimulation() {
  nextId = 0;
  lifeForms = [];
  createLifeForms(totalLifeForms);
}
function startStopSimulation() {
  if (!isStopped) {
    startStopButton.html("Start Simulation");
  } else {
    startStopButton.html("Stop Simulation");
  }
  isStopped = !isStopped;
}

function handleTotalPredatorsChange() {
  totalPredators = totalPredatorsSlider.value();
  resetSimulation();
}

function createLifeForms(qty, isPredator) {
  for (var i = 0; i < qty; i++) {
    createLifeForm(isPredator);
  }
}

function createLifeForm(isPredator) {
  const id = nextId;
  const angle = Math.random() * 2 * Math.PI;
  const dist = 0.9 * boundaryRadius * Math.sqrt(Math.random());
  const vAngle = Math.random() * 2 * Math.PI;
  const vMag = random(5, maxVelocity);

  const position = createVector(dist * Math.cos(angle), dist * Math.sin(angle));
  const velocity = createVector(vMag * Math.cos(vAngle), vMag * Math.sin(vAngle));

  lifeForms.push(
    new LifeForm(
      id,
      position.add(boundaryCenter),
      velocity,
      isPredator === undefined ? id < totalPredators : isPredator
    )
  );

  nextId++;

  // console.log(`${id} was born`);
}

class LifeForm {
  constructor(id, position, velocity, isPredator = false) {
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    this.maxVelocity = isPredator ? maxVelocity * predatorVelocityIncrease : maxVelocity;
    this.heading = createVector();
    this.radius = isPredator ? 4 : Math.max(randomGaussian(4, 2), 2); //random(4, 16);

    const c = color(`#${random(preyColours)}`);
    c.setAlpha(255 * preyAlpha);
    this.colour = isPredator ? predatorColour : c;
    this.isPredator = isPredator;
    this.isPrey = !isPredator;
    this.target = undefined;
    this.targetChaseTime = 0;
    this.isTarget = false;
  }

  setTarget(target) {
    this.target = target;
    this.targetChaseTime = 0;
    if (target) {
      target.isTarget = true;
    }
  }

  draw() {
    noStroke();
    fill(this.isTarget ? huntedPreyColour : this.colour);
    circle(this.position.x, this.position.y, this.radius * 2);
  }

  move(simulationSpeed) {
    if (this.isPrey) {
      // randomly change direction and speed periodically
      const randomiseDuration = random(1, 8);
      if (frameCount % (fps * randomiseDuration) < randomiseDuration) {
        this.changeToRandomVector();
      }
    }

    this.handleBoundary();

    this.velocity.limit(this.maxVelocity);
    const vel = p5.Vector.mult(this.velocity, deltaTime * simulationSpeed);

    this.position.add(vel);
  }

  handleBoundary() {
    const distance = this.position.dist(boundaryCenter);

    if (distance > boundaryRadius - this.radius) {
      const minDist = boundaryRadius + this.radius;

      const dx = boundaryCenter.x - this.position.x;
      const dy = boundaryCenter.y - this.position.y;
      const angle = Math.atan2(dy, dx);
      const targetX = this.position.x + Math.cos(angle) / minDist;
      const targetY = this.position.y + Math.sin(angle) / minDist;
      const ax = targetX - boundaryCenter.x;
      const ay = targetY - boundaryCenter.y;

      this.velocity.x -= ax;
      this.velocity.y -= ay;
    }
  }

  seek(target) {
    // A vector pointing from the location to the target
    const desired = p5.Vector.sub(target, this.position);
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxVelocity);
    // Steering = Desired minus Velocity
    const steer = p5.Vector.sub(desired, this.velocity);
    //steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
  }

  changeToRandomVector() {
    // this.velocity.rotate(this.velocity.heading() + random());
    // this.velocity.limit(this.maxVelocity);
  }

  interact(lfs) {
    let distances = [];

    for (let i = lfs.length - 1; i >= 0; i--) {
      const lf = lfs[i];
      // console.log(deltaTime);
      const distance = this.position.dist(lf.position);
      distances.push({ lf, distance });

      if (distance <= this.radius + lf.radius) {
        if (preyCollide && this.isPrey && lf.isPrey && !this.hasCollided && !lf.hasCollided) {
          /** circle collision */

          // separate them
          const distanceToMove = this.radius + lf.radius - distance;
          const angle = this.velocity.angleBetween(lf.velocity);
          this.position.x -= Math.cos(angle) * distanceToMove;
          this.position.y -= Math.cos(angle) * distanceToMove;
          lf.position.x += Math.cos(angle) * distanceToMove;
          lf.position.y += Math.cos(angle) * distanceToMove;

          // calculate bounce angles and velocity
          const tangentVector = createVector(lf.position.y - this.position.y, -(lf.position.x - this.position.x));
          tangentVector.normalize();
          const relativeVelocity = createVector(this.velocity.x - lf.velocity.x, this.velocity.y - lf.velocity.y);
          const length = relativeVelocity.dot(tangentVector);
          const velocityComponentOnTangent = tangentVector.mult(length);
          const velocityComponentPerpendicularToTangent = relativeVelocity.sub(velocityComponentOnTangent);

          // bounce off each other
          this.velocity.x -= velocityComponentPerpendicularToTangent.x;
          this.velocity.y -= velocityComponentPerpendicularToTangent.y;
          lf.velocity.x += velocityComponentPerpendicularToTangent.x;
          lf.velocity.y += velocityComponentPerpendicularToTangent.y;
        }

        // transfer matter
        const radiusTransfer = 0.2;
        if (this.isPredator && lf.isPrey) {
          // predators always win against prey
          if (!lifeFormsDontGrow) {
            this.radius += radiusTransfer * 0.3;
          }
          lf.radius -= radiusTransfer;
        } else if (this.isPrey && lf.isPrey) {
          // prey vs prey, the biggest one wins
          if (preyEatsPrey) {
            if (this.radius > lf.radius) {
              if (!lifeFormsDontGrow) {
                this.radius += radiusTransfer * 0.5;
              }
              lf.radius -= radiusTransfer;
            }
          }
        }

        if (lf.radius <= minRadius) {
          if (this.isPredator) {
            // predator and the prey died, stop chasing it
            lifeForms = lifeForms.filter((l) => l.id !== lf.id);
            distances = distances.filter((ld) => ld.lf.id !== lf.id);
            if (this.target) {
              this.setTarget(undefined);
            }
          } else {
            // remove from array
            lifeForms = lifeForms.filter((l) => l.id !== lf.id);
          }
          // console.log(`${lf.id} died`);
        }

        // limit the radius
        if (this.radius > maxRadius) this.radius = maxRadius;
        if (lf.radius > maxRadius) lf.radius = maxRadius;
      } else {
        if (lf.isPredator & (distance < preyReactionDistance)) {
          // if we're near a predator, run away!
          const s = this.seek(lf.position).rotate(Math.PI + (Math.PI / 180) * random());
          this.velocity.add(s);
        }
      }
      this.handleBoundary();
    }

    if (this.isPredator) {
      if (this.target === undefined) {
        const closestLf = distances.reduce(function (closest, elem) {
          return elem.distance < closest.distance ? elem : closest;
        }, distances[0]).lf;
        if (closestLf.isPrey) {
          this.setTarget(closestLf);
          //console.log(`setting target to ${closestLf.id}`);
        }
      } else {
        this.targetChaseTime += deltaTime;
      }

      // if the target still exists, seek and destroy :)
      if (this.target && lifeForms.find((l) => l.id === this.target.id)) {
        //only chase the same target for so long before giving up
        if (this.targetChaseTime < 4000) {
          const s = this.seek(this.target.position);
          this.velocity.add(s);
        } else {
          //console.log(`gave up chasing ${this.target.id}, setting no target`);
          this.setTarget(undefined);
        }
      } else {
        this.setTarget(undefined);
      }
    }
  }
}

function createTextElement(element, text, x, y, color = textColour) {
  let el = createElement(element, text);
  el.style("font-family", "sans-serif");
  el.style("color", color);
  el.position(x, y);
}

function createInputs() {
  const controlX = 32;
  let controlY = 8;
  const controlYSpacing = 64;

  createTextElement("h1", "Petri Dish", controlX, controlY, textColour);
  controlY += controlYSpacing;

  controlY += 16;
  startStopButton = createButton("Stop Simulation");
  startStopButton.position(controlX, controlY);
  startStopButton.style("font-family", "sans-serif");
  startStopButton.style("width", `${controlWidth}px`);
  startStopButton.mousePressed(startStopSimulation);
  controlY += controlYSpacing / 1.5;

  const resetButton = createButton("Reset Simulation");
  resetButton.position(controlX, controlY);
  resetButton.style("font-family", "sans-serif");
  resetButton.style("width", `${controlWidth}px`);
  resetButton.mousePressed(resetSimulation);
  controlY += controlYSpacing / 1.5;

  createTextElement("p", "Total Life Forms", controlX, controlY);
  controlY += controlYSpacing / 1.5;

  totalLifeFormsSlider = createSlider(10, maxLifeForms, totalLifeForms, 1);
  totalLifeFormsSlider.position(controlX, controlY);
  totalLifeFormsSlider.style("width", `${controlWidth}px`);

  controlY += 16;
  createTextElement("p", "Simulation Speed", controlX, controlY);
  controlY += controlYSpacing / 1.5;

  simulationSpeedSlider = createSlider(1, 50, simulationSpeed, 1);
  simulationSpeedSlider.position(controlX, controlY);
  simulationSpeedSlider.style("width", `${controlWidth}px`);

  controlY += 16;
  createTextElement("p", "Predators", controlX, controlY);
  controlY += controlYSpacing / 1.5;

  totalPredatorsSlider = createSlider(1, 10, totalPredators, 1);
  totalPredatorsSlider.position(controlX, controlY);
  totalPredatorsSlider.style("width", `${controlWidth}px`);
  totalPredatorsSlider.input(handleTotalPredatorsChange);

  controlY += 16;
  createTextElement("p", "Prey Reaction Distance", controlX, controlY);
  controlY += controlYSpacing / 1.5;

  preyReactionDistanceSlider = createSlider(100, 500, preyReactionDistance, 10);
  preyReactionDistanceSlider.position(controlX, controlY);
  preyReactionDistanceSlider.style("width", `${controlWidth}px`);
  // preyReactionDistanceSlider.input(handleTotalPredatorsChange);

  // controlY += 32;
  // preyEatsPreyCheckbox = createCheckbox("Prey eats prey", preyEatsPrey);
  // preyEatsPreyCheckbox.position(controlX, controlY);
  // preyEatsPreyCheckbox.style("width", `${controlWidth}px`);
  // const preyEatsPreyCheckboxLabel = preyEatsPreyCheckbox.elt.getElementsByTagName("label")[0];
  // preyEatsPreyCheckboxLabel.style.fontFamily = "sans-serif";
  // preyEatsPreyCheckboxLabel.style.color = textColour;
  // preyEatsPreyCheckboxLabel.style.paddingLeft = "8px";

  // controlY += 32;
  // lifeFormsHaveFixedSizeCheckbox = createCheckbox("Life forms don't grow", lifeFormsDontGrow);
  // lifeFormsHaveFixedSizeCheckbox.position(controlX, controlY);
  // lifeFormsHaveFixedSizeCheckbox.style("width", `${controlWidth}px`);
  // const lifeFormsHaveFixedSizeCheckboxLabel = lifeFormsHaveFixedSizeCheckbox.elt.getElementsByTagName("label")[0];
  // lifeFormsHaveFixedSizeCheckboxLabel.style.fontFamily = "sans-serif";
  // lifeFormsHaveFixedSizeCheckboxLabel.style.color = textColour;
  // lifeFormsHaveFixedSizeCheckboxLabel.style.paddingLeft = "8px";

  // controlY += 32;
  // populationIsMaintainedCheckbox = createCheckbox("Population is maintained", populationIsMaintained);
  // populationIsMaintainedCheckbox.position(controlX, controlY);
  // populationIsMaintainedCheckbox.style("width", `${controlWidth}px`);
  // const populationIsMaintainedCheckboxLabel = populationIsMaintainedCheckbox.elt.getElementsByTagName("label")[0];
  // populationIsMaintainedCheckboxLabel.style.fontFamily = "sans-serif";
  // populationIsMaintainedCheckboxLabel.style.color = textColour;
  // populationIsMaintainedCheckboxLabel.style.paddingLeft = "8px";
}
