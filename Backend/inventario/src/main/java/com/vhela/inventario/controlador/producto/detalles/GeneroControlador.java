package com.vhela.inventario.controlador.producto.detalles;

import com.vhela.inventario.dto.producto.detalles.genero.GeneroCrearDTO;
import com.vhela.inventario.dto.producto.detalles.genero.GeneroEditarDTO;
import com.vhela.inventario.dto.producto.detalles.genero.GeneroObtenerDTO;
import com.vhela.inventario.servicio.producto.detalles.genero.GeneroServicio;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/generos")
@RequiredArgsConstructor
public class GeneroControlador {

    private final GeneroServicio generoServicio;

    // ✅ CREAR GÉNERO
    @PostMapping
    public ResponseEntity<GeneroObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody GeneroCrearDTO dto) {

        GeneroObtenerDTO response = generoServicio.crear(usuarioId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ✅ LISTAR GÉNEROS SEGÚN ROL
    @GetMapping
    public ResponseEntity<List<GeneroObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        List<GeneroObtenerDTO> response = generoServicio.listar(usuarioId);

        return ResponseEntity.ok(response);
    }

    // ✅ LISTAR GÉNEROS POR EMPRESA
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<GeneroObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        List<GeneroObtenerDTO> response = generoServicio.listarPorEmpresa(usuarioId, empresaId);

        return ResponseEntity.ok(response);
    }

    // ✅ OBTENER GÉNERO POR ID
    @GetMapping("/{generoId}")
    public ResponseEntity<GeneroObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long generoId) {

        GeneroObtenerDTO response = generoServicio.obtenerPorId(usuarioId, generoId);

        return ResponseEntity.ok(response);
    }

    // ✅ EDITAR GÉNERO
    @PutMapping("/{generoId}")
    public ResponseEntity<GeneroObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long generoId,
            @Valid @RequestBody GeneroEditarDTO dto) {

        GeneroObtenerDTO response = generoServicio.editar(usuarioId, generoId, dto);

        return ResponseEntity.ok(response);
    }

    // ✅ ELIMINAR GÉNERO
    @DeleteMapping("/{generoId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long generoId) {

        generoServicio.eliminar(usuarioId, generoId);

        return ResponseEntity.noContent().build();
    }
}