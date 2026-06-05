import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/index';

@Injectable()
export class JwtUtil {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateToken(payload: JwtPayload, expiresIn?: string): string {
    return this.jwtService.sign(payload, {
      expiresIn: expiresIn || this.configService.get('JWT_EXPIRATION'),
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }
}
