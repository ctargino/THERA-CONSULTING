import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async validateUser(username: string, password: string): Promise<boolean> {
    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;

    if (!validUsername || !validPassword) {
      throw new UnauthorizedException('Authentication not configured');
    }

    return username === validUsername && password === validPassword;
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const isValid = await this.validateUser(dto.username, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: dto.username, sub: dto.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
