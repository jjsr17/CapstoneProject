export function mapSessionsToEvents(sessions = []) {
  return sessions.map((s) => ({
    id: s._id,
    title: s.title || "Tutoring Session",
    start: new Date(s.start),
    end: new Date(s.end),
  }));
}
