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

function resultModal(data, player1Username, player2Username) {
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
  ).innerText = `${data.right_score} ${player2Username}`;
  if (parseInt(data.left_score) > parseInt(data.right_score))
    document.getElementById(
      "winnerModalData"
    ).innerText = `${winnerMap[lang]} ${player1Username}!`;
  else if (parseInt(data.left_score) < parseInt(data.right_score))
    document.getElementById(
      "winnerModalData"
    ).innerText = `${winnerMap[lang]} ${player2Username}!`;
  else document.getElementById("winnerModalData").innerText = `${tieMap[lang]}`;
  myModal.show();
}

function handleMessage(e) {
  const data = JSON.parse(e.data);
  const numDiv = document.getElementById("time-left");
  let countdown = 0;

  if (data.message && data.message == "all players connected") {
    if (new_remote_mode) {
      document.getElementById("spinner").classList.add("d-none");
      document.getElementById("waitingText").classList.add("d-none");
      document.getElementById("start").classList.remove("d-none");
      document.getElementById("startText").classList.remove("d-none");
      document.getElementById("PlayerOnLineText").classList.remove("d-none");
    }
    return;
  }
  if (data && data.error) {
    document.getElementById("alert_game_id").classList.remove("d-none");
    return;
  }
  if (data && data.message && data.message == "aborted") {
    document.getElementById("alert_aborted").classList.remove("d-none");
    return;
  }
  if (data && data.player1 && data.player2) {
    player1Username = data.player1;
    player2Username = data.player2;
    document.getElementById("playerA").innerText = player1Username;
    document.getElementById("playerB").innerText = player2Username;
  } else if (data.time_left !== undefined && data.time_left !== null) {
    unlockControls = true;
    numDiv.innerHTML = data.time_left.toFixed(2);
  } else if (data.countdown !== undefined && data.countdown !== null) {
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
    resultModal(data, player1Username, player2Username);
    const gameDataLink = document.getElementById("gameDataLink");
    gameDataLink.href = `/#/games/${roomCode}`;
  }
  updateGame(data, ctx);
}

function setDisplay() {
  document.getElementById("gameBoxDiv").classList.remove("d-none");
  document.getElementById("pong-game").classList.remove("d-none");
  document.getElementById("pressStartAdvise").classList.add("d-none");
}

function setGameAndDisplay(pongSocket) {
  const startButton = document.getElementById("start");
  if (new_remote_mode) {
    startButton.addEventListener("click", () => {
      unlockControls = true;
      startButton.classList.add("d-none");
      setDisplay();
      pongSocket.send(
        JSON.stringify({
          message_type: "start_game",
          user_id: `${getUserIdFromToken()}`,
        })
      );
    });
  } else {
    startButton.classList.add("d-none");
    setDisplay();
  }
}

function initSocket(roomCode) {
  const pongGameDiv = document.getElementById("pong-game");
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;
  pongGameDiv.appendChild(canvas);
  ctx = canvas.getContext("2d");
  const accessToken = encodeURI(localStorage.getItem("accessToken"));
  const pongSocket = new WebSocket(
    `${webSocketUrl}pong/${roomCode}/?userId=${getUserIdFromToken()}&jwt=${accessToken}&type=remote`
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
    if (!hash?.startsWith("#/pong-remote/")) return;
    if (unlockControls) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
      }
      pongSocket.send(
        JSON.stringify({
          message_type: "move_paddle",
          type: "remote",
          direction: e.key === "ArrowUp" ? "up" : "down",
        })
      );
    }
  });
  setGameAndDisplay(pongSocket);
}

function setValues() {
  player1Username = "";
  player2Username = "";
  new_remote_mode = true;
  roomCode = "";
  unlockControls = false;
}

function init() {
  setValues();
  const hash = window.location.hash || "#/";
  if (hash.endsWith(".")) {
    roomCode = hash.substring(hash.lastIndexOf("/") + 1, hash.lastIndexOf("."));
    new_remote_mode = false;
  } else {
    roomCode = hash.substring(hash.lastIndexOf("/") + 1);
    new_remote_mode = true;
  }
  document.getElementById("title").innerText = roomCode;

  initSocket(roomCode);
}

let player1Username = "";
let player2Username = "";
let new_remote_mode = true;
let roomCode = "";
let unlockControls = false;
export default init;
