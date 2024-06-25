import { fetcher } from "../../../utils/auth.js";
import { getImageRoute } from "../../../constants.js";

async function init() {
  const user = await fetcher("/api/users/me", {});

  const hash = window.location.hash.split("?")[0];
  if (hash && hash !== "#/") return;
  const languageElection = document.getElementById("langSelector");
  const localStorageLanguage = localStorage.getItem("i18nextLng");
  if (localStorageLanguage && localStorageLanguage != languageElection.value) {
    languageElection.value = localStorageLanguage;
    languageElection.dispatchEvent(new Event("change"));
  }

  const salutation = document.getElementById("helloUser");
  salutation.innerText = `${salutation.textContent} ${user[0].username}`;

  const playedGames = document.getElementById("playedGames");
  playedGames.innerText = `${playedGames.textContent} ${user[0].played_games}`;

  const winGames = document.getElementById("winGames");
  winGames.innerText = `${winGames.textContent} ${user[0].win_games}`;

  const loseGames = document.getElementById("loseGames");
  loseGames.innerText = `${loseGames.textContent} ${user[0].lose_games}`;

  const playerImg = document.getElementById("playerImage");
  playerImg.src = getImageRoute(user[0].avatar);

  const localGameButton = document.getElementById("startLocalGame");
  const localTournamentButton = document.getElementById("startLocalTournament");
  const remoteGameButton = document.getElementById("remoteGame");
  const newRemoteGameButton = document.getElementById("newRemoteGame");
  const newTournamentButton = document.getElementById("createTournament");
  const tournamentButton = document.getElementById("tournament");

  localGameButton.addEventListener("click", () => {
    fetcher("/api/games/games/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        n_players: 2,
        type: "local",
      }),
    }).then((gameId) => {
      if (window.location.hash && window.location.hash !== "#/") return;
      window.location.hash = `/pong-local/${gameId.id}`;
    });
  });

  localTournamentButton.addEventListener("click", () => {
    window.location.hash = `/pong-localTournament/`;
  });

  newRemoteGameButton.addEventListener("click", () => {
    fetcher("/api/games/games/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        n_players: 2,
        type: "remote",
      }),
    }).then((gameId) => {
      if (window.location.hash && window.location.hash !== "#/") return;
      window.location.hash = `/pong-remote/${gameId.id}`;
    });
  });

  remoteGameButton.addEventListener("click", () => {
    const myModal = new bootstrap.Modal(
      document.getElementById("remoteGameModal"),
      {
        keyboard: true,
      }
    );
    myModal.show();
    const sendIdButton = document.getElementById("sendIdButton");
    sendIdButton.addEventListener("click", () => {
      const remoteGameId = document.getElementById("inputRemoteGameId").value;
      window.location.hash = `/pong-remote/${remoteGameId}.`;
    });
  });

  newTournamentButton.addEventListener("click", () => {
    const myModal = new bootstrap.Modal(
      document.getElementById("newTournamentModal"),
      {
        keyboard: true,
      }
    );
    myModal.show();
    const createTournamentButton = document.getElementById(
      "createTournamentButton"
    );
    createTournamentButton.addEventListener("click", () => {
      const nbrPlayers = document.getElementById("nbrPlayersSelector").value;
      fetcher("/api/games/games/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          n_players: nbrPlayers,
          type: "tournament",
        }),
      }).then((data) => {
        if (window.location.hash && window.location.hash !== "#/") return;
        window.location.hash = `/pong-tournament/${data.id}`;
      });
    });
  });

  tournamentButton.addEventListener("click", () => {
    const myModal = new bootstrap.Modal(
      document.getElementById("tournamentModal"),
      {
        keyboard: true,
      }
    );
    myModal.show();
    const sendTournamentIdButton = document.getElementById("tournamentButton");
    sendTournamentIdButton.addEventListener("click", () => {
      const remoteTournamentId =
        document.getElementById("inputTournamentId").value;
      if (remoteTournamentId)
        window.location.hash = `/pong-tournament/${remoteTournamentId}.`;
    });
  });

  languageElection.addEventListener("change", function () {
    salutation.innerText = `${salutation.textContent} ${user[0].username}`;
    playedGames.innerText = `${playedGames.textContent} ${user[0].played_games}`;
    winGames.innerText = `${winGames.textContent} ${user[0].win_games}`;
    loseGames.innerText = `${loseGames.textContent} ${user[0].lose_games}`;
  });
}

export default init;
