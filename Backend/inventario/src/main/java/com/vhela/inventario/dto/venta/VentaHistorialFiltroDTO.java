package com.vhela.inventario.dto.venta;

import com.vhela.inventario.modelo.ventas.EstadoFactura;
import lombok.Data;

import java.time.LocalDate;

@Data
public class VentaHistorialFiltroDTO {

    private EstadoFactura estado;

    private String cliente;

    private String documentoCliente;

    private String usuario;

    private String numeroVenta;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;
}
