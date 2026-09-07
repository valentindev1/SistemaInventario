package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActualizarCostoProductoDTO {

    @NotBlank(message = "El tipo de costo es obligatorio")
    private String tipoCosto;

    @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El costo unitario no tiene un formato válido")
    private BigDecimal costoUnitario;

    private List<@Valid ProductoCostoDetalleCrearDTO> desgloseCosto;
}
