import { API } from "../config.js";

export async function fetchLogs() {
  const res = await fetch(`${API}/logs.php`, {
    credentials: "include"
  })
  return await res.json()
}
