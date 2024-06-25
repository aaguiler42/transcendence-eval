const scaleFactorY = 10;
const scaleFactorX = 5;
const paddleLength = 9;

function drawLine(x1, y1, x2, y2, color, width, ctx) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawPaddle(x, y, ctx) {
  ctx.fillStyle = "white";
  ctx.fillRect(
    x * scaleFactorX,
    (y - paddleLength / 2 - 0.5) * scaleFactorY,
    1 * scaleFactorX,
    paddleLength * scaleFactorY
  );
}

function drawBall(x, y, ctx) {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(
    x * scaleFactorX,
    y * scaleFactorY,
    1 * scaleFactorY,
    0,
    Math.PI * 2,
    true
  );
  ctx.fill();
}

export function updateGame(state, ctx) {
  const {
    time_left,
    ball_x,
    ball_y,
    left_paddle_y,
    right_paddle_y,
    left_score,
    right_score,
  } = state;

  ctx.clearRect(0, 0, 800, 400);

  drawLine(400, 0, 400, 400, "white", 1, ctx);
  drawLine(200, 0, 200, 400, "white", 1, ctx);
  drawLine(600, 0, 600, 400, "white", 1, ctx);
  drawLine(200, 200, 600, 200, "white", 1, ctx);

  drawPaddle(0, left_paddle_y, ctx);
  drawPaddle(159, right_paddle_y, ctx);

  drawBall(ball_x, ball_y, ctx);

  document.getElementById("left-score").textContent = left_score;
  document.getElementById("right-score").textContent = right_score;
}
