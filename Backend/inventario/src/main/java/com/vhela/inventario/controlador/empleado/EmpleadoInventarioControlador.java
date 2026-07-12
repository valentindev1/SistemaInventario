package com.vhela.inventario.controlador.empleado;

import com.vhela.inventario.dto.inventario.InventarioEmpleadoDTO;
import com.vhela.inventario.dto.inventario.empleado.MovimientoInventarioEmpleadoDTO;
import com.vhela.inventario.servicio.inventario.InventarioServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/empleado/inventario")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPLEADO')")
public class EmpleadoInventarioControlador {

    private final InventarioServicio inventarioServicio;

    @GetMapping("/sucursal/{sucursalId}")
    public ResponseEntity<List<InventarioEmpleadoDTO>> listarInventarioPorSucursalEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId
    ) {
        List<InventarioEmpleadoDTO> inventario =
                inventarioServicio.listarInventarioPorSucursalEmpleado(
                        usuarioId,
                        sucursalId
                );

        return ResponseEntity.ok(inventario);
    }

    @GetMapping("/sucursal/{sucursalId}/movimientos")
    public ResponseEntity<List<MovimientoInventarioEmpleadoDTO>> listarMovimientosPorSucursalEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId
    ) {
        List<MovimientoInventarioEmpleadoDTO> movimientos =
                inventarioServicio.listarMovimientosPorSucursalEmpleado(
                        usuarioId,
                        sucursalId
                );

        return ResponseEntity.ok(movimientos);
    }
}