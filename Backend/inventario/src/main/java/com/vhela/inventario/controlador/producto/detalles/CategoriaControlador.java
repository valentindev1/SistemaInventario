package com.vhela.inventario.controlador.producto.detalles;

import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaObtenerDTO;
import com.vhela.inventario.servicio.producto.detalles.categoria.CategoriaServicio;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaControlador {

    private final CategoriaServicio categoriaServicio;

    // ✅ CREAR CATEGORÍA
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<CategoriaObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody CategoriaCrearDTO dto) {

        CategoriaObtenerDTO response = categoriaServicio.crear(usuarioId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ✅ LISTAR CATEGORÍAS SEGÚN ROL
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping
    public ResponseEntity<List<CategoriaObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        List<CategoriaObtenerDTO> response = categoriaServicio.listar(usuarioId);

        return ResponseEntity.ok(response);
    }

    // ✅ LISTAR CATEGORÍAS POR EMPRESA
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<CategoriaObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        List<CategoriaObtenerDTO> response = categoriaServicio.listarPorEmpresa(usuarioId, empresaId);

        return ResponseEntity.ok(response);
    }

    // ✅ OBTENER CATEGORÍA POR ID
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/{categoriaId}")
    public ResponseEntity<CategoriaObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long categoriaId) {

        CategoriaObtenerDTO response = categoriaServicio.obtenerPorId(usuarioId, categoriaId);

        return ResponseEntity.ok(response);
    }

    // ✅ EDITAR CATEGORÍA
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @PutMapping("/{categoriaId}")
    public ResponseEntity<CategoriaObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long categoriaId,
            @Valid @RequestBody CategoriaEditarDTO dto) {

        CategoriaObtenerDTO response = categoriaServicio.editar(usuarioId, categoriaId, dto);

        return ResponseEntity.ok(response);
    }

    // ✅ ELIMINAR CATEGORÍA
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @DeleteMapping("/{categoriaId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long categoriaId) {

        categoriaServicio.eliminar(usuarioId, categoriaId);

        return ResponseEntity.noContent().build();
    }
}