var countTraces = 0;
var gameStep = 0;
var x_var_game;
var y_var_game;
var optionChosen;
var gradients = [];
var gradientsCounter = 0;
var x_game_list = [];
var y_game_list = [];
var z_game_list = [];
var adam_done = false;
var sgd_done = false;
var momentum_done = false;
var rmsprop_done = false;
var adagrad_done = false;

function __f1(x, y) {
  let a = tf.mul(-1, tf.sin(tf.mul(x, x)));
  let b = tf.mul(
    tf.cos(tf.mul(3, tf.mul(y, y))),
    tf.exp(tf.mul(tf.mul(-1, tf.mul(x, y)), tf.mul(x, y)))
  );
  let c = tf.mul(a, b);
  let d = tf.sub(c, tf.exp(tf.mul(tf.mul(-1, tf.add(x, y)), tf.add(x, y))));
  return d;
}

function __f2(x, y, x_mean, y_mean, x_sig, y_sig) {
  let normalizing = 1 / (2 * Math.PI * x_sig * y_sig);
  // Get exponent
  let x_exp = tf.div(
    tf.mul(tf.square(tf.sub(x, x_mean)), -1),
    tf.mul(tf.square(x_sig), 2)
  );
  let y_exp = tf.div(
    tf.mul(tf.square(tf.sub(y, y_mean)), -1),
    tf.mul(tf.square(y_sig), 2)
  );
  return tf.mul(tf.exp(x_exp.add(y_exp)), normalizing);
}

function loss(x, y, option) {
  let z;
  switch (option) {
    case "1":
      z = __f1(x, y);
      // 3rd local minimum at (-0.5, -0.8)
      z = z.add(
        tf.mul(
          -1,
          __f2(
            x,
            y,
            (x_mean = -0.5),
            (y_mean = -0.8),
            (x_sig = 0.35),
            (y_sig = 0.35)
          )
        )
      );
      break;
    case "2":
      z = __f2(
        x,
        y,
        (x_mean = 1.0),
        (y_mean = -0.5),
        (x_sig = 0.2),
        (y_sig = 0.2)
      );
      z = z.sub(
        __f2(
          x,
          y,
          (x_mean = -1.0),
          (y_mean = 0.5),
          (x_sig = 0.2),
          (y_sig = 0.2)
        )
      );
      z = z.sub(
        __f2(
          x,
          y,
          (x_mean = -0.5),
          (y_mean = -0.8),
          (x_sig = 0.2),
          (y_sig = 0.2)
        )
      );
      break;
  }
  return z;
}

async function optimise(opt, x_var, y_var, option, count) {
  let x_plotly = [];
  let y_plotly = [];
  let z_plotly = [];

  for (let i = 0; i < count; i++) {
    opt.minimize(() => loss(x_var, y_var, option));
    x_plotly.push(x_var.dataSync()[0]);
    y_plotly.push(y_var.dataSync()[0]);
    z_plotly.push(loss(x_var, y_var, option).dataSync()[0]);
    await delay(10);
    document.getElementById("progress2").textContent =
      "Loading " + (i + 1) + "/" + count + ".";
  }

  let returnArray = [x_plotly, y_plotly, z_plotly];
  return returnArray;
}

function range(start, stop, step) {
  step = step || 1;
  let arr = [];
  for (let i = start; i < stop; i += step) {
    arr.push(i);
  }
  return arr;
}

