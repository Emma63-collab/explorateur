export async function fetchLogs() {
  const res = await fetch("http://localhost/backend/logs.php", {
    credentials: "include"
  })
  return await res.json()
}
