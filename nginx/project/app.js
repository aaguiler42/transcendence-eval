const routes = {
  "#/": {
    path: "/home",
    authenticated: true,
    hasChat: true,
  },
  "#/users/:id": {
    path: "/users/userId",
    authenticated: true,
    hasChat: true,
  },
  "#/login": {
    path: "/login",
    authenticated: false,
    hasChat: false,
  },
  "#/register": {
    path: "/register",
    authenticated: false,
    hasChat: false,
  },
  "#/logout": {
    path: "/logout",
    authenticated: true,
    hasChat: false,
  },
  "#/me": {
    path: "/users/me",
    authenticated: true,
    hasChat: true,
  },
  "#/games/:id": {
    path: "/games",
    authenticated: true,
    hasChat: true,
  },
  "#/friends": {
    path: "/users/friends",
    authenticated: true,
    hasChat: true,
  },
  "#/2fa": {
    path: "/2fa",
    authenticated: false,
    hasChat: false,
  },
  "#/ranking": {
    path: "/ranking",
    authenticated: false,
    hasChat: false,
  },
  "#/pong-local/:id": {
    path: "/pong-local",
    authenticated: true,
    hasChat: true,
  },
  "#/pong-remote/:id": {
    path: "/pong-remote",
    authenticated: true,
    hasChat: true,
  },
  "#/pong-tournament/:id": {
    path: "/pong-tournament",
    authenticated: true,
    hasChat: true,
  },
  "#/pong-localTournament/": {
    path: "/pong-localTournament",
    authenticated: true,
    hasChat: true,
  },
};

import { isUserAuthenticated, loginWith42 } from "./utils/auth.js";
import { initChat } from "./chat_app.js";

function getRoute() {
  const path = window.location.hash || "#/";
  const pathWithoutQueryParams = path.split("?")[0];
  const pathIfDinamic =
    pathWithoutQueryParams.substring(
      0,
      pathWithoutQueryParams.lastIndexOf("/")
    ) + "/:id";
  return routes[pathWithoutQueryParams] ?? routes[pathIfDinamic];
}

export async function render() {
  const route = getRoute();

  if (!route) {
    const html = await fetch(`pages/404/index.html`).then((response) =>
      response.text()
    );
    const app = document.getElementById("app");
    app.innerHTML = html;
    return;
  }

  const isAuthenticated = isUserAuthenticated();
  if (route.authenticated && !isAuthenticated) {
    window.location.hash = "#/login";
    return;
  }

  if (
    route.path === "/login" ||
    route.path === "/register" ||
    route.path === "/2fa"
  ) {
    document.getElementById("navbar").classList.add("d-none");
    document.getElementById("initFontSize").classList.remove("d-none");
    document.getElementById("initLangSel").classList.remove("d-none");
    if (isAuthenticated) {
      window.location.hash = "#/";
      return;
    }
  } else {
    document.getElementById("navbar").classList.remove("d-none");
    document.getElementById("initFontSize").classList.add("d-none");
    document.getElementById("initLangSel").classList.add("d-none");
  }

  const routePath = `pages${route.path}`;

  const html = await fetch(`${routePath}/index.html`).then((response) =>
    response.text()
  );
  const app = document.getElementById("app");
  app.innerHTML = html;

  const chatSection = document.getElementById("chatSection");
  if (route.hasChat) {
    if (chatSection.classList.contains("d-none")) {
      chatSection.classList.remove("d-none");
      await initChat();
    }
  } else {
    if (!chatSection.classList.contains("d-none"))
      chatSection.classList.add("d-none");
  }

  const classes = ["f0", "f1", "f2", "f3", "f4"];
  let classIndex = 1;
  document
    .getElementById("initIncreaseFont")
    .addEventListener("click", function () {
      let previousClass = classIndex;
      classIndex++;
      classIndex =
        classIndex == classes.length ? classes.length - 1 : classIndex;
      changeClass(previousClass, classIndex);
    });
  document
    .getElementById("initDecreaseFont")
    .addEventListener("click", function () {
      let previousClass = classIndex;
      classIndex--;
      classIndex = classIndex < 0 ? 0 : classIndex;
      changeClass(previousClass, classIndex);
    });

  document
    .getElementById("navIncreaseFont")
    .addEventListener("click", function () {
      let previousClass = classIndex;
      classIndex++;
      classIndex =
        classIndex == classes.length ? classes.length - 1 : classIndex;
      changeClass(previousClass, classIndex);
    });
  document
    .getElementById("navDecreaseFont")
    .addEventListener("click", function () {
      let previousClass = classIndex;
      classIndex--;
      classIndex = classIndex < 0 ? 0 : classIndex;
      changeClass(previousClass, classIndex);
    });
  function changeClass(previous, next) {
    if (previous != next) {
      const htmlElement = document.querySelector("html");
      htmlElement.classList.remove(classes[previous]);
      htmlElement.classList.add(classes[next]);
    }
  }
  try {
    translatePage();
  } catch (error) {
    console.error("Error translate i18n:", error);
  }

  const inviteButtons = document.querySelectorAll(".inviteButton");
  if (
    route.path.includes("/pong-remote") ||
    route.path.includes("/pong-tournament")
  ) {
    inviteButtons.forEach((button) => {
      if (button.classList.contains("d-none"))
        button.classList.remove("d-none");
    });
  } else {
    inviteButtons.forEach((button) => {
      if (!button.classList.contains("d-none")) button.classList.add("d-none");
    });
  }

  import(`./${routePath}/app.js`)
    .then(async (module) => {
      if (module?.default) await module.default();
    })
}

