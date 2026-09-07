package com.vhela.inventario.dto.contabilidad;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ClasificacionContableDTO {

    private Long id;
    private String nombre;
    private String tipo;
    private Long empresaId;
    private String empresaNombre;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
}
