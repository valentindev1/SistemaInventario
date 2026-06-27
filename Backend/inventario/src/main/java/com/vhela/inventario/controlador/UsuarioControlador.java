package com.vhela.inventario.controlador;

import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioResponseDTO;
import com.vhela.inventario.servicio.usuario.UsuarioServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioControlador {

    private final UsuarioServicio usuarioServicio;

    @PostMapping("/crear")
    public ResponseEntity<UsuarioResponseDTO> crear(@RequestBody UsuarioCrearDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usuarioServicio.crear(dto));
    }

    @GetMapping("/listar")
    public ResponseEntity<List<UsuarioResponseDTO>> listar() {
        return ResponseEntity.ok(usuarioServicio.listar());
    }

    @GetMapping("/listar/{usuarioId}")
    public ResponseEntity<UsuarioResponseDTO> obtenerPorId(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(usuarioServicio.obtenerPorId(usuarioId));
    }

    @PutMapping("/editar/{usuarioId}")
    public ResponseEntity<UsuarioResponseDTO> editar(
            @PathVariable Long usuarioId,
            @RequestBody UsuarioEditarDTO dto) {

        return ResponseEntity.ok(usuarioServicio.editar(usuarioId, dto));
    }

    @DeleteMapping("/eliminar/{usuarioId}")
    public ResponseEntity<Void> eliminar(@PathVariable Long usuarioId) {
        usuarioServicio.eliminar(usuarioId);
        return ResponseEntity.noContent().build();
    }
}
