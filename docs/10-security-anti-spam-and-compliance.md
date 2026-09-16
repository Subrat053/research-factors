# 10. SECURITY, ANTI-SPAM & COMPLIANCE

## 1. Security Architecture & Threat Modeling

Research Factors implements a defense-in-depth security model adhering to the **OWASP Top 10** standards. Security is not an afterthought added at deployment; it is integrated into every middleware, controller, and data query.

---

## 2. OWASP Top 10 Mitigation Matrix

| Vulnerability | Threat Scenario | Architectural Mitigation |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | An author alters `articleId` in URL to edit someone else's draft. | `requireArticleOwnership` middleware checks `authorId === req.user.id` or explicit `article.update_any` permission. |
| **A02: Cryptographic Failures** | Compromised database leaks cleartext or weakly hashed passwords. | Password hashing with **Argon2id** (or bcrypt with salt factor >= 12). Tokens hashed using SHA-256 before storage. |
| **A03: Injection (SQL / NoSQL)**| Malicious SQL fragments passed in search or ID parameters. | **Prisma ORM** enforces parameterized SQL queries. Raw string interpolation in queries is strictly prohibited. |
| **A04: Insecure Design** | Unlimited comment spam degrades platform reputation. | Rate limiting per user/IP, anti-spam honeypot fields, and comment nesting caps. |
| **A05: Security Misconfiguration**| Sensitive stack traces, development credentials, or server headers leaked. | Helmet middleware active; `NODE_ENV=production` disables stack traces; `X-Powered-By` header stripped. |
| **A06: Vulnerable Components** | Outdated npm packages with known CVEs. | Dependabot / npm audit checks integrated into automated CI pipeline. |
| **A07: Identification & Auth Failures** | Credential stuffing or brute force against login endpoints. | Tiered rate limiting on `/auth/login` (5 failures per 15 mins per IP); account lockouts on repeated failures. |
| **A08: Software & Data Integrity**| Malicious executable uploaded disguised as an image. | Magic-byte MIME verification via `file-type`, Sharp re-encoding to WebP, and non-executable storage permissions. |
| **A09: Logging & Monitoring Failures**| Attacks go unnoticed; administrative actions cannot be traced. | Winston JSON logging with `X-Request-Id`; mandatory immutable `AuditLog` records for all administrative events. |
| **A10: Server-Side Request Forgery**| Malicious URLs in article embeds trigger SSRF attacks against internal networks. | Allowlist of approved embed domains (YouTube, Vimeo, GitHub); arbitrary iframe URLs blocked. |

---

## 3. Rate Limiting Tiers

Rate limiting is applied at the API gateway / Express middleware layer using `express-rate-limit`:

```javascript
// Rate Limiter Configurations
export const rateLimiters = {
  // Authentication routes (Prevent brute force)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                  // 10 attempts per IP
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } }
  }),

  // Comment creation (Prevent automated flooding)
  comments: rateLimit({
    windowMs: 60 * 1000,      // 1 minute
    max: 5,                   // 5 comments per user
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Commenting too quickly. Please pause.' } }
  }),

  // Media upload (Protect storage quotas & compute)
  mediaUpload: rateLimit({
    windowMs: 60 * 1000,      // 1 minute
    max: 10,                  // 10 uploads per user
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Upload limit reached. Try again shortly.' } }
  }),

  // Public search queries
  search: rateLimit({
    windowMs: 60 * 1000,      // 1 minute
    max: 30                   // 30 searches per IP
  })
};
```

---

## 4. Content Sanitization & XSS Defense

All user-submitted text (article blocks and comments) is sanitized on write using `sanitize-html`:

```javascript
import sanitizeHtml from 'sanitize-html';

export function sanitizeArticleHtml(dirtyHtml) {
  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'h2', 'h3', 'h4', 'p', 'b', 'i', 'em', 'strong', 'a',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'caption'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'th': ['colspan', 'rowspan'],
      'td': ['colspan', 'rowspan']
    },
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
    }
  });
}
```

---

## 5. Privacy, DTO Serialization & GDPR Readiness

Database records must NEVER be sent directly in HTTP responses.
Every module defines a `DTO` (Data Transfer Object) that white-lists allowed response fields:

```javascript
// backend/src/modules/users/user.dto.js
export class UserDTO {
  static toPublicProfile(user) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt
      // Notice: email, passwordHash, and internal tokens are STRICTLY EXCLUDED
    };
  }

  static toPrivateAccount(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };
  }
}
```
