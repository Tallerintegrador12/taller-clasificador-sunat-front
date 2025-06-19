export interface Usuario {
  ruc: string;
  usuario: string;
  password: string;
}

export interface UsuarioAutenticado {
  ruc: string;
  nombreUsuario: string;
  loginTime: string;
}
