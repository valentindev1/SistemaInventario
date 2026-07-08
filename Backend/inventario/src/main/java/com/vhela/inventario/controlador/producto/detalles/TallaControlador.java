package com.vhela.inventario.controlador.producto.detalles;

import com.vhela.inventario.dto.producto.detalles.talla.TallaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.talla.TallaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.talla.TallaObtenerDTO;
import com.vhela.inventario.servicio.producto.detalles.talla.TallaServicio;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tallas")
@RequiredArgsConstructor
public class TallaControlador {

    private final TallaServicio tallaServicio;

    // ✅ CREAR TALLA
    @PostMapping
    public ResponseEntity<TallaObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody TallaCrearDTO dto) {

        TallaObtenerDTO response = tallaServicio.crear(usuarioId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ✅ LISTAR TALLAS SEGÚN ROL
    @GetMapping
    public ResponseEntity<List<TallaObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        List<TallaObtenerDTO> response = tallaServicio.listar(usuarioId);

        return ResponseEntity.ok(response);
    }

    // ✅ LISTAR TALLAS POR EMPRESA
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<TallaObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        List<TallaObtenerDTO> response = tallaServicio.listarPorEmpresa(usuarioId, empresaId);

        return ResponseEntity.ok(response);
    }

    // ✅ OBTENER TALLA POR ID
    @GetMapping("/{tallaId}")
    public ResponseEntity<TallaObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long tallaId) {

        TallaObtenerDTO response = tallaServicio.obtenerPorId(usuarioId, tallaId);

        return ResponseEntity.ok(response);
    }

    // ✅ EDITAR TALLA
    @PutMapping("/{tallaId}")
    public ResponseEntity<TallaObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long tallaId,
            @Valid @RequestBody TallaEditarDTO dto) {

        TallaObtenerDTO response = tallaServicio.editar(usuarioId, tallaId, dto);

        return ResponseEntity.ok(response);
    }

    // ✅ ELIMINAR TALLA
    @DeleteMapping("/{tallaId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long tallaId) {

        tallaServicio.eliminar(usuarioId, tallaId);

        return ResponseEntity.noContent().build();
    }
}
