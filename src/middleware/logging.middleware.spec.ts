import { Request, Response } from 'express';
import { LoggingMiddleware } from './logging.middleware';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
    mockRequest = { method: 'GET', url: '/products' };
    mockNext = jest.fn();
  });

  it('should log request method and URL', () => {
    const finishCallbacks: (() => void)[] = [];
    mockResponse = {
      on: jest.fn((_event: string, cb: () => void) => {
        if (_event === 'finish') finishCallbacks.push(cb);
      }),
    } as unknown as Partial<Response>;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    finishCallbacks[0]();
    expect(mockResponse.on).toHaveBeenCalledWith(
      'finish',
      expect.any(Function),
    );
  });

  it('should log response duration', () => {
    const finishCallbacks: (() => void)[] = [];
    mockResponse = {
      on: jest.fn((_event: string, cb: () => void) => {
        if (_event === 'finish') finishCallbacks.push(cb);
      }),
    } as unknown as Partial<Response>;

    const spy = jest.spyOn(middleware['logger'], 'log');

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    finishCallbacks[0]();

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/products - \d+ms$/),
    );
  });
});
