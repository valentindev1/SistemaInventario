package com.vhela.inventario.repositorio;

import java.util.Optional;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.empresa.Empresa;


public interface EmpresaRepositorio extends JpaRepository<Empresa, Long>{

    
    Optional<Empresa> findByNit(String nit);


    Optional<Empresa> findByNombre(String nombre);


    boolean existsByNit(Long nit);


    void deleteByNit(String nit);
}
