import { logout } from "../../utils/auth.js";

export default function init() {
  logout();
  window.location.hash = "#/login";
}
