package com.vhela.inventario.controlador.producto;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoCrearDTO;
import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoEditarDTO;
import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoObtenerDTO;
import com.vhela.inventario.servicio.producto.atributocosto.AtributoCostoServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/atributos-costo")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class AtributoCostoControlador {

    private final AtributoCostoServicio atributoCostoServicio;

    @PostMapping
    public ResponseEntity<AtributoCostoObtenerDTO> crear(
            @RequestParam Long usuarioId,
            @Valid @RequestBody AtributoCostoCrearDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atributoCostoServicio.crear(usuarioId, dto));
    }

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<AtributoCostoObtenerDTO>> listarPorEmpresa(
            @RequestParam Long usuarioId,
            @PathVariable Long empresaId
    ) {
        return ResponseEntity.ok(atributoCostoServicio.listarPorEmpresa(usuarioId, empresaId));
    }

    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<List<AtributoCostoObtenerDTO>> listarActivosPorCategoria(
            @RequestParam Long usuarioId,
            @PathVariable Long categoriaId
    ) {
        return ResponseEntity.ok(
                atributoCostoServicio.listarActivosPorCategoria(usuarioId, categoriaId)
        );
    }

    @PutMapping("/{atributoId}")
    public ResponseEntity<AtributoCostoObtenerDTO> editar(
            @RequestParam Long usuarioId,
            @PathVariable Long atributoId,
            @Valid @RequestBody AtributoCostoEditarDTO dto
    ) {
        return ResponseEntity.ok(atributoCostoServicio.editar(usuarioId, atributoId, dto));
    }

    @DeleteMapping("/{atributoId}")
    public ResponseEntity<Void> eliminar(
            @RequestParam Long usuarioId,
            @PathVariable Long atributoId
    ) {
        atributoCostoServicio.eliminar(usuarioId, atributoId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{atributoId}/activar")
    public ResponseEntity<AtributoCostoObtenerDTO> activar(
            @RequestParam Long usuarioId,
            @PathVariable Long atributoId
    ) {
        return ResponseEntity.ok(atributoCostoServicio.activar(usuarioId, atributoId));
    }
}
