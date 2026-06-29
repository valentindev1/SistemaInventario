package com.vhela.inventario.dto.sucursal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SucursalCrearDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150)
    private String nombre;

    @NotBlank(message = "La ciudad es obligatoria")
    @Size(max = 200)
    private String ciudad;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 200)
    private String direccion;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 30)
    private String telefono;

    // CLAVE: referencia a empresa
    @NotBlank(message = "El nit de la empresa es obligatorio")
    private String empresaNit;


}
