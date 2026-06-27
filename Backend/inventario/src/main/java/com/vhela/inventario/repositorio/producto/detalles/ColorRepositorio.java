package com.vhela.inventario.repositorio.producto.detalles;

import com.vhela.inventario.modelo.producto.detalles.Color;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface ColorRepositorio extends JpaRepository<Color, Integer> {

    Optional<Color> findByColor(String color);

}
