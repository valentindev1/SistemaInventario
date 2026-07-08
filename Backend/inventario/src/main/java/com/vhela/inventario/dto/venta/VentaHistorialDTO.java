package com.vhela.inventario.dto.venta;


import com.vhela.inventario.modelo.ventas.EstadoFactura;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
public class VentaHistorialDTO {

    private Long id;

    private String numeroVenta;

    private LocalDateTime fechaVenta;

    private String clienteNombre;

    private String usuarioNombre;

    private EstadoFactura estado;

    private BigDecimal subtotal;

    private BigDecimal descuento;

    private BigDecimal total;
}
