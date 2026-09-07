package com.vhela.inventario.dto.contabilidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RegistroContableDTO {

    private Long id;
    private String tipo;
    private String concepto;
    private Long conceptoGastoId;
    private String conceptoGastoNombre;
    private Long clasificacionId;
    private String clasificacionNombre;
    private String clasificacion;
    private String clasificacionGasto;
    private String descripcion;
    private BigDecimal valor;
    private LocalDate fecha;
    private Long sucursalId;
    private String sucursalNombre;
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioRol;
    private LocalDateTime fechaCreacion;
}
