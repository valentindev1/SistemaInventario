package com.vhela.inventario.controlador;

import java.util.List;

import com.vhela.inventario.dto.cliente.ClienteCrearDTO;
import com.vhela.inventario.dto.cliente.ClienteEditarDTO;
import com.vhela.inventario.dto.cliente.ClienteObtenerDTO;
import com.vhela.inventario.servicio.cliente.ClienteServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.vhela.inventario.servicio.venta.UsuarioAutenticadoServicio;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'EMPLEADO')")
public class ClienteControlador {

    private final ClienteServicio clienteServicio;
    private final UsuarioAutenticadoServicio usuarioAutenticadoServicio;

    // ======================================================
    // CREAR CLIENTE
    // ======================================================
    @PostMapping
    public ResponseEntity<ClienteObtenerDTO> crear(
            Authentication authentication,
            @Valid @RequestBody ClienteCrearDTO dto) {

        ClienteObtenerDTO response = clienteServicio.crear(usuarioId(authentication), dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ======================================================
    // LISTAR CLIENTES SEGÚN ROL DEL USUARIO
    // ======================================================
    @GetMapping
    public ResponseEntity<List<ClienteObtenerDTO>> listar(
            Authentication authentication) {

        return ResponseEntity.ok(
                clienteServicio.listar(usuarioId(authentication))
        );
    }

    // ======================================================
    // OBTENER CLIENTE POR ID
    // ======================================================
    @GetMapping("/{clienteId}")
    public ResponseEntity<ClienteObtenerDTO> obtenerPorId(
            Authentication authentication,
            @PathVariable Long clienteId) {

        return ResponseEntity.ok(
                clienteServicio.obtenerPorId(usuarioId(authentication), clienteId)
        );
    }

    // ======================================================
    // BUSCAR CLIENTE POR NÚMERO DE DOCUMENTO / CÉDULA
    // ======================================================
    @GetMapping("/documento/{numeroDocumento}")
    public ResponseEntity<ClienteObtenerDTO> obtenerPorDocumento(
            Authentication authentication,
            @PathVariable String numeroDocumento) {

        return ResponseEntity.ok(
                clienteServicio.obtenerPorDocumento(usuarioId(authentication), numeroDocumento)
        );
    }

    // ======================================================
    // EDITAR CLIENTE
    // La cédula NO se edita.
    // Solo se actualizan datos como nombre, correo, teléfono, dirección.
    // ======================================================
    @PutMapping("/{clienteId}")
    public ResponseEntity<ClienteObtenerDTO> editar(
            Authentication authentication,
            @PathVariable Long clienteId,
            @Valid @RequestBody ClienteEditarDTO dto) {

        return ResponseEntity.ok(
                clienteServicio.editar(usuarioId(authentication), clienteId, dto)
        );
    }

    // ======================================================
    // ELIMINAR CLIENTE
    // ======================================================
    @DeleteMapping("/{clienteId}")
    public ResponseEntity<Void> eliminar(
            Authentication authentication,
            @PathVariable Long clienteId) {

        clienteServicio.eliminar(usuarioId(authentication), clienteId);

        return ResponseEntity.noContent().build();
    }

    private Long usuarioId(Authentication authentication) {
        return usuarioAutenticadoServicio.obtenerUsuarioId(authentication);
    }
}
