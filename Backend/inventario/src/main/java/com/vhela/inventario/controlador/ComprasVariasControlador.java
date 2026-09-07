package com.vhela.inventario.controlador;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhela.inventario.dto.comprasvarias.CompraVariasCrearDTO;
import com.vhela.inventario.dto.comprasvarias.CompraVariasDTO;
import com.vhela.inventario.servicio.comprasvarias.ComprasVariasServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/compras-varias")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class ComprasVariasControlador {

    private final ComprasVariasServicio servicio;

    @PostMapping("/sucursal/{sucursalId}/registros")
    public ResponseEntity<CompraVariasDTO> registrar(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId,
            @Valid @RequestBody CompraVariasCrearDTO dto) {
        return ResponseEntity.status(201).body(
                servicio.registrar(usuarioId, sucursalId, dto)
        );
    }

    @GetMapping("/sucursal/{sucursalId}/registros")
    public ResponseEntity<List<CompraVariasDTO>> listarPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {
        return ResponseEntity.ok(servicio.listarPorSucursal(usuarioId, sucursalId));
    }

    @DeleteMapping("/sucursal/{sucursalId}/registros/{registroId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId,
            @PathVariable Long registroId) {
        servicio.eliminar(usuarioId, sucursalId, registroId);
        return ResponseEntity.noContent().build();
    }
}
