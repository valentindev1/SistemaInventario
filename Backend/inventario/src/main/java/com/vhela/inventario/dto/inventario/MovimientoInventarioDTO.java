package com.vhela.inventario.dto.inventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class MovimientoInventarioDTO {

    private Long id;

    private String tipo;

    /** INVENTARIO para movimientos de stock o CATALOGO para actividades del catálogo. */
    private String origen;

    private Long productoId;
    private String productoCodigo;
    private String productoNombre;

    private Long sucursalId;
    private String sucursalNombre;

    private Integer cantidad;
    private Integer stockAntes;
    private Integer stockDespues;

    private BigDecimal costoUnitarioMomento;
    private BigDecimal precioVentaMomento;

    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioRol;

    private String motivo;

    private Long referenciaId;

    private LocalDateTime fecha;

    private Boolean puedeRevertirse;
    private Boolean revertido;
    private Long movimientoReversionId;
}
