import { fetcher } from "../../../utils/auth.js";
import { djangoUrl, getImageRoute } from "../../../constants.js";

const altMap = {
  es: (username) => `Avatar del usuario ${username}`,
  en: (username) => `User ${username} avatar`,
  fr: (username) => `Avatar de l'utilisateur ${username}`,
};

const altFirstCrownMap = {
  es: `Corona de Primera Posición`,
  en: `First Position Crown`,
  fr: `Couronne de Première Position`,
};

const altSecondCrownMap = {
  es: `Corona de Segunda Posición`,
  en: `Second Position Crown`,
  fr: `Couronne de Deuxième Position`,
};

const altThirdCrownMap = {
  es: `Corona de Tercera Posición`,
  en: `Third Position Crown`,
  fr: `Couronne de Troisième Position`,
};

function renderTable(ranking, rank) {
  const tableBody = document.getElementById("ranking-table-body");
  const lang = localStorage.getItem("i18nextLng");
  if (ranking !== null && ranking.results !== null) {
    tableBody.innerHTML = "";
    ranking.results.sort((a, b) => a.position - b.position);
    let count = 0;
    ranking.results.forEach((user) => {
      if (rank === 1 && count < 3) {
        count++;
      } else {
        const row = document.createElement("tr");
        row.classList.add("bg-dark", "textLight", "text-center");

        const positionCell = document.createElement("td");
        positionCell.classList.add("bg-dark", "textLight", "text-center");
        positionCell.textContent = user.position;
        row.appendChild(positionCell);

        const imageCell = document.createElement("td");
        imageCell.classList.add("bg-dark", "textLight", "text-center");
        const image = document.createElement("img");
        image.src = getImageRoute(user.avatar);
        image.alt = altMap[lang](user.username);
        image.style.maxWidth = "50px";
        image.style.maxHeight = "50px";
        image.classList.add("img-thumbnail", "rounded-circle");
        imageCell.appendChild(image);
        row.appendChild(imageCell);

        const levelCell = document.createElement("td");
        levelCell.classList.add("bg-dark", "textLight", "text-center");
        levelCell.textContent = user.level.toFixed(2);
        row.appendChild(levelCell);

        const usernameCell = document.createElement("td");
        usernameCell.classList.add("bg-dark", "textLight", "text-center");
        const userName = document.createElement("a");
        userName.setAttribute('data-link', '');
        userName.innerText = user.username;
        userName.href = `#/users/${user.id}`;
        userName.classList.add("textLight");
        usernameCell.appendChild(userName);
        row.appendChild(usernameCell);

        const lastLoginCell = document.createElement("td");
        lastLoginCell.classList.add("bg-dark", "textLight", "text-center");
        lastLoginCell.textContent = user.last_action
          ? new Date(user.last_action).toLocaleString()
          : "N/A";
        row.appendChild(lastLoginCell);
        tableBody.appendChild(row);
      }
    });
  }
}

function createPagination(ranking, page) {
  const previousButton = ranking.links.previous;
  const nextButton = ranking.links.next;

  nextPage.replaceWith(nextPage.cloneNode(true));
  prevPage.replaceWith(prevPage.cloneNode(true));

  if (nextButton !== null && page !== null) {
    const newUrl = nextButton.replace(djangoUrl, "");
    nextPage.disabled = false;
    nextPage.addEventListener("click", (e) => {
      e.preventDefault();
      init(newUrl);
    });
  } else {
    nextPage.disabled = true;
  }

  if (previousButton !== null && page !== null) {
    const newUrl = previousButton.replace(djangoUrl, "");
    prevPage.disabled = false;
    prevPage.addEventListener("click", (e) => {
      e.preventDefault();
      init(newUrl);
    });
  } else {
    prevPage.disabled = true;
  }

  let totalPages = ranking.total_pages;
  const buttonsContainer = document.getElementById("buttons-container");

  if (buttonsContainer) {
    buttonsContainer.innerHTML = "";
  }
  if (totalPages < 2) {
    return;
  }
  if (page < 5) {
    for (let i = 1; i <= 5 && i <= totalPages; i++) {
      const button = document.createElement("button");
      button.textContent = `${i}`;
      button.className = "btn textLight btn-sm";
      button.setAttribute("aria-label", `Button to page ${i}`);
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const pagURL = `/api/ranking/?p=${i}`;
        init(pagURL);
      });
      buttonsContainer.appendChild(button);
    }
  } else {
    for (let i = page - 2; i <= page + 2 && i <= totalPages; i++) {
      const button = document.createElement("button");
      button.textContent = `${i}`;
      button.className = "btn textLight btn-sm";
      button.setAttribute("aria-label", `Button to page ${i}`);
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const pagURL = `/api/ranking/?p=${i}`;
        init(pagURL);
      });
      buttonsContainer.appendChild(button);
    }
  }
}

