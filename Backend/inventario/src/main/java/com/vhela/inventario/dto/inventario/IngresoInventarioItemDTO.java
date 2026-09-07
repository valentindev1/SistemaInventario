package com.vhela.inventario.dto.inventario;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;


@Data
public class IngresoInventarioItemDTO {

    @NotNull(message = "El producto es obligatorio")
    private Long productoId;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a cero")
    private Integer cantidad;

    @NotNull(message = "El costo unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
    private BigDecimal costoUnitario;

    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio de venta no puede ser negativo")
    private BigDecimal precioVenta;

    /**
     * Cuando se informa, el backend recalcula el precio para que el valor
     * guardado sea consistente con la utilidad mostrada en el formulario.
     */
    private String modoUtilidad;

    @DecimalMin(value = "0.00", message = "La utilidad no puede ser negativa")
    private BigDecimal valorUtilidad;

    /**
     * Indica que la utilidad fue modificada en el ingreso y debe convertirse
     * en una regla propia del artículo. Si es false, se conserva la regla
     * propia existente o la herencia de la categoría.
     */
    private Boolean reglaUtilidadModificada;
}
