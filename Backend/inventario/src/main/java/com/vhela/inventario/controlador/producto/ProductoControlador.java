package com.vhela.inventario.controlador.producto;

import com.vhela.inventario.dto.producto.producto.ProductoAdminObtenerDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEditarDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarCostoManualDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarCostoProductoDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarPrecioVentaDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarReglaGananciaDTO;
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

    @PatchMapping("/{productoId}/precio-venta")
    public ResponseEntity<ProductoAdminObtenerDTO> actualizarPrecioVenta(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId,
            @Valid @RequestBody ActualizarPrecioVentaDTO dto) {

        return ResponseEntity.ok(
                productoServicio.actualizarPrecioVenta(usuarioId, productoId, dto)
        );
    }

    @PatchMapping("/{productoId}/costo-manual")
    public ResponseEntity<ProductoAdminObtenerDTO> actualizarCostoManual(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId,
            @Valid @RequestBody ActualizarCostoManualDTO dto) {

        return ResponseEntity.ok(
                productoServicio.actualizarCostoManual(usuarioId, productoId, dto)
        );
    }

    @PatchMapping("/{productoId}/costo")
    public ResponseEntity<ProductoAdminObtenerDTO> actualizarCosto(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId,
            @Valid @RequestBody ActualizarCostoProductoDTO dto) {

        return ResponseEntity.ok(
                productoServicio.actualizarCosto(usuarioId, productoId, dto)
        );
    }

    @PatchMapping("/{productoId}/regla-ganancia")
    public ResponseEntity<ProductoAdminObtenerDTO> actualizarReglaGanancia(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId,
            @Valid @RequestBody ActualizarReglaGananciaDTO dto) {

        return ResponseEntity.ok(
                productoServicio.actualizarReglaGanancia(usuarioId, productoId, dto)
        );
    }

    @DeleteMapping("/{productoId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long productoId) {

        productoServicio.eliminar(usuarioId, productoId);

        return ResponseEntity.noContent().build();
    }
}
