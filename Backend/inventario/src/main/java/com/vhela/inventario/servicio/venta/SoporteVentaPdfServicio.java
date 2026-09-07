package com.vhela.inventario.servicio.venta;

import com.vhela.inventario.dto.venta.soporte.SoporteVentaDTO;

public interface SoporteVentaPdfServicio {
    byte[] generarPdf(SoporteVentaDTO soporte);
}
