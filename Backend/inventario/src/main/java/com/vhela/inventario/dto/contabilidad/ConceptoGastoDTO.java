package com.vhela.inventario.dto.contabilidad;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ConceptoGastoDTO {

    private Long id;
    private String nombre;
    private String tipo;
    private Long clasificacionId;
    private String clasificacionNombre;
    private String descripcion;
    private String clasificacion;
    private Long empresaId;
    private String empresaNombre;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
}
