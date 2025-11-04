import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Authentication', () => {
  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-id';
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      expect(decoded.userId).toBe(userId);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET || 'secret');
      }).toThrow();
    });

    it('should reject expired tokens', () => {
      const userId = 'test-user-id';
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET || 'secret');
      }).toThrow('jwt expired');
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 12);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should verify correct passwords', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });
});
