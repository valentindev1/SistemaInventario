package com.vhela.inventario.controlador.producto.detalles;


import com.vhela.inventario.dto.producto.detalles.color.ColorCrearDTO;
import com.vhela.inventario.dto.producto.detalles.color.ColorEditarDTO;
import com.vhela.inventario.dto.producto.detalles.color.ColorObtenerDTO;
import com.vhela.inventario.servicio.producto.detalles.color.ColorServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/colores")
@RequiredArgsConstructor
public class ColorControlador {

    private final ColorServicio colorServicio;

    // ✅ CREAR COLOR
    @PostMapping
    public ResponseEntity<ColorObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody ColorCrearDTO dto) {

        ColorObtenerDTO response = colorServicio.crear(usuarioId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ✅ LISTAR COLORES SEGÚN ROL
    @GetMapping
    public ResponseEntity<List<ColorObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        List<ColorObtenerDTO> response = colorServicio.listar(usuarioId);

        return ResponseEntity.ok(response);
    }

    // ✅ LISTAR COLORES POR EMPRESA
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<ColorObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        List<ColorObtenerDTO> response = colorServicio.listarPorEmpresa(usuarioId, empresaId);

        return ResponseEntity.ok(response);
    }

    // ✅ OBTENER COLOR POR ID
    @GetMapping("/{colorId}")
    public ResponseEntity<ColorObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long colorId) {

        ColorObtenerDTO response = colorServicio.obtenerPorId(usuarioId, colorId);

        return ResponseEntity.ok(response);
    }

    // ✅ EDITAR COLOR
    @PutMapping("/{colorId}")
    public ResponseEntity<ColorObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long colorId,
            @Valid @RequestBody ColorEditarDTO dto) {

        ColorObtenerDTO response = colorServicio.editar(usuarioId, colorId, dto);

        return ResponseEntity.ok(response);
    }

    // ✅ ELIMINAR COLOR
    @DeleteMapping("/{colorId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long colorId) {

        colorServicio.eliminar(usuarioId, colorId);

        return ResponseEntity.noContent().build();
    }
}
