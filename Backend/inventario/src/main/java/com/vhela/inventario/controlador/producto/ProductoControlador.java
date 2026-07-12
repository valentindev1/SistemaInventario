package com.vhela.inventario.controlador.producto;

import com.vhela.inventario.dto.producto.producto.ProductoAdminObtenerDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEditarDTO;
import com.vhela.inventario.servicio.producto.ProductoServicio;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class ProductoControlador {

    private final ProductoServicio productoServicio;

    @PostMapping
    public ResponseEntity<ProductoAdminObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody ProductoCrearDTO dto) {

        ProductoAdminObtenerDTO response = productoServicio.crear(usuarioId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<?>> listar(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(productoServicio.listar(usuarioId));
    }

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<?>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(productoServicio.listarPorEmpresa(usuarioId, empresaId));
    }

    @GetMapping("/{productoId}")
    public ResponseEntity<?> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId) {

        return ResponseEntity.ok(productoServicio.obtenerPorId(usuarioId, productoId));
    }

    @PutMapping("/{productoId}")
    public ResponseEntity<ProductoAdminObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId,
            @Valid @RequestBody ProductoEditarDTO dto) {

        return ResponseEntity.ok(productoServicio.editar(usuarioId, productoId, dto));
    }

    @DeleteMapping("/{productoId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId) {

        productoServicio.eliminar(usuarioId, productoId);

        return ResponseEntity.noContent().build();
    }
}