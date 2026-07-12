package com.vhela.inventario.controlador;

import com.vhela.inventario.dto.sucursal.SucursalCrearDTO;
import com.vhela.inventario.dto.sucursal.SucursalEditarDTO;
import com.vhela.inventario.dto.sucursal.SucursalObtenerDTO;
import com.vhela.inventario.servicio.sucursal.SucursalServicio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sucursales")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class SucursalControlador {

    private final SucursalServicio sucursalServicio;

    @PostMapping
    public ResponseEntity<SucursalObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody SucursalCrearDTO dto) {

        return ResponseEntity.status(201)
                .body(sucursalServicio.crear(usuarioId, dto));
    }

    @GetMapping
    public ResponseEntity<List<SucursalObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(sucursalServicio.listar(usuarioId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SucursalObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long id) {

        return ResponseEntity.ok(sucursalServicio.obtenerPorId(usuarioId, id));
    }

    @GetMapping("/empresa/{nit}")
    public ResponseEntity<List<SucursalObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable String nit) {

        return ResponseEntity.ok(
                sucursalServicio.listarPorEmpresa(usuarioId, nit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SucursalObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long id,
            @Valid @RequestBody SucursalEditarDTO dto) {

        return ResponseEntity.ok(
                sucursalServicio.editar(usuarioId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long id) {

        sucursalServicio.eliminar(usuarioId, id);
        return ResponseEntity.noContent().build();
    }
}