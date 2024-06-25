import { getUserIdFromToken } from "../../utils/auth.js";
import { updateGame } from "../../utils/pong.js";
import { webSocketUrl } from "../../../../../constants.js";

let ctx;

const winnerMap = {
  es: `GANADOR`,
  en: `WINNER`,
  fr: `GAGNANT`,
};

const tieMap = {
  es: `EMPATE!`,
  en: `TIE!`,
  fr: `ÉGALITÉ!`,
};

function resultModal(data, player1Username) {
  const myModal = new bootstrap.Modal(
    document.getElementById("staticBackdrop"),
    {
      keyboard: false,
    }
  );
  const lang = document.getElementById("langSelector").value;
  document.getElementById(
    "playerAModalData"
  ).innerText = `${data.left_score} ${player1Username}`;
  document.getElementById(
    "playerBModalData"
  ).innerText = `${data.right_score} GUEST PLAYER`;
  if (parseInt(data.left_score) > parseInt(data.right_score))
    document.getElementById(
      "winnerModalData"
    ).innerText = `${winnerMap[lang]} ${player1Username}!`;
  else if (parseInt(data.left_score) < parseInt(data.right_score))
    document.getElementById(
      "winnerModalData"
    ).innerText = `${winnerMap[lang]} GUEST PLAYER!`;
  else document.getElementById("winnerModalData").innerText = `${tieMap[lang]}`;
  myModal.show();
}

function handleMessage(e) {
  const data = JSON.parse(e.data);
  const numDiv = document.getElementById("time-left");
  let countdown = 0;

  if (data && data.error) {
    document.getElementById("alert_game_id").classList.remove("d-none");
    return;
  }
  if (data && data.message && data.message == "aborted") {
    document.getElementById("alert_aborted").classList.remove("d-none");
    return;
  }
  if (data && data.player1) {
    player1Username = data.player1;
    document.getElementById("playerA").innerText = player1Username;
    document.getElementById("playerB").innerText = "Guest";
  } else if (data.time_left !== undefined && data.time_left !== null)
    numDiv.innerHTML = data.time_left.toFixed(2);
  else if (data.countdown !== undefined && data.countdown !== null) {
    countdown = data.countdown.toFixed(0);
    if (countdown % 2 === 0) {
      numDiv.classList.remove("text-danger");
      numDiv.classList.add("textLight");
    } else {
      numDiv.classList.remove("textLight");
      numDiv.classList.add("text-danger");
    }
    numDiv.innerHTML = data.countdown.toFixed(0);
  } else {
    numDiv.innerHTML = "0.00";
    resultModal(data, player1Username);
  }
  updateGame(data, ctx);
}

function setGameAndDisplay(pongSocket) {
  const startButton = document.getElementById("start");
  startButton.addEventListener("click", () => {
    unlockControls = true;
    startButton.classList.add("d-none");
    document.getElementById("gameBoxDiv").classList.remove("d-none");
    document.getElementById("pong-game").classList.remove("d-none");
    document.getElementById("pressStartAdvise").classList.add("d-none");
    pongSocket.send(JSON.stringify({ message_type: "start_game" }));
  });
}

function setValues() {
  player1Username = "";
  unlockControls = false;
}

function initSocket(roomCode) {
  setValues();
  const pongGameDiv = document.getElementById("pong-game");
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;
  pongGameDiv.appendChild(canvas);
  ctx = canvas.getContext("2d");
  const accessToken = encodeURI(localStorage.getItem("accessToken"));
  const pongSocket = new WebSocket(
    `${webSocketUrl}pong/${roomCode}/?userId=${getUserIdFromToken()}&jwt=${accessToken}&type=local`
  );
  pongSocket.onmessage = handleMessage;

  pongSocket.onerror = (event) => {
    console.error("WebSocket error observed:", event);
  };

  pongSocket.onclose = () => {
    console.error("WebSocket closed unexpectedly");
  };

  document.addEventListener("keyup", (e) => {
    const hash = window.location.hash;
    if (!hash?.startsWith("#/pong-local/")) return;
    if (unlockControls) {
      if (e.key === "w") {
        pongSocket.send(
          JSON.stringify({
            message_type: "move_paddle",
            paddle: "left",
            direction: "up",
          })
        );
      } else if (e.key === "s") {
        pongSocket.send(
          JSON.stringify({
            message_type: "move_paddle",
            paddle: "left",
            direction: "down",
          })
        );
      } else if (e.key === "ArrowUp") {
        pongSocket.send(
          JSON.stringify({
            message_type: "move_paddle",
            paddle: "right",
            direction: "up",
          })
        );
      } else if (e.key === "ArrowDown") {
        pongSocket.send(
          JSON.stringify({
            message_type: "move_paddle",
            paddle: "right",
            direction: "down",
          })
        );
      }
    }
  });
  setGameAndDisplay(pongSocket);
}

function init() {
  const hash = window.location.hash || "#/";
  const roomCode = hash.substring(hash.lastIndexOf("/") + 1);
  document.getElementById("gameDataLink").href = `/#/games/${roomCode}`;
  initSocket(roomCode);
}

let player1Username = "";
let unlockControls = false;
export default init;
