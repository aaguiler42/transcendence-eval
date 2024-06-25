import { fetcher, getUserIdFromToken } from "../../../utils/auth.js";
import {
  djangoDefaultImgUrl,
  getImageRoute,
  djangoUrl,
  webSocketUrl,
} from "../../../constants.js";
import { baseUrl } from "./constants.js";

function cleanMsgDiv(msgDiv) {
  while (msgDiv.firstChild) {
    msgDiv.removeChild(msgDiv.firstChild);
  }
}

function userNameAndMsgDate(chat) {
  const nameDateDiv = document.createElement("div");
  nameDateDiv.classList.add("d-flex", "justify-content-between");
  const userName = document.createElement("p");
  if (chat.sender == user[0].id) userName.innerText = `${user[0].username}`;
  else {
    const friendIndex = user[0].friends.findIndex(
      (obj) => obj.id === chat.sender
    );
    userName.innerText = `${user[0].friends[friendIndex].user_B_username}`;
  }
  userName.classList.add("small", "mb-1");
  const msgDate = document.createElement("p");
  const fullDate = new Date(chat.time);
  const date = fullDate.toLocaleDateString();
  const time = fullDate.toLocaleTimeString();
  msgDate.innerText = `${date} ${time}`;
  msgDate.classList.add("small", "mb-1", "text-muted");
  if (chat.receiver == user[0].id) {
    nameDateDiv.appendChild(userName);
    nameDateDiv.appendChild(msgDate);
  } else {
    nameDateDiv.appendChild(msgDate);
    nameDateDiv.appendChild(userName);
  }
  return nameDateDiv;
}

function getFriendImg(route) {
  const userImg = document.createElement("img");
  if (route) {
    const tmpRoute = route.includes("http") ? route : `${djangoUrl}${route}`;
    userImg.src = getImageRoute(tmpRoute);
  } else userImg.src = djangoDefaultImgUrl;
  userImg.classList.add("rounded-circle", "position-relative");
  userImg.style = "width: 45px; height: 100%;";
  return userImg;
}

function getMsgText(chat) {
  const text = document.createElement("p");
  text.classList.add("small", "p-2", "me-3", "mb-3", "ms-3", "rounded-3");
  const regex = /^(?:pong-(?:remote|local|tournament))\/\d+$/;
  const message = chat.message.endsWith(".")
    ? chat.message.slice(0, -1)
    : chat.message;
  if (regex.test(message)) {
    text.innerHTML = `You have been invited to play, <a data-link href="${baseUrl}:3000/#/${message}.">Play here</a>`;
  } else {
    text.innerText = message;
  }
  return text;
}

function userAvatarAndMsg(chat) {
  const userMsg = document.createElement("div");
  userMsg.classList.add("d-flex", "flex-row");

  const textDiv = document.createElement("div");
  const text = getMsgText(chat);

  if (chat.receiver == user[0].id) {
    const friendIndex = user[0].friends.findIndex(
      (obj) => obj.id === chat.sender
    );
    const userImg = getFriendImg(user[0].friends[friendIndex].user_B_avatar);
    userImg.alt = `Avatar ${user[0].friends[friendIndex].user_B_username}`;
    text.classList.add("bg-secondary", "text-white");
    textDiv.appendChild(text);
    userMsg.classList.add("justify-content-start");
    userMsg.appendChild(userImg);
    userMsg.appendChild(textDiv);
  } else {
    const userImg = getFriendImg(user[0].avatar);
    userImg.alt = `Avatar ${user[0].username}`;
    text.classList.add("bg-warning", "text-dark");
    textDiv.appendChild(text);
    userMsg.classList.add("justify-content-end", "mb-4", "pt-1");
    userMsg.appendChild(textDiv);
    userMsg.appendChild(userImg);
  }
  return userMsg;
}

function userAvatar(friend) {
  const friendIndex = user[0].friends.findIndex((obj) => obj.id === friend.id);
  if (friendIndex >= 0) {
    const userImg = getFriendImg(user[0].friends[friendIndex].user_B_avatar);
    userImg.alt = `Avatar ${user[0].friends[friendIndex].user_B_username}`;
    return userImg;
  }
}

function userName(friend) {
  const nameDateDiv = document.createElement("div");
  nameDateDiv.classList.add("d-flex", "mt-2", "justify-content-between");
  const username = document.createElement("a");
  username.setAttribute("data-link", "");
  username.innerText = `${friend.user_B_username}`;
  username.classList.add("small", "ms-2", "w-25");
  username.href = `#/users/${friend.id}`;

  const chatButton = document.createElement("button");
  chatButton.id = friend.id;
  chatButton.classList.add(
    "small",
    "p-2",
    "me-3",
    "mb-3",
    "ms-3",
    "text-dark",
    "rounded-3",
    "btn",
    "btn-warning",
    "btnChat"
  );
  chatButton.value = friend.id;
  chatButton.innerText = "Chat";

  const inviteButton = document.createElement("button");
  inviteButton.id = `newButton_${friend.id}`;
  inviteButton.classList.add(
    "small",
    "p-2",
    "mb-3",
    "text-white",
    "rounded-3",
    "btn",
    "btn-primary",
    "btnNew",
    "d-none",
    "inviteButton"
  );

  if (window.location.hash.startsWith("#/pong"))
    inviteButton.classList.remove("d-none");
  inviteButton.innerText = "Invite";

  inviteButton.addEventListener("click", (e) => {
    e.preventDefault();
    const message = window.location.hash.slice(2);
    const obj = {
      message,
      to: friend.id.toString(),
    };
    socket.send(JSON.stringify(obj));
  });

  const userAvatarDiv = userAvatar(friend);
  nameDateDiv.appendChild(userAvatarDiv);
  nameDateDiv.appendChild(username);
  nameDateDiv.appendChild(chatButton);
  nameDateDiv.appendChild(inviteButton);

  return nameDateDiv;
}

