package com.vhela.inventario.repositorio;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.empresa.Empresa;


public interface EmpresaRepositorio extends JpaRepository<Empresa, Long>{

    
    Optional<Empresa> findByNit(String nit);

    boolean existsByNit(String nit);


}
