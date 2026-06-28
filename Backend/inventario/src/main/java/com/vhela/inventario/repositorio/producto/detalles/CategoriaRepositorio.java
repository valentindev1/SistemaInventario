package com.vhela.inventario.repositorio.producto.detalles;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.detalles.Categoria;

public interface CategoriaRepositorio extends JpaRepository<Categoria, Long> {

    Optional<Categoria> findByNombre(String nombre);
}
