import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

const mockSign = jest.fn().mockReturnValue('signed-jwt-token');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    process.env.AUTH_USERNAME = 'testuser';
    process.env.AUTH_PASSWORD = 'testpass';
    mockSign.mockReturnValue('signed-jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: mockSign },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    delete process.env.AUTH_USERNAME;
    delete process.env.AUTH_PASSWORD;
  });

  describe('validateUser', () => {
    it('should return true for valid credentials', async () => {
      const result = await service.validateUser('testuser', 'testpass');
      expect(result).toBe(true);
    });

    it('should return false for invalid username', async () => {
      const result = await service.validateUser('wronguser', 'testpass');
      expect(result).toBe(false);
    });

    it('should return false for invalid password', async () => {
      const result = await service.validateUser('testuser', 'wrongpass');
      expect(result).toBe(false);
    });

    it('should throw UnauthorizedException when auth env vars are not set', async () => {
      delete process.env.AUTH_USERNAME;
      delete process.env.AUTH_PASSWORD;

      await expect(
        service.validateUser('testuser', 'testpass'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('testuser', 'testpass'),
      ).rejects.toThrow('Authentication not configured');
    });
  });

  describe('login', () => {
    const validDto: LoginDto = { username: 'testuser', password: 'testpass' };

    it('should return access_token for valid credentials', async () => {
      const result = await service.login(validDto);

      expect(result).toEqual({ access_token: 'signed-jwt-token' });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const invalidDto: LoginDto = {
        username: 'wronguser',
        password: 'testpass',
      };

      await expect(service.login(invalidDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(invalidDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should call jwtService.sign with correct payload', async () => {
      await service.login(validDto);

      expect(mockSign).toHaveBeenCalledWith({
        username: 'testuser',
        sub: 'testuser',
      });
    });
  });
});
