package com.vhela.inventario.controlador;


import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioObtenerDTO;
import com.vhela.inventario.servicio.usuario.UsuarioServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioControlador {

    private final UsuarioServicio usuarioServicio;

    // ✅ CREAR
    @PostMapping
    public ResponseEntity<UsuarioObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody UsuarioCrearDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioServicio.crear(usuarioId, dto));
    }

    // ✅ LISTAR GENERAL (según rol)
    @GetMapping
    public ResponseEntity<List<UsuarioObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                usuarioServicio.listar(usuarioId)
        );
    }

    // ✅ OBTENER POR ID
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long id) {

        return ResponseEntity.ok(
                usuarioServicio.obtenerPorId(usuarioId, id)
        );
    }

    // ✅ EDITAR
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long id,
            @Valid @RequestBody UsuarioEditarDTO dto) {

        return ResponseEntity.ok(
                usuarioServicio.editar(usuarioId, id, dto)
        );
    }

    // ✅ ELIMINAR
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long id) {

        usuarioServicio.eliminar(usuarioId, id);
        return ResponseEntity.noContent().build();
    }

    // ✅ LISTAR USUARIOS DE LA EMPRESA
    @GetMapping("/empresa")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                usuarioServicio.listarPorEmpresa(usuarioId)
        );
    }

    // ✅ LISTAR USUARIOS DE UNA SUCURSAL
    @GetMapping("/sucursal/{sucursalId}")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {

        return ResponseEntity.ok(
                usuarioServicio.listarPorSucursal(usuarioId, sucursalId)
        );
    }

    // ✅ LISTAR TODOS (CONTROLADO POR ROL)
    @GetMapping("/todos")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarTodos(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                usuarioServicio.listarTodos(usuarioId)
        );
    }
}
