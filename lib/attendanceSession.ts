/**
 * In-memory attendance session store.
 * Codes are NEVER written to the database — they live in server RAM only
 * and are auto-cleaned once they expire.
 */

export interface AttendanceSession {
  /** 6-char alphanumeric code for present students */
  code: string
  /** Optional 6-char code for the late check-in window */
  lateCode: string | null
  /** Epoch ms when the main window closes */
  expiresAt: number
  /** Epoch ms when the late window closes (null if not started) */
  lateExpiresAt: number | null
  coachingCenterId: string
  standard: string
  date: string // YYYY-MM-DD
  /** Latitude of the coaching center/teacher when session started */
  lat?: number | null
  /** Longitude of the coaching center/teacher when session started */
  lon?: number | null
  /** Radius in metres within which students must be to mark attendance */
  radiusM: number
  /** student IDs who submitted the main code */
  checkedIn: Set<string>
  /** student IDs who submitted the late code */
  lateCheckedIn: Set<string>
}

// Global singleton map — key: `${coachingCenterId}:${date}`
const sessions = new Map<string, AttendanceSession>()

function makeKey(coachingCenterId: string, date: string, standard?: string) {
  // We ignore standard now so there's one global session per coaching center per day
  return `${coachingCenterId}:${date}`
}

/** Generate a random 6-character uppercase alphanumeric code */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Create or overwrite a session for a given coaching center */
export function createSession(
  coachingCenterId: string,
  date: string,
  standard: string,
  durationMs = 10 * 60 * 1000,
  lat?: number | null,
  lon?: number | null,
  radiusM = 150
): AttendanceSession {
  const key = makeKey(coachingCenterId, date, standard)
  const session: AttendanceSession = {
    code: generateCode(),
    lateCode: null,
    expiresAt: Date.now() + durationMs,
    lateExpiresAt: null,
    coachingCenterId,
    standard,
    date,
    lat: lat ?? null,
    lon: lon ?? null,
    radiusM,
    checkedIn: new Set(),
    lateCheckedIn: new Set(),
  }
  sessions.set(key, session)

  // Auto-delete after expiry
  setTimeout(() => {
    const s = sessions.get(key)
    if (s && Date.now() >= s.expiresAt) {
      sessions.delete(key)
    }
  }, durationMs + 1000)

  return session
}

/** Attach a late check-in code to an existing session */
export function startLateWindow(
  coachingCenterId: string,
  date: string,
  standard?: string,
  durationMs = 5 * 60 * 1000
): AttendanceSession | null {
  const key = makeKey(coachingCenterId, date)
  const session = sessions.get(key)
  if (!session) return null

  session.lateCode = generateCode()
  session.lateExpiresAt = Date.now() + durationMs

  if (session.lateExpiresAt > session.expiresAt) {
    session.expiresAt = session.lateExpiresAt
  }

  return session
}

/** Get the active session for a coaching center / date */
export function getSession(
  coachingCenterId: string,
  date: string,
  standard?: string
): AttendanceSession | null {
  const key = makeKey(coachingCenterId, date)
  const session = sessions.get(key)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(key)
    return null
  }
  return session
}

/** Manually end a session */
export function endSession(
  coachingCenterId: string,
  date: string,
  standard?: string
): void {
  const key = makeKey(coachingCenterId, date)
  sessions.delete(key)
}

export function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in m
  return d;
}

/** Record a student check-in */
export function recordCheckIn(
  coachingCenterId: string,
  date: string,
  standard: string,
  studentId: string,
  submittedCode: string,
  studentLat?: number | null,
  studentLon?: number | null
): 'present' | 'late' | 'invalid' | 'already_marked' | 'too_far' {
  const session = getSession(coachingCenterId, date)
  if (!session) return 'invalid'

  const upperCode = submittedCode.trim().toUpperCase()

  if (session.checkedIn.has(studentId) || session.lateCheckedIn.has(studentId)) {
    return 'already_marked'
  }

  // Check code validity first
  const isMainValid = upperCode === session.code && Date.now() <= session.expiresAt
  const isLateValid = session.lateCode && upperCode === session.lateCode && session.lateExpiresAt && Date.now() <= session.lateExpiresAt

  if (!isMainValid && !isLateValid) {
    return 'invalid'
  }

  // Check GPS if teacher session has coordinates
  if (session.lat != null && session.lon != null) {
    if (studentLat == null || studentLon == null) {
      return 'too_far' // GPS required but not provided
    }
    const distanceM = getDistanceFromLatLonInM(session.lat, session.lon, studentLat, studentLon)
    // Accept if within the configured radius
    if (distanceM > session.radiusM) {
      return 'too_far'
    }
  }

  if (isMainValid) {
    session.checkedIn.add(studentId)
    return 'present'
  } else {
    session.lateCheckedIn.add(studentId)
    return 'late'
  }
}
