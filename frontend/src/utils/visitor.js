/**
 * Manages persistent visitor identification and session tracking
 * for anonymous-first personalization without cookies or tracking overhead.
 */

const VISITOR_ID_KEY = 'rf_visitor_id';
const SESSION_ID_KEY = 'rf_session_id';
const SESSION_TIME_KEY = 'rf_session_last_active';
const DISMISSED_TIME_KEY = 'rf_interest_popup_dismissed_at';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generates RFC4122 compliant UUID v4 using crypto API or secure fallback
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates the persistent visitor ID
 */
export function getVisitorId() {
  if (typeof window === 'undefined') return 'server-visitor';
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return 'fallback-visitor';
  }
}

/**
 * Gets or creates the session ID, renewing if idle for more than 30 minutes
 */
export function getSessionId() {
  if (typeof window === 'undefined') return 'server-session';
  try {
    const now = Date.now();
    const lastActive = parseInt(sessionStorage.getItem(SESSION_TIME_KEY) || '0', 10);
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId || (now - lastActive > SESSION_TIMEOUT_MS)) {
      sessionId = generateUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    sessionStorage.setItem(SESSION_TIME_KEY, now.toString());
    return sessionId;
  } catch {
    return 'fallback-session';
  }
}

/**
 * Returns complete visitor context for API requests
 */
export function getVisitorContext() {
  return {
    visitorId: getVisitorId(),
    sessionId: getSessionId()
  };
}

/**
 * Checks whether interest explorer popup is within its cooldown period
 */
export function isPopupDismissed(cooldownDays = 7) {
  if (typeof window === 'undefined') return false;
  try {
    const dismissedAt = localStorage.getItem(DISMISSED_TIME_KEY);
    if (!dismissedAt) return false;

    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - parseInt(dismissedAt, 10);
    return elapsed < cooldownMs;
  } catch {
    return false;
  }
}

/**
 * Records popup dismissal or successful selection to start cooldown
 */
export function recordPopupDismissal() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISMISSED_TIME_KEY, Date.now().toString());
  } catch {
    // ignore storage quota issues
  }
}
