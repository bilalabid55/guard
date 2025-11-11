export interface User {
  _id: string;
  fullName: string;
  name?: string;
  email: string;
  role: 'super_admin' | 'admin' | 'site_manager' | 'security_guard' | 'receptionist';
  isActive: boolean;
  emailVerified?: boolean;
  phone?: string;
  address?: string;
  profileImage?: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  subscription?: string;
  assignedSite?: string;
  accessPoints?: string[];
  managedSites?: string[];
  company?: string;
  position?: string;
}
