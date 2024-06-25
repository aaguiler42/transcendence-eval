import { fetcher } from "../../../utils/auth.js";
import { getImageRoute } from "../../../constants.js";

const altMap = {
  es: (username) => `Avatar del usuario ${username}`,
  en: (username) => `User ${username} avatar`,
  fr: (username) => `Avatar de l'utilisateur ${username}`,
};

const winnerMap = {
  es: `Ganador`,
  en: `Winner`,
  fr: `Gagnant`,
};

const looserMap = {
  es: `Perdedor`,
  en: `Looser`,
  fr: `Perdant`,
};

function setUserData(data) {
  const playerImg = document.getElementById("playerImage");
  playerImg.src = getImageRoute(data.avatar);
  const lang = localStorage.getItem("i18nextLng");
  playerImg.alt = altMap[lang](data.username);

  document.getElementById("username").innerText = data.username || " - ";
  document.getElementById("name").innerText = data.first_name || " - ";
  document.getElementById("lastname").innerText = data.last_name || " - ";
  document.getElementById("email").innerText = data.email || " - ";
  document.getElementById("birthdate").innerText = data.birthdate || " - ";
  document.getElementById("level").innerText = data.level.toFixed(2) || " - ";
  document.getElementById("last_action").innerText = data.last_action || " - ";
  document.getElementById("friend").innerText = data.status || " - ";
  document.getElementById("playedGames").innerText = data.played_games;
  document.getElementById("winGames").innerText = data.win_games;
  document.getElementById("loseGames").innerText = data.lose_games;
}

function setFriendButton(status) {
  const friendButton = document.getElementById("friend_button");
  const acceptButton = document.getElementById("accept_button");
  const rejectButton = document.getElementById("reject_button");
  if (status == "Unsolicited" || status == "rejected") {
    if (friendButton.classList.contains("d-none")) friendButton.classList.remove("d-none");
    if (!acceptButton.classList.contains("d-none")) acceptButton.classList.add("d-none");
    if (!rejectButton.classList.contains("d-none")) rejectButton.classList.add("d-none");
  } else if (status == "received") {
    if (acceptButton.classList.contains("d-none")) acceptButton.classList.remove("d-none");
    if (rejectButton.classList.contains("d-none")) rejectButton.classList.remove("d-none");
    if(!friendButton.classList.contains("d-none")) friendButton.classList.add("d-none");
  } else {
    if (!friendButton.classList.contains("d-none")) friendButton.classList.add("d-none");
    if (!acceptButton.classList.contains("d-none")) acceptButton.classList.add("d-none");
    if (rejectButton.classList.contains("d-none")) rejectButton.classList.remove("d-none");
  }
}

async function userLastGames(userId) {
  const user = await fetcher(`/api/users/${userId}`, {});

  const tableBody = document.getElementById("lastsGames-table-body");
  tableBody.innerHTML = "";

  let nbr_games = 0;
  const lang = localStorage.getItem("language");
  user.last_games.some((game) => {
    nbr_games = nbr_games + 1;
    if (nbr_games > 10) return true;
    const row = document.createElement("tr");
    row.classList.add("bg-dark", "textLight", "text-center");

    const iswinnerCell = document.createElement("td");
    iswinnerCell.classList.add("bg-dark", "textLight", "text-center");
    iswinnerCell.textContent = game.is_winner
      ? winnerMap[lang]
      : looserMap[lang];
    row.appendChild(iswinnerCell);

    const pointsCell = document.createElement("td");
    pointsCell.classList.add("bg-dark", "textLight", "text-center");
    pointsCell.textContent = `${game.points.length} - ${game.user_B_points.length}`;
    row.appendChild(pointsCell);

    const gameidCell = document.createElement("td");
    gameidCell.classList.add("bg-dark", "textLight", "text-center");
    const gameIdLink = document.createElement("a");
    gameIdLink.setAttribute('data-link', '');
    gameIdLink.innerText = `${game.game}`;
    gameIdLink.href = `#/games/${game.game}`;
    gameIdLink.classList.add("textLight");
    gameidCell.appendChild(gameIdLink);
    row.appendChild(gameidCell);

    const oponentCell = document.createElement("td");
    oponentCell.classList.add("bg-dark", "textLight", "text-center");
    const opponentLink = document.createElement("a");
    opponentLink.setAttribute('data-link', '');
    opponentLink.innerText = `${game.user_B_username}`;
    opponentLink.href = `#/users/${game.user_B}`;
    opponentLink.classList.add("textLight");
    oponentCell.appendChild(opponentLink);
    row.appendChild(oponentCell);

    tableBody.appendChild(row);
  });

  return user;
}

async function render() {
  const hash = window.location.hash || "#/";
  const userId = hash.substring(hash.lastIndexOf("/") + 1);

  const data = await userLastGames(userId);
  setUserData(data);
  setFriendButton(data.status);
  const friendButton = document.getElementById("friend_button");
  const acceptButton = document.getElementById("accept_button");
  const rejectButton = document.getElementById("reject_button");
  if (data.username == "transcendenc3") {
    friendButton.classList.add("d-none");
    acceptButton.classList.add("d-none");
    rejectButton.classList.add("d-none");
  }

  function handleClick(event) {
    const formData = new FormData();
    if (event.target === friendButton) formData.append("status", "sended");
    else if (event.target === acceptButton)
      formData.append("status", "accepted");
    else if (event.target === rejectButton)
      formData.append("status", "rejected");

    fetcher(`/api/users/${userId}/`, {
      method: "PUT",
      body: formData,
    })
      .then(() => {
        if (!window.location.hash.startsWith("#/users")) return;
        return render();
      })   
  }
  friendButton.addEventListener("click", handleClick);
  acceptButton.addEventListener("click", handleClick);
  rejectButton.addEventListener("click", handleClick);
  const langSelector = document.getElementById("langSelector");
  langSelector.addEventListener("change", async () => {
    await userLastGames(userId);
  });
}

export default render;
