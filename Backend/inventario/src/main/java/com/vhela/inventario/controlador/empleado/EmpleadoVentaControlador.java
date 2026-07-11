package com.vhela.inventario.controlador.empleado;

import java.util.List;

import com.vhela.inventario.dto.venta.CrearVentaDTO;
import com.vhela.inventario.dto.venta.DevolucionVentaDTO;
import com.vhela.inventario.dto.venta.empleado.venta.FacturaVentaEmpleadoDTO;
import com.vhela.inventario.dto.venta.empleado.venta.VentaHistorialEmpleadoDTO;
import com.vhela.inventario.servicio.venta.VentaServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/empleado/ventas")
@RequiredArgsConstructor
public class EmpleadoVentaControlador {

    private final VentaServicio ventaServicio;

    @PostMapping
    public ResponseEntity<FacturaVentaEmpleadoDTO> crearVentaEmpleado(
            @RequestParam Long usuarioId,
            @Valid @RequestBody CrearVentaDTO dto
    ) {
        FacturaVentaEmpleadoDTO response = ventaServicio.crearVentaEmpleado(
                usuarioId,
                dto
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{ventaId}")
    public ResponseEntity<FacturaVentaEmpleadoDTO> obtenerPorIdEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable Long ventaId
    ) {
        return ResponseEntity.ok(
                ventaServicio.obtenerPorIdEmpleado(usuarioId, ventaId)
        );
    }

    @GetMapping("/sucursal/{sucursalId}")
    public ResponseEntity<List<VentaHistorialEmpleadoDTO>> listarPorSucursalEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId
    ) {
        return ResponseEntity.ok(
                ventaServicio.listarPorSucursalEmpleado(usuarioId, sucursalId)
        );
    }

    @PostMapping("/{ventaId}/devoluciones")
    public ResponseEntity<FacturaVentaEmpleadoDTO> generarDevolucionEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable Long ventaId,
            @Valid @RequestBody DevolucionVentaDTO dto
    ) {
        return ResponseEntity.ok(
                ventaServicio.generarDevolucionEmpleado(usuarioId, ventaId, dto)
        );
    }

    @GetMapping("/numero/{numeroVenta}")
    public ResponseEntity<FacturaVentaEmpleadoDTO> obtenerPorNumeroEmpleado(
            @RequestParam Long usuarioId,
            @PathVariable String numeroVenta
    ) {
        return ResponseEntity.ok(
                ventaServicio.obtenerPorNumeroEmpleado(usuarioId, numeroVenta)
        );
    }
}
