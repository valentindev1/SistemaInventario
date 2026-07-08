package com.vhela.inventario.dto.cliente;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ClienteCrearDTO {


    @NotNull(message = "La empresa es obligatoria")
    private Long empresaId;

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 30, message = "El número de documento no puede superar 30 caracteres")

    @Pattern(
            regexp = "^[0-9]+$",
            message = "El número de documento solo puede contener números"
    )
    private String numeroDocumento;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 3, max = 150,
            message = "El nombre debe tener entre 3 y 150 caracteres")
    private String nombre;

    @Email(message = "El correo electrónico no es válido")
    @Size(max = 150,
            message = "El correo no puede superar 150 caracteres")
    private String correo;

    @Size(max = 30,
            message = "El teléfono no puede superar 30 caracteres")
    private String telefono;


}