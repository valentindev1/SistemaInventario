package com.vhela.inventario.controlador;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhela.inventario.dto.informes.InformeFinancieroEmpresaDTO;
import com.vhela.inventario.servicio.informes.InformeFinancieroServicio;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/informes-financieros")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class InformeFinancieroControlador {

    private final InformeFinancieroServicio informeFinancieroServicio;

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<InformeFinancieroEmpresaDTO> generar(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId,
            @RequestParam(required = false) Long sucursalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin
    ) {
        return ResponseEntity.ok(
                informeFinancieroServicio.generar(
                        usuarioId,
                        empresaId,
                        sucursalId,
                        fechaInicio,
                        fechaFin
                )
        );
    }
}
