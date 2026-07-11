package com.vhela.inventario.controlador.empleado;


import com.vhela.inventario.dto.inventario.empleado.MovimientoInventarioEmpleadoDTO;
import com.vhela.inventario.servicio.inventario.InventarioServicio;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empleado/inventario")
@RequiredArgsConstructor
public class EmpleadoInventarioControlador {

    private final InventarioServicio inventarioServicio;

    @GetMapping("/sucursal/{sucursalId}/movimientos")
    public ResponseEntity<List<MovimientoInventarioEmpleadoDTO>> listarMovimientosPorSucursalEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId
    ) {
        return ResponseEntity.ok(
                inventarioServicio.listarMovimientosPorSucursalEmpleado(
                        usuarioId,
                        sucursalId
                )
        );
    }
}
