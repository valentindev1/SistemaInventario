package com.vhela.inventario.repositorio.producto.detalles;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.detalles.Color;


import com.vhela.inventario.modelo.producto.detalles.Color;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ColorRepositorio extends JpaRepository<Color, Long> {

    // Validar si ya existe un color con ese nombre dentro de una empresa
    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);

    // Buscar color por nombre y empresa
    Optional<Color> findByNombreAndEmpresaId(String nombre, Long empresaId);

    // Listar colores de una empresa
    List<Color> findByEmpresaId(Long empresaId);
}
