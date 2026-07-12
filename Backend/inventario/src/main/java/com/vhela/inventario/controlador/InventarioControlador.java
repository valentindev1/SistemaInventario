package com.vhela.inventario.controlador;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.vhela.inventario.dto.inventario.AjusteInventarioDTO;
import com.vhela.inventario.dto.inventario.IngresoInventarioDTO;
import com.vhela.inventario.dto.inventario.MovimientoInventarioDTO;
import com.vhela.inventario.dto.inventario.ResumenInventarioSucursalDTO;
import com.vhela.inventario.servicio.inventario.InventarioServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class InventarioControlador {

    private final InventarioServicio inventarioServicio;


    @PostMapping("/ingresos")
    public ResponseEntity<Void> ingresarMercancia(
            @RequestParam Long usuarioId,
            @Valid @RequestBody IngresoInventarioDTO dto) {

        inventarioServicio.ingresarMercancia(usuarioId, dto);

        return ResponseEntity.status(201).build();
    }

    @PostMapping("/ajustes")
    public ResponseEntity<Void> ajustarInventario(
            @RequestParam Long usuarioId,
            @Valid @RequestBody AjusteInventarioDTO dto) {

        inventarioServicio.ajustarInventario(usuarioId, dto);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/sucursal/{sucursalId}")
    public ResponseEntity<List<?>> listarPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {

        return ResponseEntity.ok(
                inventarioServicio.listarPorSucursal(usuarioId, sucursalId)
        );
    }



    @GetMapping("/sucursal/{sucursalId}/resumen")
    public ResponseEntity<ResumenInventarioSucursalDTO> obtenerResumenSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {

        return ResponseEntity.ok(
                inventarioServicio.obtenerResumenSucursal(usuarioId, sucursalId)
        );
    }

    @GetMapping("/sucursal/{sucursalId}/movimientos")
    public ResponseEntity<List<MovimientoInventarioDTO>> listarMovimientosPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {

        return ResponseEntity.ok(
                inventarioServicio.listarMovimientosPorSucursal(usuarioId, sucursalId)
        );
    }
}