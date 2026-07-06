import { useEffect, useState } from "react"
import { fetchLogs } from "../api/logs"

export default function AdminLogs() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetchLogs().then(setLogs)
  }, [])

  return (
    <div className="admin-logs">
      <h2>Historique des actions</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Cible</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td>{log.date}</td>
              <td>{log.user}</td>
              <td>{log.action}</td>
              <td>{log.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
