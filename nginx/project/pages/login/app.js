import { login } from "../../../utils/auth.js";
import { translatePage } from "../../../app.js";

function init() {
  const languageElection = document.getElementById("initLangSelector");
  const def_language = languageElection.value;
  const langPrev = localStorage.getItem("i18nextLng");

  languageElection.addEventListener("change", function () {
    const selectedLanguage = languageElection.value;
    i18next.changeLanguage(selectedLanguage);

    localStorage.setItem("language", selectedLanguage);

    translatePage();
  });

  if (def_language != langPrev) {
    languageElection.dispatchEvent(new Event("change"));
  }

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });
}

export default init;
