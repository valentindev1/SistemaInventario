package com.vhela.inventario.dto.comprasvarias;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CompraVariasDTO {

    private Long id;
    private String concepto;
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
