package com.vhela.inventario.dto.venta.empleado.venta;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.vhela.inventario.modelo.ventas.EstadoFactura;

import lombok.Data;


@Data
public class VentaHistorialEmpleadoDTO {

    private Long id;

    private String numeroVenta;

    private Long usuarioId;
    private String usuarioNombre;

    private String clienteNombre;

    private String clienteDocumento;

    private EstadoFactura estado;

    private BigDecimal subtotal;

    private BigDecimal descuento;

    private BigDecimal total;

    private LocalDateTime fechaVenta;
}
