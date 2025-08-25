export interface SignUpRequest {
  email: string;
  password: string;
  nama: string;
  branch_id: string;
  position_id: string;
  role_id: string;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    nama: string;
    branch_id: string;
    position_id: string;
    role_id: string;
    is_active: boolean;
    created_at: string;
  };
  error?: string;
}

export interface User {
  id: string;
  branch_id: string;
  position_id: string;
  role_id: string;
  nama: string;
  email: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface Branch {
  id: string;
  nama: string;
  alamat: string;
  is_active: boolean;
}

export interface Position {
  id: string;
  nama: string;
  is_active: boolean;
}

export interface Role {
  id: string;
  nama: string;
  is_active: boolean;
}