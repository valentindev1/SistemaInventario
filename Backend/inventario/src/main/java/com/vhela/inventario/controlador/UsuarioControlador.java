package com.vhela.inventario.controlador;

import com.vhela.inventario.dto.usuario.CambiarPasswordDTO;
import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioObtenerDTO;
import com.vhela.inventario.servicio.usuario.UsuarioServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class UsuarioControlador {

    private final UsuarioServicio usuarioServicio;

    // ======================================================
    // CRUD USUARIOS
    // ======================================================

    // CREAR USUARIO
    @PostMapping

    public ResponseEntity<UsuarioObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody UsuarioCrearDTO dto) {

        UsuarioObtenerDTO response = usuarioServicio.crear(usuarioId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // LISTAR GENERAL SEGÚN ROL
    @GetMapping
    public ResponseEntity<List<UsuarioObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                usuarioServicio.listar(usuarioId)
        );
    }

    // LISTAR TODOS CONTROLADO POR ROL
    @GetMapping("/todos")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarTodos(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                usuarioServicio.listarTodos(usuarioId)
        );
    }

    // OBTENER USUARIO POR ID
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long id) {

        return ResponseEntity.ok(
                usuarioServicio.obtenerPorId(usuarioId, id)
        );
    }

    // EDITAR USUARIO
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long id,
            @Valid @RequestBody UsuarioEditarDTO dto) {

        return ResponseEntity.ok(
                usuarioServicio.editar(usuarioId, id, dto)
        );
    }


    // CAMBIAR CONTRASEÑA DE USUARIO
    @PutMapping("/{id}/cambiar-password")
    public ResponseEntity<Void> cambiarPassword(
            @RequestParam Long usuarioId,
            @PathVariable Long id,
            @Valid @RequestBody CambiarPasswordDTO dto) {

        usuarioServicio.cambiarPassword(
                usuarioId,
                id,
                dto.getNuevaPassword()
        );

        return ResponseEntity.ok().build();
    }







    // ELIMINAR USUARIO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long id) {

        usuarioServicio.eliminar(usuarioId, id);

        return ResponseEntity.noContent().build();
    }

    // ======================================================
    // CONSULTAS POR EMPRESA
    // ======================================================

    // LISTAR USUARIOS DE LA EMPRESA DEL USUARIO SOLICITANTE
    @GetMapping("/empresa")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarPorEmpresaDelSolicitante(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                usuarioServicio.listarPorEmpresa(usuarioId)
        );
    }

    // LISTAR USUARIOS DE UNA EMPRESA ESPECÍFICA
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarPorEmpresaSeleccionada(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                usuarioServicio.listarPorEmpresaSeleccionada(usuarioId, empresaId)
        );
    }

    // VALIDAR SI UNA EMPRESA YA TIENE USUARIOS
    @GetMapping("/empresa/{empresaId}/tiene-usuarios")
    public ResponseEntity<Boolean> empresaTieneUsuarios(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {

        return ResponseEntity.ok(
                usuarioServicio.empresaTieneUsuarios(usuarioId, empresaId)
        );
    }

    // ======================================================
    // CONSULTAS POR SUCURSAL
    // ======================================================

    // LISTAR USUARIOS DE UNA SUCURSAL
    @GetMapping("/sucursal/{sucursalId}")
    public ResponseEntity<List<UsuarioObtenerDTO>> listarPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {

        return ResponseEntity.ok(
                usuarioServicio.listarPorSucursal(usuarioId, sucursalId)
        );
    }
}