import { useShows } from "../../contexts/ShowContext";
import "./AuditLog.css";

export default function AuditLog() {
  const { auditLogs } = useShows();

  return (
    <div className="audit-log-page">
      <section className="home-section">
        <div className="section-header">
          <h2>Activity Log</h2>
        </div>

        {auditLogs.length === 0 ? (
          <div className="empty-logs">
            <p>No activity logs recorded yet. All CRUD operations on Series, Seasons, and Episodes will be logged here.</p>
          </div>
        ) : (
          <div className="logs-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="log-timestamp">{log.timestamp}</td>
                    <td>
                      <span className={`log-badge badge-${log.action}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="log-details">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
