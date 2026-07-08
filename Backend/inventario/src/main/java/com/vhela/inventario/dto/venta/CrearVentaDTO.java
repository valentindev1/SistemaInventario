package com.vhela.inventario.dto.venta;


import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CrearVentaDTO {

    @NotNull(message = "La sucursal es obligatoria")
    private Long sucursalId;


    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;


    private String observacion;

    private BigDecimal descuento;


    @Valid
    @NotEmpty(message = "Debe existir al menos un producto en la venta")
    private List<VentaItemDTO> items;



}
