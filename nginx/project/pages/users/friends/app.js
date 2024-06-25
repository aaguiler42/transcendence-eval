import { fetcher } from "../../../utils/auth.js";
import { baseUrl, djangoDefaultImgUrl } from "../../../constants.js";

const altMap = {
  es: (username) => `Avatar de perfil del usuario ${username}`,
  en: (username) => `Profile avatar of user ${username}`,
  fr: (username) => `Avatar de profil de l'utilisateur ${username}`,
};

const linkMap = {
  es: `Ver perfil`,
  en: `View profile`,
  fr: `Voir le profil`,
};

const statusMap = {
  es: (last_action) => `Estado ${last_action}`,
  en: (last_action) => `Estatus ${last_action}`,
  fr: (last_action) => `La situation ${last_action}`,
};

const esFriendShipMap = {
  accepted: `Aceptada`,
  sended: `Ènviada`,
  rejected: `rechazada`,
  received: `recibida`,
};

const enFriendShipMap = {
  accepted: `Accepted`,
  sended: `Sended`,
  rejected: `Rejected`,
  received: `Received`,
};

const frFriendShipMap = {
  accepted: `Accepté`,
  sended: `Envoyée`,
  rejected: `Rejetée`,
  received: `Reçue`,
};

const friendShipMap = {
  es: (status) => `Amistad ${esFriendShipMap[status]}`,
  en: (status) => `Friendship ${enFriendShipMap[status]}`,
  fr: (status) => `Amitié ${frFriendShipMap[status]}`,
};

function getUserLink(friend) {
  const userLink = document.createElement("div");
  userLink.classList.add("card-body");

  const userLinkData = document.createElement("a");
  userLinkData.setAttribute('data-link', '');
  const lang = document.getElementById("langSelector").value;

  userLinkData.textContent = linkMap[lang];
  userLinkData.href = `#/users/${friend.id}`;
  userLinkData.setAttribute(
    "aria-label",
    `${linkMap[lang]} ${friend.user_B_username}`
  );

  userLink.appendChild(userLinkData);

  return userLink;
}

function getUserImage(friend) {
  const playerImg = friend.user_B_avatar
    ? `${baseUrl}:3000/${friend.user_B_avatar}`
    : djangoDefaultImgUrl;
  const imgItem = document.createElement("img");
  imgItem.classList.add("card-img-top", "mt-2");
  imgItem.src = playerImg;
  imgItem.style.width = "150px";
  imgItem.style.height = "150px";
  imgItem.style.borderRadius = "50%";
  const lang = document.getElementById("langSelector").value;

  imgItem.alt = altMap[lang](friend.user_B_username);

  const imagContainer = document.createElement("div");
  imagContainer.className = "d-flex";

  imagContainer.appendChild(imgItem);

  return imagContainer;
}

function getUserBody(friend) {
  const friendBody = document.createElement("div");
  friendBody.classList.add("card-body");

  const friendTitle = document.createElement("h2");
  friendTitle.classList.add("card-title");
  friendTitle.innerText = friend.user_B_username;
  friendTitle.setAttribute("aria-label", `Username: ${friend.user_B_username}`);

  friendBody.appendChild(friendTitle);
  return friendBody;
}

function getUserData(friend) {
  const friendData = document.createElement("ul");
  friendData.classList.add("list-group", "list-group-flush");

  const lang = document.getElementById("langSelector").value;

  const friendDataItem1 = document.createElement("li");
  friendDataItem1.classList.add("list-group-item");
  friendDataItem1.innerText = statusMap[lang](friend.last_action);
  friendDataItem1.setAttribute(
    "aria-label",
    statusMap[lang](friend.last_action)
  );

  const friendDataItem2 = document.createElement("li");
  friendDataItem2.classList.add("list-group-item");
  friendDataItem2.innerText = friendShipMap[lang](friend.status);
  friendDataItem2.setAttribute(
    "aria-label",
    friendShipMap[lang](friend.status)
  );

  friendData.appendChild(friendDataItem1);
  friendData.appendChild(friendDataItem2);

  return friendData;
}

function getBadge(friend) {
  const newFriends = friend.status;

  if (newFriends === "received") {
    const badge = document.createElement("span");
    badge.classList.add(
      "position-relative",
      "top-0",
      "start-0",
      "translate-middle-y",
      "badge",
      "rounded-pill",
      "bg-danger"
    );
    badge.textContent = "New Request";
    badge.setAttribute("aria-label", "New friend request");
    return badge;
  }
}

function generateFriendComponent(friend) {
  const newFriendBadge = getBadge(friend);
  const userImage = getUserImage(friend);
  const userBody = getUserBody(friend);
  const userData = getUserData(friend);
  const userLink = getUserLink(friend);

  const friendComponent = document.createElement("div");
  friendComponent.classList.add("card", "ms-2", "mt-2");
  friendComponent.style.width = "18rem";
  friendComponent.setAttribute("role", "article");
  friendComponent.setAttribute(
    "aria-labelledby",
    userBody.querySelector("h2").id
  );

  if (newFriendBadge) friendComponent.appendChild(newFriendBadge);
  friendComponent.appendChild(userImage);
  friendComponent.appendChild(userBody);
  friendComponent.appendChild(userData);
  friendComponent.appendChild(userLink);

  return friendComponent;
}

async function init() {
  const user = await fetcher("/api/users/me", {});
  if (!window.location.hash.startsWith("#/friends")) return;
  let friend_list = document.getElementById("player_friends");
  let friends_array = user[0].friends;

  friends_array.forEach((friend) => {
    if (friend.status != "rejected") {
      if (friend.user_B_username != "transcendenc3") {
        const friendComponent = generateFriendComponent(friend);
        friend_list.appendChild(friendComponent);
      }
    }
  });
  const langSelector = document.getElementById("langSelector");
  langSelector.addEventListener("change", function () {
    friend_list.innerHTML = "";
    friends_array.forEach((friend) => {
      if (friend.status != "rejected") {
        if (friend.user_B_username != "transcendenc3") {
          const friendComponent = generateFriendComponent(friend);
          friend_list.appendChild(friendComponent);
        }
      }
    });
  });
}

export default init;
