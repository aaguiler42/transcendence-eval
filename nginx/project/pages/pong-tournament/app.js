import { getUserIdFromToken } from "../../utils/auth.js";
import { updateGame } from "../../utils/pong.js";
import { webSocketUrl } from "../../../../../constants.js";

let ctx;

const winnerMap = {
  es: `GANADOR`,
  en: `WINNER`,
  fr: `GAGNANT`,
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
  ).innerText = `${data.left_score} ${player1Username} `;
  document.getElementById(
    "playerBModalData"
  ).innerText = `${data.right_score} ${player2Username}`;
  if (parseInt(data.left_score) > parseInt(data.right_score)) {
    document.getElementById(
      "winnerModalData"
    ).innerText = `${winnerMap[lang]} ${player1Username}!`;
    playerNames = playerNames.filter((item) => item !== player2Username);
  } else if (parseInt(data.left_score) < parseInt(data.right_score)) {
    document.getElementById(
      "winnerModalData"
    ).innerText = `${winnerMap[lang]} ${player2Username}!`;
    playerNames = playerNames.filter((item) => item !== player1Username);
  }
  myModal.show();
}

function handleMessage(e) {
  const data = JSON.parse(e.data);
  const numDiv = document.getElementById("time-left");
  let countdown = 0;
  if (data.room_code && round_limit >= parseInt(data.total_players))
    document.getElementById("gameDataLink").href = `#/games/${data.room_code}`;

  if (data.message && data.message == "all players connected") {
    playerNames = data.players;
    if (new_remote_mode) {
      document.getElementById("spinner").classList.add("d-none");
      document.getElementById("waitingText").classList.add("d-none");
      document.getElementById("start").classList.remove("d-none");
      document.getElementById("startText").classList.remove("d-none");
      document.getElementById("PlayerOnLineText").classList.remove("d-none");
    }
    playOffTable();
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
    if (data.time_left == "GOLDEN POINT") numDiv.innerHTML = data.time_left;
    else numDiv.innerHTML = data.time_left.toFixed(2);
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
    const buttonToGames = document.getElementById("buttonToGames");
    if (!isButtonToGamesListenerAdded) {
      buttonToGames.addEventListener("click", () => {
        unlockControls = false;
        if (round_limit < parseInt(data.total_players)) {
          if (round == parseInt(data.total_players) / round_limit - 1) {
            playOffTable();
            round = 0;
            round_limit = round_limit * 2;
          } else round = round + 1;
          if (new_remote_mode) {
            document.getElementById("gameBoxDiv").classList.add("d-none");
            document.getElementById("pong-game").classList.add("d-none");
            document
              .getElementById("pressStartAdvise")
              .classList.remove("d-none");
            document.getElementById("start").classList.remove("d-none");
          }
        }
      });
      isButtonToGamesListenerAdded = true;
    }
    return;
  }
  updateGame(data, ctx);
}

function setDisplay() {
  document.getElementById("gameBoxDiv").classList.remove("d-none");
  document.getElementById("pong-game").classList.remove("d-none");
  document.getElementById("pressStartAdvise").classList.add("d-none");
}

function playOffTable() {
  const table = document.getElementById("playOffTableBody");
  const round1 = document.createElement("tr");
  const elements = playerNames.length;
  const scope = document.createElement("th");
  scope.setAttribute("scope", "row");
  scope.classList.add("bg-transparent", "textLight", "fs-3", "text-nowrap");
  scope.innerText = `ROUND ${roundNow}`;
  round1.appendChild(scope);
  for (let i = 0; i < elements; i += 2) {
    const player = document.createElement("td");
    player.classList.add(
      "text-center",
      "font-quicky",
      "bg-transparent",
      "textLight",
      "fs-3"
    );
    player.style.borderLeft = "1px solid #dee2e6";
    player.setAttribute("colspan", 2 ** (roundNow - 1));
    player.innerText = playerNames[i];
    round1.appendChild(player);
    const vs = document.createElement("td");
    vs.classList.add(
      "text-center",
      "font-quicky",
      "bg-transparent",
      "textLight",
      "fs-3"
    );
    vs.setAttribute("colspan", 2 ** (roundNow - 1));
    vs.innerText = "Vs";
    round1.appendChild(vs);
    const player2 = document.createElement("td");
    player2.classList.add(
      "text-center",
      "font-quicky",
      "bg-transparent",
      "textLight",
      "fs-3"
    );
    player2.style.borderRight = "1px solid #dee2e6";
    player2.setAttribute("colspan", 2 ** (roundNow - 1));
    player2.innerText = playerNames[i + 1];
    round1.appendChild(player2);
  }
  table.appendChild(round1);
  roundNow++;
}

function setRoundsAndDisplay(pongSocket) {
  const startButton = document.getElementById("start");
  if (new_remote_mode) {
    startButton.addEventListener("click", () => {
      unlockControls = true;
      startButton.classList.add("d-none");
      setDisplay();
      pongSocket.send(
        JSON.stringify({
          message_type: "start_tournament",
          user_id: `${getUserIdFromToken()}`,
          round: `${round}`,
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
    `${webSocketUrl}pong/${roomCode}/?userId=${getUserIdFromToken()}&jwt=${accessToken}&type=tournament`
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
    if (!hash?.startsWith("#/pong-tournament/")) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
      return;
    }
    if (unlockControls) {
      pongSocket.send(
        JSON.stringify({
          message_type: "move_paddle",
          type: "tournament",
          direction: e.key === "ArrowUp" ? "up" : "down",
        })
      );
    }
  });
  setRoundsAndDisplay(pongSocket);
}

function setValues() {
  playerNames = [];
  player1Username = "";
  player2Username = "";
  new_remote_mode = true;
  roomCode = "";
  unlockControls = false;
  round = 0;
  round_limit = 2;
  roundNow = 1;
  isButtonToGamesListenerAdded = false;
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

let playerNames = [];
let player1Username = "";
let player2Username = "";
let new_remote_mode = true;
let roomCode = "";
let unlockControls = false;
let round = 0;
let round_limit = 2;
let roundNow = 1;
let isButtonToGamesListenerAdded = false;

export default init;
