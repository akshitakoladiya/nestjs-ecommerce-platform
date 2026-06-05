import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private logger = new Logger('EmailService');

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${this.configService.get('APP_URL')}/auth/verify-email/${verificationToken}`;

    const htmlContent = `
      <h2>Welcome ${firstName}!</h2>
      <p>Thank you for registering. Please verify your email address to complete your registration.</p>
      <p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Email Verification - Ecommerce Platform',
      html: htmlContent,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('APP_URL')}/auth/reset-password/${resetToken}`;

    const htmlContent = `
      <h2>Password Reset Request</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click the link below to reset it:</p>
      <p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset - Ecommerce Platform',
      html: htmlContent,
    });
  }

  async sendOrderConfirmationEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    orderTotal: number,
  ): Promise<void> {
    const htmlContent = `
      <h2>Order Confirmation</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for your order!</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total Amount:</strong> $${orderTotal.toFixed(2)}</p>
      <p>We'll send you updates about your order status.</p>
      <p>Track your order on our website.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Order Confirmation - Ecommerce Platform',
      html: htmlContent,
    });
  }

  async sendShippingUpdateEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    trackingNumber: string,
  ): Promise<void> {
    const htmlContent = `
      <h2>Your Order Has Been Shipped!</h2>
      <p>Hi ${firstName},</p>
      <p>Your order <strong>${orderNumber}</strong> has been shipped!</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p>You can track your package using the tracking number above.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Shipping Update - Ecommerce Platform',
      html: htmlContent,
    });
  }

  private async sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_FROM'),
        ...options,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }
}
