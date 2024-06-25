import { fetcher } from "../../../utils/auth.js";
import { getImageRoute } from "../../../constants.js";

function setUserData(user) {
  const playerImg = document.getElementById("playerImage");
  playerImg.src = getImageRoute(user.avatar);
  playerImg.alt = `${user.username} avatar`;

  document.getElementById("username").innerText = user.username || " - ";
  document.getElementById("floatingUsername").value = user.username || " - ";
  document.getElementById("name").innerText = user.first_name || " - ";
  document.getElementById("floatingFirstName").value = user.first_name || " - ";
  document.getElementById("lastname").innerText = user.last_name || " - ";
  document.getElementById("floatingLastName").value = user.last_name || " - ";
  document.getElementById("email").innerText = user.email || " - ";
  document.getElementById("floatingInput").value = user.email || " - ";
  document.getElementById("birthdate").innerText = user.birthdate || " - ";
  document.getElementById("floatingBirthdate").value = user.birthdate || " - ";
  document.getElementById("languageSelector").value = user.def_language || "en";
  document.getElementById("level").innerText = user.level.toFixed(2);

  document.getElementById("playedGames").innerText = user.played_games;
  document.getElementById("winGames").innerText = user.win_games;
  document.getElementById("loseGames").innerText = user.lose_games;
}

function getUserData() {
  const username = document.getElementById("floatingUsername").value;
  const first_name = document.getElementById("floatingFirstName").value;
  const last_name = document.getElementById("floatingLastName").value;
  const email = document.getElementById("floatingInput").value;
  const birthdate = document.getElementById("floatingBirthdate").value;
  const avatar_file = document.getElementById("avatar");
  const avatar = avatar_file.files[0];
  const languageElection = document.getElementById("languageSelector");
  const def_language = languageElection.value;

  const formData = new FormData();

  if (first_name) formData.append("first_name", first_name);
  if (last_name) formData.append("last_name", last_name);
  if (username) formData.append("username", username);
  if (email) formData.append("email", email);
  if (birthdate) formData.append("birthdate", birthdate);
  if (def_language) formData.append("def_language", def_language);
  if (localStorage.getItem("i18nextLng") != def_language) {
    localStorage.setItem("i18nextLng", def_language);
    document.getElementById("langSelector").value = def_language;
    document.getElementById("langSelector").dispatchEvent(new Event("change"));
  }
  if (avatar) formData.append("avatar", avatar);
  return formData;
}

function newFriendshipBadge(user) {
  const badge = document.getElementById("badge");
  const newFriends = user.friends.some(
    (friend) => friend.status === "received"
  );

  if (newFriends) {
    badge.style.display = "inline";
    badge.textContent = "New Request";
  } else badge.style.display = "none";
}

function userLastGames(user) {
  const tableBody = document.getElementById("lastsGames-table-body");
  tableBody.innerHTML = "";

  let nbr_games = 0;
  user.last_games.some((game) => {
    nbr_games = nbr_games + 1;
    if (nbr_games > 10) return true;
    const row = document.createElement("tr");
    row.classList.add("bg-dark", "textLight", "text-center");

    const iswinnerCell = document.createElement("td");
    iswinnerCell.classList.add("bg-dark", "textLight", "text-center");
    iswinnerCell.textContent = game.is_winner ? "Winner" : "Looser";
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
}

async function init() {
  const alertUser = document.getElementById("alertUser");
  const alertEmail = document.getElementById("alertEmail");
  const user = await fetcher("/api/users/me", {});
  if (!window.location.hash.startsWith("#/me")) return;
  setUserData(user[0]);
  newFriendshipBadge(user[0]);
  userLastGames(user[0]);

  const submitButton = document.getElementById("submitbutton");
  submitButton.addEventListener("click", function () {
    alertUser.classList.add("d-none");
    alertEmail.classList.add("d-none");

    const formData = getUserData();
    const collapseEditButton = document.getElementById("edit_button");
    collapseEditButton.click();
    fetcher("/api/users/me/", {
      method: "PATCH",
      body: formData,
    })
      .then((data) => {
        if (!window.location.hash.startsWith("#/me")) return;
        if (data && (data.message.includes("Email") || data.email))
          alertEmail.classList.remove("d-none");
        if (data && data.message.includes("Username"))
          alertUser.classList.remove("d-none");
        init();
      });
  });

  if (user[0].has_two_factor_auth == true) {
    document.getElementById("showTwoFactorAuth").classList.remove("d-none");
    document.getElementById("deleteTwoFactorAuth").classList.remove("d-none");
  } else if (user[0].has_two_factor_auth == false) {
    document.getElementById("enableTwoFactorAuth").classList.remove("d-none");
  }
  document
    .getElementById("showTwoFactorAuth")
    .addEventListener("click", async () => {
      const { two_factor_auth } = await fetcher("/api/users/me/two_fa", {});
      if (two_factor_auth === "") {
        return;
      }
      const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${two_factor_auth}`;
      const twofaImg = document.getElementById("qrCode");

      twofaImg.src = qrURL;
      twofaImg.classList.remove("d-none");
      document.getElementById("2faQrText").classList.remove("d-none");
    });
  document
    .getElementById("deleteTwoFactorAuth")
    .addEventListener("click", async () => {
      await fetcher("/api/users/me/two_fa", {
        method: "DELETE",
      });
      if (!window.location.hash.startsWith("#/me")) return;
      document.getElementById("showTwoFactorAuth").classList.add("d-none");
      document.getElementById("deleteTwoFactorAuth").classList.add("d-none");
      document.getElementById("qrCode").classList.add("d-none");
      document.getElementById("2faQrText").classList.add("d-none");
      document.getElementById("enableTwoFactorAuth").classList.remove("d-none");
    });
  document
    .getElementById("enableTwoFactorAuth")
    .addEventListener("click", async () => {
      await fetcher("/api/users/me/two_fa/", {
        method: "POST",
      });
      if (!window.location.hash.startsWith("#/me")) return;
      document.getElementById("showTwoFactorAuth").classList.remove("d-none");
      document.getElementById("deleteTwoFactorAuth").classList.remove("d-none");
      document.getElementById("enableTwoFactorAuth").classList.add("d-none");
    });
}

export default init;
