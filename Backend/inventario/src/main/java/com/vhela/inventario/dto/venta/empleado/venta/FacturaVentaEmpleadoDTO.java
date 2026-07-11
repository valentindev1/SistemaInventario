package com.vhela.inventario.dto.venta.empleado.venta;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.vhela.inventario.modelo.ventas.EstadoFactura;

import lombok.Data;

@Data
public class FacturaVentaEmpleadoDTO {

    private Long id;

    private String numeroVenta;

    private Long sucursalId;

    private String sucursalNombre;

    private Long usuarioId;

    private String usuarioNombre;

    private Long clienteId;

    private String clienteNombre;

    private String clienteDocumento;

    private EstadoFactura estado;

    private BigDecimal descuento;

    private BigDecimal subtotal;

    private BigDecimal total;

    private String observacion;

    private LocalDateTime fechaVenta;

    private List<DetalleFacturaVentaEmpleadoDTO> detalles;
}