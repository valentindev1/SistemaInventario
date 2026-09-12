package com.vhela.inventario.servicio.informes;

import java.time.LocalDate;

import com.vhela.inventario.dto.informes.InformeFinancieroEmpresaDTO;

public interface InformeFinancieroServicio {

    InformeFinancieroEmpresaDTO generar(
            Long usuarioId,
            Long empresaId,
            Long sucursalId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    );
}