async function draw3DSurface(option) {
  const hideDiv = document.getElementById("game");
  const showDiv = document.getElementById("loading");
  hideDiv.style.display = "none";
  showDiv.style.display = "block";

  const x_vals = range(-1.5, 1.5, 0.05);
  const y_vals = x_vals;

  let coord = [];

  for (let i = 0; i < y_vals.length; i++) {
    let coordX = [];
    let y = y_vals[i];
    for (let j = 0; j < x_vals.length; j++) {
      let x = x_vals[j];
      let z = loss(x, y, option);
      coordX.push(z);
    }
    coord.push(coordX);
    await delay(100);
    document.getElementById("progress1").textContent =
      "Loading " + (i + 1) + "/" + x_vals.length + ".";
  }

  let values = [];

  for (let i = 0; i < coord.length; i++) {
    values.push(coord[i].map((t) => t.dataSync()[0]));
  }

  let trace = {
    z: values,
    x: x_vals,
    y: y_vals,
    type: "surface",
    contours: {
      z: {
        show: true,
        usecolormap: true,
        highlightcolor: "#42f462",
        project: { z: true },
      },
    },
  };

  var layout = {
    title: {
      text: "<b>The path you took along the talent terrain.</b>",
      font: {
        size: 24
      }
    },
    scene: { camera: { eye: { x: -0.75, y: 0.75, z: 2 } } },
    autosize: true,
    font: {
      family:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif",
      color: "#000",
    },
  };

  const hideDiv1 = document.getElementById("loading");
  const showDiv1 = document.getElementById("graphs");
  hideDiv1.style.display = "none";
  showDiv1.style.display = "block";

  await delay(100);

  Plotly.newPlot("myDiv", [trace], layout);

  await delay(100);

  var trace1 = {
    name: "Player",
    x: [x_game_list[0]],
    y: [y_game_list[0]],
    z: [z_game_list[0]],
    type: "scatter3d",
    marker: {
      color: "yellow",
      size: 3,
      symbol: "circle",
    },
    line: {
      color: "yellow",
      width: 3,
    },
  };

  Plotly.addTraces("myDiv", trace1);

  countTraces += 1;

  for (let i = 1; i < x_game_list.length; i++) {
    Plotly.extendTraces(
      "myDiv",
      {
        x: [[x_game_list[i]]],
        y: [[y_game_list[i]]],
        z: [[z_game_list[i]]],
      },
      [countTraces]
    );
    await delay(10);
    console.log("yeay");
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function optimiseSurface(option, count, optimiser) {
  let x_plotly = [0.75];
  let y_plotly = [1];
  let z_plotly = [loss(0.75, 1, option).dataSync()[0]];
  let opt;
  let color;

  switch (optimiser) {
    case "SGD":
      opt = tf.train.sgd(0.05);
      color = "green";
      if (!sgd_done) {
        sgd_done = true;
      } else {
        alert("SGD has been done.")
        return null;
      }
      break;
    case "Adam":
      opt = tf.train.adam(0.05);
      color = "red";
      if (!adam_done) {
        adam_done = true;
      } else {
        alert("Adam has been done.")
        return null;
      }
      break;
    case "Momentum":
      opt = tf.train.momentum(0.05, (momentum = 0.95));
      color = "aqua";
      if (!momentum_done) {
        momentum_done = true;
      } else {
        alert("Momentum has been done.")
        return null;
      }
      break;
    case "RMSProp":
      opt = tf.train.rmsprop(0.05);
      color = "magenta";
      if (!rmsprop_done) {
        rmsprop_done = true;
      } else {
        alert("RMSProp has been done.")
        return null;
      }
      break;
    case "AdaGrad":
      opt = tf.train.adagrad(0.10);
      color = "black";
      if (!adagrad_done) {
        adagrad_done = true;
      } else {
        alert("AdaGrad has been done.")
        return null;
      }
      break;
  }

  var trace1 = {
    name: optimiser,
    x: x_plotly,
    y: y_plotly,
    z: z_plotly,
    type: "scatter3d",
    marker: {
      color: color,
      size: 3,
      symbol: "circle",
    },
    line: {
      color: color,
      width: 3,
    },
  };

  Plotly.addTraces("myDiv", trace1);

  countTraces += 1;

  var x_i = tf.tensor(0.75);
  var y_i = tf.tensor(1.0);

  let x_var = tf.variable(x_i, (trainable = true));
  let y_var = tf.variable(y_i, (trainable = true));

  let returnedArray = await optimise(opt, x_var, y_var, "1", count);

  document.getElementById("progress2").textContent =
      "";

  let x_plotly_addOn = returnedArray[0];
  let y_plotly_addOn = returnedArray[1];
  let z_plotly_addOn = returnedArray[2];

  for (let i = 0; i < count; i++) {
    Plotly.extendTraces(
      "myDiv",
      {
        x: [[x_plotly_addOn[i]]],
        y: [[y_plotly_addOn[i]]],
        z: [[z_plotly_addOn[i]]],
      },
      [countTraces]
    );
    await delay(10);
    document.getElementById("progress2").textContent =
      "Plotting " + (i + 1) + "/" + count + ".";
  }

  document.getElementById("progress2").textContent =
      "";
}

function startGame(option) {
  optionChosen = option;
  const hideDiv = document.getElementById("beginGame");
  const showDiv = document.getElementById("game");
  hideDiv.style.display = "none";
  showDiv.style.display = "block";

  document.getElementById("step").textContent =
    "You are on step " + (gameStep + 1) + ".";

  var x_i = tf.tensor(0.75);
  var y_i = tf.tensor(1.0);

  x_var_game = tf.variable(x_i, (trainable = true));
  y_var_game = tf.variable(y_i, (trainable = true));

  x_game_list.push(0.75);
  y_game_list.push(1);
  z_game_list.push(loss(0.75, 1, option).dataSync()[0]);

  let { val, grads } = tf.variableGrads(() =>
    loss(x_var_game, y_var_game, option)
  );
  gradients.push([
    grads[gradientsCounter].mul(-1).dataSync()[0],
    grads[gradientsCounter + 1].mul(-1).dataSync()[0],
  ]);

  gradientsCounter += 2;

  // document.getElementById("gradients").textContent = gradients[0];
  document.getElementById("choice1").textContent = gradients[0][1].toFixed(3);
  document.getElementById("choice2").textContent = (
    0.5 * gradients[0][0] +
    0.5 * gradients[0][1]
  ).toFixed(3);
  document.getElementById("choice3").textContent = gradients[0][0].toFixed(3);
  document.getElementById("choice4").textContent = (
    0.5 * gradients[0][0] -
    0.5 * gradients[0][1]
  ).toFixed(3);
  document.getElementById("choice5").textContent = (-gradients[0][1]).toFixed(
    3
  );
  document.getElementById("choice6").textContent = (
    -0.5 * gradients[0][0] -
    0.5 * gradients[0][1]
  ).toFixed(3);
  document.getElementById("choice7").textContent = (-gradients[0][0]).toFixed(
    3
  );
  document.getElementById("choice8").textContent = (
    -0.5 * gradients[0][0] +
    0.5 * gradients[0][1]
  ).toFixed(3);
  return null;
}

function selectChoice(choice) {
  switch (choice) {
    case "1":
      y_var_game = y_var_game.add(0.05 * gradients[gameStep][1]);
      break;
    case "2":
      x_var_game = x_var_game.add(0.05 * gradients[gameStep][0] * 0.5);
      y_var_game = y_var_game.add(0.05 * gradients[gameStep][1] * 0.5);
      break;
    case "3":
      x_var_game = x_var_game.add(0.05 * gradients[gameStep][0] * 0.5);
      break;
    case "4":
      x_var_game = x_var_game.add(0.05 * gradients[gameStep][0] * 0.5);
      y_var_game = y_var_game.sub(0.05 * gradients[gameStep][1] * 0.5);
      break;
    case "5":
      y_var_game = y_var_game.sub(0.05 * gradients[gameStep][1]);
      break;
    case "6":
      x_var_game = x_var_game.sub(0.05 * gradients[gameStep][0] * 0.5);
      y_var_game = y_var_game.sub(0.05 * gradients[gameStep][1] * 0.5);
      break;
    case "7":
      x_var_game = x_var_game.sub(0.05 * gradients[gameStep][0]);
      break;
    case "8":
      x_var_game = x_var_game.sub(0.05 * gradients[gameStep][0] * 0.5);
      y_var_game = y_var_game.add(0.05 * gradients[gameStep][1] * 0.5);
      break;
  }

  x_var_game = tf.variable(x_var_game, (trainable = true));
  y_var_game = tf.variable(y_var_game, (trainable = true));

  let { val, grads } = tf.variableGrads(() =>
    loss(x_var_game, y_var_game, optionChosen)
  );

  console.log(grads);

  gradients.push([
    grads[gradientsCounter].mul(-1).dataSync()[0],
    grads[gradientsCounter + 1].mul(-1).dataSync()[0],
  ]);

  gameStep += 1;
  gradientsCounter += 2;

  x_game_list.push(x_var_game.dataSync()[0]);
  y_game_list.push(y_var_game.dataSync()[0]);
  z_game_list.push(loss(x_var_game, y_var_game, optionChosen).dataSync()[0]);

  // document.getElementById("gradients").textContent = gradients[gameStep];
  document.getElementById("step").textContent =
    "You are on step " + (gameStep + 1) + ".";
  document.getElementById("choice1").textContent =
    gradients[gameStep][1].toFixed(3);
  document.getElementById("choice2").textContent = (
    0.5 * gradients[gameStep][0] +
    0.5 * gradients[gameStep][1]
  ).toFixed(3);
  document.getElementById("choice3").textContent =
    gradients[gameStep][0].toFixed(3);
  document.getElementById("choice4").textContent = (
    0.5 * gradients[gameStep][0] -
    0.5 * gradients[gameStep][1]
  ).toFixed(3);
  document.getElementById("choice5").textContent = (-gradients[
    gameStep
  ][1]).toFixed(3);
  document.getElementById("choice6").textContent = (
    -0.5 * gradients[gameStep][0] -
    0.5 * gradients[gameStep][1]
  ).toFixed(3);
  document.getElementById("choice7").textContent = (-gradients[
    gameStep
  ][0]).toFixed(3);
  document.getElementById("choice8").textContent = (
    -0.5 * gradients[gameStep][0] +
    0.5 * gradients[gameStep][1]
  ).toFixed(3);
  return null;
}

function reset() {
  gameStep = 0;
  gradients = [];
  x_game_list = [];
  y_game_list = [];
  z_game_list = [];
  startGame("1");
}