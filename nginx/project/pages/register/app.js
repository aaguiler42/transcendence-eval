import { fetcher } from "../../../utils/auth.js";
import { translatePage } from "../../../app.js";
import { djangoUrl } from "../../../constants.js";

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

  const submitButton = document.getElementById("submitbutton");
  const registerForm = document.getElementById("registerForm");

  const alertDiv = document.getElementById("alert_pswd");
  const alertUser = document.getElementById("alertUser");
  const alertEmail = document.getElementById("alertEmail");
  const alertEmailFormat = document.getElementById("alertEmailFormat");
  const alertRequired = document.getElementById("alertRequired");
  const alertDateFormat = document.getElementById("alertDateFormat");
  const alertDate = document.getElementById("alertDate");

  submitButton.addEventListener("click", function () {
    alertDiv.classList.add("d-none");
    alertEmail.classList.add("d-none");
    alertUser.classList.add("d-none");
    alertRequired.classList.add("d-none");
    alertDateFormat.classList.add("d-none");
    alertDate.classList.add("d-none");
    alertEmailFormat.classList.add("d-none");

    if (!registerForm.checkValidity()) {
      registerForm.reportValidity();
      return;
    }

    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirm_password").value;
    const inDate = document.getElementById("birthdate").value;
    const formatDate = new Date(inDate);
    const today = new Date();
    if (password != confirm_password) {
      alertDiv.classList.remove("d-none");
    } else if (
      today.getFullYear() < formatDate.getFullYear() ||
      (today.getFullYear() <= formatDate.getFullYear() &&
        today.getMonth() + 1 < formatDate.getMonth() + 1) ||
      (today.getFullYear() <= formatDate.getFullYear() &&
        today.getMonth() + 1 <= formatDate.getMonth() + 1 &&
        today.getDate() < formatDate.getDate())
    ) {
      alertDate.classList.remove("d-none");
    } else {
      const first_name = document.getElementById("first_name").value;
      const last_name = document.getElementById("last_name").value;
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const birthdate = document.getElementById("birthdate").value;
      const language = document.getElementById("languageSelector").value;
      const avatarFile = document.getElementById("avatar");
      const avatar = avatarFile.files[0];

      const formData = new FormData();
      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("username", username.toLowerCase());
      formData.append("username", username);
      formData.append("password", password);
      formData.append("email", email);
      formData.append("birthdate", birthdate);
      formData.append("avatar", avatar);
      formData.append("def_language", language);

      fetch(`${djangoUrl}/api/users/`, {
        method: "POST",
        body: formData,
      })
        .then(async (data) => {
          const dataObj = await data.json();
          if (!window.location.hash.startsWith("#/register")) return;
          if (data.status === 201) {
            localStorage.setItem("accessToken", dataObj.access);
            localStorage.setItem("refreshToken", dataObj.refresh);
            localStorage.setItem("language", dataObj.user.def_language);

            translatePage();
            window.location.hash = "#/";
          } else {
            if (
              dataObj.message &&
              dataObj.message.includes("Username") &&
              data.status === 400
            ) {
              alertUser.classList.remove("d-none");
            } else if (
              dataObj.message &&
              (dataObj.message.includes("Email") || dataObj.email) &&
              data.status === 400
            ) {
              alertEmail.classList.remove("d-none");
            } else if (dataObj.email && data.status === 400) {
              alertEmailFormat.classList.remove("d-none");
            } else if (dataObj.birthdate) {
              alertDateFormat.classList.remove("d-none");
            } else {
              alertRequired.classList.remove("d-none");
            }
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }
        })
    }
  });
}

export default init;
