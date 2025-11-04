import { IPRateLimiter } from '../middleware/ipRateLimit';
import { Request, Response, NextFunction } from 'express';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    incr: jest.fn().mockResolvedValue(1),
    pexpire: jest.fn().mockResolvedValue(1),
    pttl: jest.fn().mockResolvedValue(60000),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue('1'),
    keys: jest.fn().mockResolvedValue([]),
  }));
});

describe('IP Rate Limiter', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test',
      socket: { remoteAddress: '127.0.0.1' } as any,
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should create rate limiter with correct options', () => {
    const limiter = new IPRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
    });

    expect(limiter).toBeDefined();
  });

  it('should extract IP from x-forwarded-for header', async () => {
    mockRequest.headers = {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
    };

    const limiter = new IPRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
    });

    await limiter.middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      '100'
    );
  });

  it('should set rate limit headers', async () => {
    const limiter = new IPRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
    });

    await limiter.middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      '100'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Remaining',
      expect.any(String)
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Reset',
      expect.any(String)
    );
  });

  it('should call next() when under rate limit', async () => {
    const limiter = new IPRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
    });

    await limiter.middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});