function getPreview(msgDiv, data) {
  let newMsgs = 0;
  if (data.friends) {
    data.friends.forEach((friend) => {
      friendsNewMsg.push(friend.id);
    });
  } else friendsNewMsg.push(parseInt(data.friend_id, 10));

  user[0].friends.forEach((friend) => {
    if (friend.status == "accepted") {
      const nameDateDiv = userName(friend);
      if (friendsNewMsg.includes(friend.id)) {
        const badge = document.createElement("span");
        badge.classList.add(
          "position-absolute",
          "start-0",
          "translate-middle-y",
          "badge",
          "rounded-pill",
          "bg-danger"
        );
        badge.id = `badge_${friend.id}`;
        badge.textContent = "New Message";
        nameDateDiv.appendChild(badge);
        msgDiv.appendChild(nameDateDiv);
        newMsgs++;
      } else if (!friendsNewMsg.includes(friend.id)) {
        msgDiv.appendChild(nameDateDiv);
      }
    }
  });
}

function getChatMsgs(msgDiv, messages) {
  if (messages === "none") msgDiv.innerText = "No messages yet";
  else {
    messages.forEach((chat) => {
      const nameDateDiv = userNameAndMsgDate(chat);
      const userMsg = userAvatarAndMsg(chat);

      msgDiv.appendChild(nameDateDiv);
      msgDiv.appendChild(userMsg);
    });
  }
}

function handleMessage(e) {
  const data = JSON.parse(e.data);
  let closeChatButtonAdded = false;

  const msgDiv = document.getElementById("chat");
  const msgDivPreview = document.getElementById("chatPreview");
  const chatBoxView = document.getElementById("chatbox");
  const preViewBox = document.getElementById("preViewBox");
  if (chatBoxView.classList.contains("d-none")) {
    cleanMsgDiv(msgDivPreview);
    getPreview(msgDivPreview, data);
  } else {
    cleanMsgDiv(msgDiv);
    fetcher(
      `/api/chat/chat/${data.friend_id}/?user_id=${getUserIdFromToken()}`,
      {}
    ).then((data_chat) => {
      getChatMsgs(msgDiv, data_chat);
      msgDiv.scrollTop = msgDiv.scrollHeight;
    });
  }

  const buttons = document.querySelectorAll(".btnChat");
  buttons.forEach(function (button) {
    const privateChat = document.getElementById(button.id);
    button.addEventListener("click", (e) => {
      e.preventDefault();

      const friendId = privateChat.id;
      const badge = document.getElementById(`badge_${friendId}`);
      if (badge) {
        friendsNewMsg = friendsNewMsg.filter((item) => {
          return item !== Number(friendId);
        });
        badge.remove();
      }
      friendToSend = friendId;
      if (chatBoxView.classList.contains("d-none")) {
        chatBoxView.classList.remove("d-none");
        preViewBox.classList.add("d-none");

        cleanMsgDiv(msgDiv);
        fetcher(
          `/api/chat/chat/${friendId}/?user_id=${getUserIdFromToken()}`,
          {}
        ).then((data_chat) => {
          if (data_chat.message === "No messages yet") data_chat = "none";
          getChatMsgs(msgDiv, data_chat);
          msgDiv.scrollTop = msgDiv.scrollHeight;

          const closeButton = document.getElementById("closeChat");
          closeButton.addEventListener("click", () => {
            chatBoxView.classList.add("d-none");
            preViewBox.classList.remove("d-none");
          });
          closeChatButtonAdded = true;
        });
      }
    });
  });
}

async function initSocket() {
  const accessToken = localStorage.getItem("accessToken");
  const chatSocket = new WebSocket(
    `${webSocketUrl}chat/${getUserIdFromToken()}/?jwt=${accessToken}`
  );
  chatSocket.onmessage = handleMessage;
  chatSocket.onerror = (event) => {
    console.error("WebSocket error observed:", event);
  };
  chatSocket.onclose = () => {
    console.error("WebSocket closed unexpectedly");
  };
  return chatSocket;
}

export async function initChat() {
  user = await fetcher("/api/users/me", {});
  socket = await initSocket();

  const sendMessageForm = document.getElementById("send-message-form");
  sendMessageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const to = friendToSend;
    const message = document.getElementById("message").value;
    if (message.trim()) {
      socket.send(
        JSON.stringify({
          to,
          message,
        })
      );
    }
    sendMessageForm.reset();
  });
}

let friendToSend = "";
let friendsNewMsg = [];
let user;
let socket;
