package com.vhela.inventario.dto.venta.soporte;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class SoporteVentaDTO {

    private String empresaNombre;
    private String sucursalNombre;
    private String sucursalDireccion;
    private String sucursalTelefono;

    private String numeroVenta;
    private LocalDate fechaVenta;
    private LocalTime horaVenta;

    private String vendedorNombre;

    private String clienteNombre;
    private String clienteDocumento;

    private BigDecimal subtotal;
    private BigDecimal descuento;
    private BigDecimal total;

    private List<SoporteVentaItemDTO> items;
}