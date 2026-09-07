package com.vhela.inventario.controlador;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhela.inventario.dto.contabilidad.RegistroContableCrearDTO;
import com.vhela.inventario.dto.contabilidad.RegistroContableDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableCrearDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableEditarDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoCrearDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoEditarDTO;
import com.vhela.inventario.servicio.contabilidad.ContabilidadServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contabilidad")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class ContabilidadControlador {

    private final ContabilidadServicio contabilidadServicio;

    @PostMapping("/conceptos")
    public ResponseEntity<ConceptoGastoDTO> crearConcepto(
            @RequestParam Long usuarioId,
            @Valid @RequestBody ConceptoGastoCrearDTO dto) {
        return ResponseEntity.status(201).body(
                contabilidadServicio.crearConcepto(usuarioId, dto)
        );
    }

    @GetMapping("/conceptos/empresa/{empresaId}")
    public ResponseEntity<List<ConceptoGastoDTO>> listarConceptos(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {
        return ResponseEntity.ok(
                contabilidadServicio.listarConceptosPorEmpresa(usuarioId, empresaId)
        );
    }

    @GetMapping("/conceptos/empresa/{empresaId}/activos")
    public ResponseEntity<List<ConceptoGastoDTO>> listarConceptosActivos(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {
        return ResponseEntity.ok(
                contabilidadServicio.listarConceptosActivosPorEmpresa(usuarioId, empresaId)
        );
    }

    @PutMapping("/conceptos/{conceptoId}")
    public ResponseEntity<ConceptoGastoDTO> editarConcepto(
            @RequestParam Long usuarioId,
            @PathVariable Long conceptoId,
            @Valid @RequestBody ConceptoGastoEditarDTO dto) {
        return ResponseEntity.ok(
                contabilidadServicio.editarConcepto(usuarioId, conceptoId, dto)
        );
    }

    @DeleteMapping("/conceptos/{conceptoId}")
    public ResponseEntity<Void> eliminarConcepto(
            @RequestParam Long usuarioId,
            @PathVariable Long conceptoId) {
        contabilidadServicio.eliminarConcepto(usuarioId, conceptoId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clasificaciones")
    public ResponseEntity<ClasificacionContableDTO> crearClasificacion(
            @RequestParam Long usuarioId,
            @Valid @RequestBody ClasificacionContableCrearDTO dto) {
        return ResponseEntity.status(201).body(
                contabilidadServicio.crearClasificacion(usuarioId, dto)
        );
    }

    @GetMapping("/clasificaciones/empresa/{empresaId}")
    public ResponseEntity<List<ClasificacionContableDTO>> listarClasificaciones(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId) {
        return ResponseEntity.ok(
                contabilidadServicio.listarClasificacionesPorEmpresa(usuarioId, empresaId)
        );
    }

    @PutMapping("/clasificaciones/{clasificacionId}")
    public ResponseEntity<ClasificacionContableDTO> editarClasificacion(
            @RequestParam Long usuarioId,
            @PathVariable Long clasificacionId,
            @Valid @RequestBody ClasificacionContableEditarDTO dto) {
        return ResponseEntity.ok(
                contabilidadServicio.editarClasificacion(usuarioId, clasificacionId, dto)
        );
    }

    @DeleteMapping("/clasificaciones/{clasificacionId}")
    public ResponseEntity<Void> eliminarClasificacion(
            @RequestParam Long usuarioId,
            @PathVariable Long clasificacionId) {
        contabilidadServicio.eliminarClasificacion(usuarioId, clasificacionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sucursal/{sucursalId}/registros")
    public ResponseEntity<List<RegistroContableDTO>> listarPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId) {

        return ResponseEntity.ok(
                contabilidadServicio.listarPorSucursal(usuarioId, sucursalId)
        );
    }

    @PostMapping("/sucursal/{sucursalId}/registros")
    public ResponseEntity<RegistroContableDTO> registrar(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId,
            @Valid @RequestBody RegistroContableCrearDTO dto) {

        return ResponseEntity.status(201).body(
                contabilidadServicio.registrar(usuarioId, sucursalId, dto)
        );
    }
}
