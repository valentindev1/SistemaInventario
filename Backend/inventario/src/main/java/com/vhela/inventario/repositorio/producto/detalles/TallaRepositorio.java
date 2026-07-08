package com.vhela.inventario.repositorio.producto.detalles;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.detalles.Talla;

import java.util.List;

public interface TallaRepositorio extends JpaRepository<Talla, Long> {

    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);

    Optional<Talla> findByNombreAndEmpresaId(String nombre, Long empresaId);

    List<Talla> findByEmpresaId(Long empresaId);
}