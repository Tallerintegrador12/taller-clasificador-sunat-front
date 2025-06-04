export interface Adjunto {
  cod_mensaje: string;
  cod_archivo: string | null;
  nom_archivo: string | null;
  nom_adjunto: string | null;
  cnt_tamarch: string | null;
  num_id: number;
  ind_mensaje: string;
  num_ecm: string;
  tamano_archivo_format: string | null;
  url: string | null;
}

export interface Notificacion {
  msj_mensaje: string;
  cod_usuario: string;
  nomb_usuario: string;
  list_attach: Adjunto[];
}
