import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSecretRequestType } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const jwtSecretProvider = {
  provide: 'JWT_SECRET',
  useFactory: () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  },
};

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: ['JWT_SECRET'],
      useFactory: (secret: string) => ({
        secret,
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES_IN ||
            '24h') as unknown as JwtSecretRequestType,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    jwtSecretProvider,
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [jwtSecretProvider],
})
export class AuthModule {}
