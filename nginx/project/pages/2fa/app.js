import { login } from "../../../utils/auth.js";
import { translatePage } from "../../../app.js";
import { twoFactorLogin } from "../../../utils/auth.js";

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
    const two_factor = document.getElementById("2fa").value;
    const dataEncripted = localStorage.getItem("dataEncripted");
    twoFactorLogin(two_factor, dataEncripted);
  });
}

export default init;
