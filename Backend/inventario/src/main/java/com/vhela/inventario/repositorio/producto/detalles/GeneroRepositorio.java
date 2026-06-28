package com.vhela.inventario.repositorio.producto.detalles;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.detalles.Genero;

public interface GeneroRepositorio extends JpaRepository<Genero, Long> {

    Optional<Genero> findByNombre(String nombre);
}
