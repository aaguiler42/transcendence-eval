import { djangoUrl } from "../constants.js";

export function isUserAuthenticated() {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const areBothTokensPresent =
    !!accessToken &&
    !!refreshToken &&
    accessToken !== "undefined" &&
    refreshToken !== "undefined";
  return areBothTokensPresent;
}

export function getUserIdFromToken() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;
  const payload = accessToken.split(".")[1];
  const data = JSON.parse(atob(payload));
  return data.user_id;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.hash = "#/login";
}

async function handleLoginResponse(response) {
  const responseObj = await response.json();
  const alertDiv = document.getElementById("alert_credentials");

  if (
    response.status === 200 &&
    responseObj.message === "Two factor authentication required"
  ) {
    localStorage.setItem("dataEncripted", responseObj.data);
    window.location.hash = "#/2fa";
    return;
  }
  if (response.status === 200 && responseObj.access && responseObj.refresh) {
    localStorage.setItem("accessToken", responseObj.access);
    localStorage.setItem("refreshToken", responseObj.refresh);

    if (
      responseObj.user.def_language &&
      responseObj.user.def_language != localStorage.getItem("i18nextLng")
    ) {
      localStorage.setItem("i18nextLng", responseObj.user.def_language);
      localStorage.setItem("language", responseObj.user.def_language);
    }

    window.location.hash = "#/";
  }
  if (response.status === 401) {
    alertDiv.classList.remove("d-none");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

export async function login(username, password) {
  const alertDiv = document.getElementById("alert_credentials");
  const response = await fetch(`${djangoUrl}/api/users/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => handleLoginResponse(response));
}

export async function loginWith42(code) {
  const response = await fetch(`${djangoUrl}/api/users/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  })
    .then((response) => handleLoginResponse(response));
}

export async function twoFactorLogin(tfaCode, dataEncripted) {
  const alertDiv = document.getElementById("alert_credentials");
  const response = await fetch(`${djangoUrl}/api/users/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      two_factor_code: tfaCode,
      data: dataEncripted,
    }),
  })
    .then((response) => handleLoginResponse(response))
    .catch(() => {
      alertDiv.classList.remove("d-none");
    });
}

export async function fetcher(relativeUrl, options) {
  const url = `${djangoUrl}${relativeUrl}`;
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) throw new Error("No access token found");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => response.json());
  if (
    response?.messages?.some(
      ({ message }) => message === "Token is invalid or expired"
    )
  ) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      logout();
      return;
    }
    const tokens = await fetch(`${djangoUrl}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then((response) => response.json())
    if (!tokens.access) {
      logout();
      return;
    }
    localStorage.setItem("accessToken", tokens.access);

    return fetcher(relativeUrl, options);
  }

  return response;
}
