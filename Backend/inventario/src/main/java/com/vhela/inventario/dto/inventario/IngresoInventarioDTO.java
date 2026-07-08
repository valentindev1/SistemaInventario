package com.vhela.inventario.dto.inventario;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IngresoInventarioDTO {

    @NotNull(message = "La sucursal es obligatoria")
    private Long sucursalId;

    @NotEmpty(message = "Debe ingresar al menos un producto")
    @Valid
    private List<IngresoInventarioItemDTO> items;

    private String motivo;
}