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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'EMPLEADO')")
public class ClienteControlador {

    private final ClienteServicio clienteServicio;

    // ======================================================
    // CREAR CLIENTE
    // ======================================================
    @PostMapping
    public ResponseEntity<ClienteObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody ClienteCrearDTO dto) {

        ClienteObtenerDTO response = clienteServicio.crear(usuarioId, dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ======================================================
    // LISTAR CLIENTES SEGÚN ROL DEL USUARIO
    // ======================================================
    @GetMapping
    public ResponseEntity<List<ClienteObtenerDTO>> listar(
            @RequestParam Long usuarioId) {

        return ResponseEntity.ok(
                clienteServicio.listar(usuarioId)
        );
    }

    // ======================================================
    // OBTENER CLIENTE POR ID
    // ======================================================
    @GetMapping("/{clienteId}")
    public ResponseEntity<ClienteObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long clienteId) {

        return ResponseEntity.ok(
                clienteServicio.obtenerPorId(usuarioId, clienteId)
        );
    }

    // ======================================================
    // BUSCAR CLIENTE POR NÚMERO DE DOCUMENTO / CÉDULA
    // ======================================================
    @GetMapping("/documento/{numeroDocumento}")
    public ResponseEntity<ClienteObtenerDTO> obtenerPorDocumento(
            @RequestParam Long usuarioId,
            @PathVariable String numeroDocumento) {

        return ResponseEntity.ok(
                clienteServicio.obtenerPorDocumento(usuarioId, numeroDocumento)
        );
    }

    // ======================================================
    // EDITAR CLIENTE
    // La cédula NO se edita.
    // Solo se actualizan datos como nombre, correo, teléfono, dirección.
    // ======================================================
    @PutMapping("/{clienteId}")
    public ResponseEntity<ClienteObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long clienteId,
            @Valid @RequestBody ClienteEditarDTO dto) {

        return ResponseEntity.ok(
                clienteServicio.editar(usuarioId, clienteId, dto)
        );
    }

    // ======================================================
    // ELIMINAR CLIENTE
    // ======================================================
    @DeleteMapping("/{clienteId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long clienteId) {

        clienteServicio.eliminar(usuarioId, clienteId);

        return ResponseEntity.noContent().build();
    }
}