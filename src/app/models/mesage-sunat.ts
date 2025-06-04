


// Interfaces basadas en tu API
export interface MensajeSunat {
  nu_codigo_mensaje: number;
  nu_pagina: number;
  nu_estado: number;
  nu_destacado: number;
  nu_urgente: number;
  dt_fecha_vigencia: string;
  nu_tipo_mensaje: number;
  vc_asunto: string;
  vc_fecha_envio: string;
  vc_fecha_publica: string;
  vc_usuario_emisor: string;
  nu_indicador_texto: number;
  nu_tipo_generador: number;
  vc_codigo_dependencia: string;
  nu_aviso: number;
  nu_cantidad_archivos: number;
  vc_codigo_etiqueta: string;
  nu_mensaje: number;
  vc_codigo_carpeta: string;
  vc_numero_ruc: string;
  nu_leido: number;
  nu_archivado: number;
}

export interface Etiqueta {
  nu_id_etiqueta: number;
  vc_nombre: string;
  vc_color: string;
  vc_codigo: string;
}

export interface RespuestaControlador<T> {
  vc_mensaje: string;
  nu_codigo: number;
  datos: T;
  vc_errores: string[];
}

// Nueva interfaz para el detalle del mensaje
export interface DetalleNotificacion {
  msj_mensaje: string;
  cod_usuario: string;
  nomb_usuario: string;
  list_attach: Adjunto[];
}

export interface Adjunto {
  cod_mensaje: string;
  cod_archivo: number;
  nom_archivo: string;
  nom_adjunto: string;
  cnt_tamarch: number;
  num_id: number;
  ind_mensaje: string;
  num_ecm: string;
  tamano_archivo_format: string;
  url: string;
}

// Interface para respuesta paginada
export interface RespuestaPaginada {
  content: MensajeSunat[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
