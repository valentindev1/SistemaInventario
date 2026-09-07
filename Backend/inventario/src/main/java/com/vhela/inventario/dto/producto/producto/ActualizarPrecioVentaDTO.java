package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActualizarPrecioVentaDTO {

    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de venta no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El precio de venta no tiene un formato válido")
    private BigDecimal precioVenta;

    @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El costo unitario no tiene un formato válido")
    private BigDecimal costoUnitario;

    /**
     * Regla propia que se debe guardar junto con el nuevo precio.
     * El ajuste en dinero se convierte a porcentaje antes de enviarse.
     */
    private String tipoGanancia;

    @DecimalMin(value = "0.00", message = "La utilidad no puede ser negativa")
    @Digits(integer = 10, fraction = 2, message = "La utilidad no tiene un formato válido")
    private BigDecimal valorGanancia;
}