function SearchBar() {
  const searchButton = document.getElementById("searchButton");
  const searchInput = document.getElementById("searchInput");

  searchButton.addEventListener("click", () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      const searchUrl = `/api/ranking/?username=${searchTerm}`;
      init(searchUrl);
    } else {
      init();
    }
  });
}

function generateFixedDataCard(position, ranking) {
  const lang = localStorage.getItem("i18nextLng");
  const userImage = document.createElement("img");
  if (position === 1) {
    userImage.src = "../../img/First.png";
    userImage.alt = altFirstCrownMap[lang];
  } else if (position === 2) {
    userImage.src = "../../img/Second.png";
    userImage.alt = altSecondCrownMap[lang];
  } else if (position === 3) {
    userImage.src = "../../img/Third.png";
    userImage.alt = altThirdCrownMap[lang];
  }
  userImage.classList.add("card-img-top", "mx-auto", "d-block");
  userImage.style.maxWidth = "180px";
  userImage.style.maxHeight = "180px";

  const userBody = document.createElement("div");
  userBody.classList.add(
    "card-body",
    "d-flex",
    "flex-column",
    "justify-content-between"
  );

  const userHeader = document.createElement("div");
  userHeader.classList.add("d-flex", "align-items-center", "mb-2");

  const avatar = document.createElement("img");
  const user = ranking.results.find((user) => user.position === position);
  if (user) {
    avatar.alt = altMap[lang](user.username);
    avatar.style.width = "80px";
    avatar.style.height = "80px";
    avatar.classList.add("img-thumbnail", "rounded-circle");
    avatar.src = getImageRoute(user.avatar)
  }

  const userInfo = document.createElement("div");
  userInfo.classList.add("ms-2");

  const userData = document.createElement("h2");
  userData.classList.add("card-title", "mb-0", "fs-3");
  if (user) {
    userData.innerText = user.username;
    userData.innerHTML = `<a data-link class="text-dark" href="#/users/${user.id}">${user.username}</a>`;
  }

  const userText = document.createElement("p");
  userText.classList.add("card-text", "mb-0", "fs-5");
  if (user) {
    userText.innerText = "Level: " + user.level.toFixed(2);
  }

  userInfo.appendChild(userData);
  userInfo.appendChild(userText);
  userHeader.appendChild(avatar);
  userHeader.appendChild(userInfo);
  userBody.appendChild(userHeader);

  const friendComponent = document.createElement("div");
  friendComponent.classList.add("card", "ms-2", "mt-2");
  friendComponent.style.width = "18rem";

  friendComponent.appendChild(userImage);
  friendComponent.appendChild(userBody);

  return friendComponent;
}

async function init(url = "/api/ranking") {
  const ranking = await fetcher(url, {});
  if (!window.location.hash.startsWith("#/ranking")) return;

  if (
    url === "/api/ranking" ||
    url === "/api/ranking/" ||
    url === "/api/ranking/?p=1"
  ) {
    renderTable(ranking, 1);
  } else {
    renderTable(ranking, 0);
  }

  const urlParams = new URLSearchParams(url.split("?")[1]);
  const page = urlParams.get("p");
  if (urlParams && page) {
    createPagination(ranking, page);
  } else {
    createPagination(ranking, 1);
  }
  SearchBar();
  if (
    url === "/api/ranking" ||
    url === "/api/ranking/" ||
    url === "/api/ranking/?p=1"
  ) {
    const top3playersContainer = document.getElementById("top3players");
    if (top3playersContainer) {
      top3playersContainer.innerHTML = "";
    }
    document.getElementById("top3players").style.display = "flex";
    const card = generateFixedDataCard(2, ranking);
    card.classList.add("mt-4");
    top3playersContainer.appendChild(card);
    const card1 = generateFixedDataCard(1, ranking);
    top3playersContainer.appendChild(card1);
    const card2 = generateFixedDataCard(3, ranking);
    card2.classList.add("mt-5");
    top3playersContainer.appendChild(card2);
  } else {
    document.getElementById("top3players").style.display = "none";
  }
  const langSelector = document.getElementById("langSelector");
  langSelector.addEventListener("change", function () {
    init();
  });
}

export default init;
