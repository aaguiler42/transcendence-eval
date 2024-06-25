import { fetcher } from "../../../utils/auth.js";
import { djangoDefaultImgUrl, djangoUrl, baseUrl } from "../../../constants.js";

const winnerMap = {
  es: `GANADOR`,
  en: `WINNER`,
  fr: `GAGNANT`,
};

const looserMap = {
  es: `PERDEDOR`,
  en: `LOOSER`,
  fr: `PERDANT`,
};

const tieMap = {
  es: `EMPATE !`,
  en: `TIE !`,
  fr: `ÉGALITÉ`,
};

const pointMap = {
  es: `Punto`,
  en: `Point`,
  fr: `Point`,
};

function getPoints(n_points, points_array, point_list) {
  let i = 0;
  firstHalf = 0;
  secondHalf = 0;

  const lang = document.getElementById("langSelector").value;
  while (i < n_points) {
    let li_item_1 = document.createElement("li");
    li_item_1.classList.add("mt-1", "me-2", "ms-2");
    if (points_array[i]) {
      li_item_1.textContent = `${pointMap[lang]} ${i + 1} ${points_array[
        i
      ].toFixed(2)}`;
      if (points_array[i] < 30) firstHalf = firstHalf + 1;
      else secondHalf = secondHalf + 1;
    } else li_item_1.textContent = "\u00A0";
    point_list.appendChild(li_item_1);
    i++;
  }
}

function getUsersData(data) {
  const player1Img = document.getElementById("player1Image");
  if (data.players[0].avatar !== null && data.players[0].avatar !== "") {
    player1Img.src = `${baseUrl}:3000/media/${data.players[0].avatar}`;
  } else player1Img.src = djangoDefaultImgUrl;
  player1Img.alt = `${data.players[0].username} avatar`;

  const player2Img = document.getElementById("player2Image");
  if (data.players[1].avatar !== null && data.players[1].avatar !== "") {
    player2Img.src = `${baseUrl}:3000/media/${data.players[1].avatar}`;
  } else player2Img.src = djangoDefaultImgUrl;
  player2Img.alt = `${data.players[1].username} avatar`;

  document.getElementById("player1").innerText = data.players[0].username;
  document.getElementById("player2").innerText = data.players[1].username;
}

function getWinner(data) {
  const lang = document.getElementById("langSelector").value;
  let n_points;
  const p1Element = document.getElementById("p1_is_winner");
  const p2Element = document.getElementById("p1_is_winner");
  if (!p1Element || !p2Element) return;
  if (
    data.players[0].is_winner == false &&
    data.players[1].is_winner == false
  ) {
    p1Element.innerText = tieMap[lang];
    p2Element.innerText = tieMap[lang];
    n_points = data.players[1].points.length;
  } else if (
    data.players[0].is_winner == false &&
    data.players[1].is_winner == true
  ) {
    p1Element.innerText = looserMap[lang];
    p2Element.innerText = winnerMap[lang];
    n_points = data.players[1].points.length;
  } else {
    p1Element.innerText = winnerMap[lang];
    p2Element.innerText = looserMap[lang];
    n_points = data.players[0].points.length;
  }
  return n_points;
}

function getGamePoints(n_points, data) {
  const point_list_player_1 = document.getElementById("player1_points");
  while (point_list_player_1.firstChild) {
    point_list_player_1.removeChild(point_list_player_1.firstChild);
  }
  const points_array_player_1 = data.players[0].points;
  getPoints(n_points, points_array_player_1, point_list_player_1);
  p1firstHalf = firstHalf;
  p1secondHalf = secondHalf;

  const point_list_player_2 = document.getElementById("player2_points");
  while (point_list_player_2.firstChild) {
    point_list_player_2.removeChild(point_list_player_2.firstChild);
  }

  const points_array_player_2 = data.players[1].points;
  getPoints(n_points, points_array_player_2, point_list_player_2);
  p2firstHalf = firstHalf;
  p2secondHalf = secondHalf;
}

function init() {
  const hash = window.location.hash || "#/";
  const gameId = hash.substring(hash.lastIndexOf("/") + 1);
  const api = hash.substring(hash.indexOf("/") + 1, hash.lastIndexOf("/") + 1);
  fetcher(`/api/` + api + api + gameId, {}).then((data) => {
    if (!window.location.hash.startsWith("#/games/")) return;
    getUsersData(data);
    let n_points = getWinner(data);
    getGamePoints(n_points, data);

    const p1Points = data.players[0].points.length;
    const p2Points = data.players[1].points.length;

    document.getElementById("p1Points").innerText = p1Points;
    document.getElementById("p2Points").innerText = p2Points;
    document.getElementById("p1SegPerPoint").innerText =
      p1Points > 0 ? (60 / p1Points).toFixed(2) : 0;
    document.getElementById("p2SegPerPoint").innerText =
      p2Points > 0 ? (60 / p2Points).toFixed(2) : 0;
    document.getElementById("p1FirstHalfPoints").innerText =
      p1Points > 0 ? ((p1firstHalf / p1Points) * 100).toFixed(2) : 0;
    document.getElementById("p1SecondHalfPoints").innerText =
      p1Points > 0 ? ((p1secondHalf / p1Points) * 100).toFixed(2) : 0;
    document.getElementById("p2FirstHalfPoints").innerText =
      p2Points > 0 ? ((p2firstHalf / p2Points) * 100).toFixed(2) : 0;
    document.getElementById("p2SecondHalfPoints").innerText =
      p2Points > 0 ? ((p2secondHalf / p2Points) * 100).toFixed(2) : 0;
    const langSelector = document.getElementById("langSelector");
    langSelector.addEventListener("change", function () {
      getWinner(data);
      getGamePoints(n_points, data);
    });
  });
}

let firstHalf = 0;
let secondHalf = 0;
let p1firstHalf = 0;
let p1secondHalf = 0;
let p2firstHalf = 0;
let p2secondHalf = 0;

export default init;
