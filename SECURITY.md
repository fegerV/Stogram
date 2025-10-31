# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Stogram seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please Do

**Report security vulnerabilities via email to:** security@stogram.com

Include the following information:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication**: We will keep you informed about the progress of fixing the vulnerability
- **Credit**: We will credit you in our security advisories (unless you prefer to remain anonymous)
- **Timeline**: We aim to release security fixes within 7 days for critical issues

## Security Best Practices for Users

### For Self-Hosted Instances

1. **Use Strong Passwords**
   - Use passwords with at least 12 characters
   - Include uppercase, lowercase, numbers, and symbols
   - Never reuse passwords

2. **Keep Software Updated**
   - Regularly update Stogram to the latest version
   - Update Node.js, PostgreSQL, and other dependencies
   - Apply security patches promptly

3. **Secure Your Server**
   - Use a firewall (ufw, iptables)
   - Keep SSH access restricted
   - Use SSH keys instead of passwords
   - Regularly update your operating system

4. **Use HTTPS**
   - Always use SSL/TLS certificates
   - Use Let's Encrypt for free certificates
   - Enforce HTTPS for all connections

5. **Database Security**
   - Use strong database passwords
   - Restrict database access to localhost or VPN
   - Regular backups
   - Enable PostgreSQL SSL

6. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets
   - Rotate secrets regularly
   - Use different secrets for development and production

7. **Rate Limiting**
   - Keep rate limiting enabled
   - Adjust limits based on your usage patterns
   - Monitor for unusual activity

8. **File Uploads**
   - Validate file types
   - Scan uploaded files for malware
   - Set appropriate file size limits
   - Store uploads outside web root

### For Developers

1. **Code Security**
   - Never hardcode secrets or API keys
   - Use environment variables for configuration
   - Validate all user input
   - Sanitize data before database queries
   - Use parameterized queries (Prisma does this by default)

2. **Dependencies**
   - Regularly update npm packages
   - Run `npm audit` regularly
   - Review security advisories
   - Remove unused dependencies

3. **Authentication**
   - Never store passwords in plain text
   - Use bcrypt with appropriate rounds (12+)
   - Implement rate limiting on auth endpoints
   - Use secure JWT secrets

4. **WebSocket Security**
   - Validate WebSocket connections
   - Authenticate socket connections
   - Implement rate limiting
   - Validate all incoming messages

5. **API Security**
   - Use HTTPS only
   - Validate all inputs
   - Implement proper error handling
   - Don't expose sensitive information in errors

## Security Features

### Current Implementation

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Protection against brute force
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers middleware
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: React automatic escaping

### Planned Features

- Two-factor authentication (2FA)
- End-to-end encryption for messages
- Account recovery mechanisms
- Session management
- IP-based rate limiting
- Suspicious activity detection
- Security audit logs

## Security Updates

Subscribe to security updates:
- Watch this repository for security advisories
- Follow [@StogramSecurity](https://twitter.com/StogramSecurity) on Twitter
- Join our security mailing list: security-announce@stogram.com

## Responsible Disclosure

We follow responsible disclosure practices:
1. Report received and acknowledged
2. Issue verified and assessed
3. Fix developed and tested
4. Security advisory prepared
5. Fix released
6. Public disclosure (with credit to reporter)

## Bug Bounty

We currently do not have a bug bounty program, but we deeply appreciate security researchers who responsibly disclose vulnerabilities.

## Contact

For security concerns: security@stogram.com

For general questions: support@stogram.com

---

Thank you for helping keep Stogram and our users safe!
