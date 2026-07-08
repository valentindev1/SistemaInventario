package com.vhela.inventario.dto.inventario;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AjusteInventarioDTO {

    @NotNull(message = "La sucursal es obligatoria")
    private Long sucursalId;

    @NotNull(message = "El producto es obligatorio")
    private Long productoId;

    @NotNull(message = "La cantidad es obligatoria")
    private Integer cantidad;

    private String motivo;
}