import { Injectable, BadRequestException, UnauthorizedException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';
import { PasswordUtil } from '../../../common/utils/password.util';
import { EmailService } from '../../email/email.service';
import { UserRole } from '../../../common/constants/roles';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from '../dtos';

@Injectable()
export class UserService {
  private logger = new Logger('UserService');

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string; user: any }> {
    const { email, password, confirmPassword, firstName, lastName, mobileNo, gender } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await PasswordUtil.hash(password);
    const emailVerificationToken = this.generateToken();

    const newUser = await this.userModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      mobileNo,
      gender,
      roles: [UserRole.CUSTOMER],
      emailVerificationToken,
    });

    try {
      await this.emailService.sendVerificationEmail(
        newUser.email,
        newUser.firstName,
        emailVerificationToken,
      );
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
    }

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      user: this.formatUserResponse(newUser),
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    user.lastLogin = new Date();
    await user.save();

    const payload = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    return {
      accessToken,
      refreshToken,
      user: this.formatUserResponse(user),
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { token } = verifyEmailDto;

    const user = await this.userModel.findOne({ emailVerificationToken: token });
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const emailVerificationToken = this.generateToken();
    user.emailVerificationToken = emailVerificationToken;
    await user.save();

    try {
      await this.emailService.sendVerificationEmail(user.email, user.firstName, emailVerificationToken);
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw new BadRequestException('Failed to send verification email');
    }

    return { message: 'Verification email sent. Please check your email.' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await PasswordUtil.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await PasswordUtil.hash(newPassword);
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    const resetToken = this.generateToken();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      throw new BadRequestException('Failed to send password reset email');
    }

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await PasswordUtil.hash(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async createUser(userData: any): Promise<UserDocument> {
    const hashedPassword = await PasswordUtil.hash(userData.password);
    
    return this.userModel.create({
      ...userData,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      emailVerificationToken: this.generateToken(),
    });
  }

  async createUserByAdmin(userData: any, adminId: string): Promise<UserDocument> {
    const { email, password, roles } = userData;

    if (!roles || !Array.isArray(roles)) {
      throw new BadRequestException('Roles must be provided as an array');
    }

    const validRoles = [UserRole.MANAGER, UserRole.DELIVERY_BOY];
    const hasValidRole = roles.some(role => validRoles.includes(role));
    
    if (!hasValidRole) {
      throw new BadRequestException('Admin can only create Manager or Delivery Boy users');
    }

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await PasswordUtil.hash(password);

    const newUser = await this.userModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      mobileNo: userData.mobileNo,
      gender: userData.gender,
      roles,
      isEmailVerified: true,
      createdBy: adminId,
    });

    return newUser;
  }

  async updateProfile(userId: string, updateData: any): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private formatUserResponse(user: UserDocument) {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNo: user.mobileNo,
      gender: user.gender,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    };
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
