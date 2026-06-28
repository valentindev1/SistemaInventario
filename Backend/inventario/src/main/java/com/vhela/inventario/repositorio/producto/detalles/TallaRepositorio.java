package com.vhela.inventario.repositorio.producto.detalles;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.detalles.Talla;

public interface TallaRepositorio extends JpaRepository<Talla, Long> {

    Optional<Talla> findByNombre(String nombre);
}