function initRouter() {
  try {
    initI18n();
  } catch (error) {
    console.error("Error initializing i18n:", error);
  }
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    loginWith42(code);
  }
  window.addEventListener("hashchange", () => render());

  document.body.addEventListener("click", (e) => {
    if (e.target.matches("[data-link]")) {
      e.preventDefault();
      const href = e.target.getAttribute("href");
      const hash = href.substring(href.indexOf("#") + 1);
      window.location.hash = hash;
    }
  });
  render();
}

initRouter();

async function loadSpanishTranslations() {
  const response = await fetch("./lang/es.json");
  const data = await response.json();
  return { translation: data };
}

async function loadEnglishTranslations() {
  const response = await fetch("./lang/en.json");
  const data = await response.json();
  return { translation: data };
}

async function loadFrenchTranslations() {
  const response = await fetch("./lang/fr.json");
  const data = await response.json();
  return { translation: data };
}

export function translatePage() {
  const elementsToTranslate = document.querySelectorAll("[data-i18n]");
  elementsToTranslate.forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = i18next.t(key);
  });

  const attributeToTranslate = document.querySelectorAll(
    "[data-i18n-placeholder]"
  );
  attributeToTranslate.forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    element.setAttribute("placeholder", i18next.t(key));
  });
  const altToTranslate = document.querySelectorAll("[data-i18n-alt]");
  altToTranslate.forEach((element) => {
    const key = element.getAttribute("data-i18n-alt");
    element.setAttribute("alt", i18next.t(key));
  });
}

async function initI18n() {
  const languageElection = document.getElementById("langSelector");
  const storedLanguage = localStorage.getItem("language");
  const initialLanguage = storedLanguage || "en";

  languageElection.value = initialLanguage;

  languageElection.addEventListener("change", function () {
    const selectedLanguage = languageElection.value;
    i18next.changeLanguage(selectedLanguage);

    localStorage.setItem("language", selectedLanguage);

    translatePage();
  });

  await i18next.use(i18nextBrowserLanguageDetector).init({
    resources: {
      en: await loadEnglishTranslations(),
      es: await loadSpanishTranslations(),
      fr: await loadFrenchTranslations(),
    },
    fallbackLng: "es",
    debug: false,
  });
  i18next.changeLanguage(initialLanguage);
  translatePage();
}
