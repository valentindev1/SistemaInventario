package com.vhela.inventario.controlador;

import java.time.LocalDate;
import java.util.List;

import com.vhela.inventario.dto.empresa.DashboardEmpresaDTO;
import com.vhela.inventario.dto.empresa.EmpresaCrearDTO;
import com.vhela.inventario.dto.empresa.EmpresaEditarDTO;
import com.vhela.inventario.dto.empresa.EmpresaObtenerDTO;
import com.vhela.inventario.servicio.empresa.EmpresaServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/empresas")
@RequiredArgsConstructor
public class EmpresaControlador {

    private final EmpresaServicio empresaServicio;

    // ======================================================
    // CREAR EMPRESA
    // Solo SUPER_ADMIN
    // ======================================================
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<EmpresaObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody EmpresaCrearDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(empresaServicio.crear(usuarioId, dto));
    }

    // ======================================================
    // LISTAR TODAS LAS EMPRESAS
    // Solo SUPER_ADMIN
    // ======================================================
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping
    public ResponseEntity<List<EmpresaObtenerDTO>> listar(
            @RequestParam Long usuarioId
    ) {
        return ResponseEntity.ok(
                empresaServicio.listar(usuarioId)
        );
    }

    // ======================================================
    // OBTENER EMPRESA POR ID
    // SUPER_ADMIN: puede consultar cualquier empresa
    // ADMIN: solo puede consultar su empresa asignada
    // La validación fuerte está en EmpresaServicioImpl
    // ======================================================
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<EmpresaObtenerDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                empresaServicio.obtenerPorId(usuarioId, id)
        );
    }

    // ======================================================
    // OBTENER EMPRESA POR NIT
    // SUPER_ADMIN: puede consultar cualquier empresa
    // ADMIN: solo puede consultar su empresa asignada
    // ======================================================
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/nit/{nit}")
    public ResponseEntity<EmpresaObtenerDTO> obtenerPorNit(
            @RequestParam Long usuarioId,
            @PathVariable String nit
    ) {
        return ResponseEntity.ok(
                empresaServicio.obtenerPorNit(usuarioId, nit)
        );
    }

    // ======================================================
    // EDITAR EMPRESA
    // Solo SUPER_ADMIN
    // Tu servicio actualmente bloquea ADMIN aquí
    // ======================================================
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<EmpresaObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long id,
            @Valid @RequestBody EmpresaEditarDTO dto
    ) {
        return ResponseEntity.ok(
                empresaServicio.editar(usuarioId, id, dto)
        );
    }

    // ======================================================
    // ELIMINAR EMPRESA
    // Solo SUPER_ADMIN
    // Tu servicio actualmente bloquea ADMIN aquí
    // ======================================================
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long id
    ) {
        empresaServicio.eliminarPorId(usuarioId, id);

        return ResponseEntity.noContent().build();
    }

    // ======================================================
    // DASHBOARD EMPRESA
    // SUPER_ADMIN: cualquier empresa
    // ADMIN: solo su empresa asignada
    // ======================================================
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/{empresaId}/dashboard")
    public ResponseEntity<DashboardEmpresaDTO> obtenerDashboardEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaInicio,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaFin
    ) {
        return ResponseEntity.ok(
                empresaServicio.obtenerDashboardEmpresa(
                        usuarioId,
                        empresaId,
                        fechaInicio,
                        fechaFin
                )
        );
    }
}