package com.vhela.inventario.repositorio.producto.detalles;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.detalles.Color;

public interface ColorRepositorio extends JpaRepository<Color, Long> {

    Optional<Color> findByNombre(String nombre);
}
