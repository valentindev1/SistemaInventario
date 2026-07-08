package com.vhela.inventario.dto.venta;


import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class DevolucionVentaDTO {

    private String motivo;

    @Valid
    @NotEmpty(message = "Debe existir al menos un producto para devolver")
    private List<DevolucionVentaItemDTO> items;
}
