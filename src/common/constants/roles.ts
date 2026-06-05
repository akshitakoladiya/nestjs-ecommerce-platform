export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CUSTOMER = 'customer',
  DELIVERY_BOY = 'delivery_boy',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.MANAGER]: ['read', 'update', 'manage_orders', 'manage_products'],
  [UserRole.CUSTOMER]: ['read', 'create_order'],
  [UserRole.DELIVERY_BOY]: ['read', 'update_order_status'],
};
