package com.vhela.inventario.config;

import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepositorio usuarioRepositorio;

    @Override
    public void run(String... args) {


        // SOLO si NO hay usuarios en la base de datos
        if (usuarioRepositorio.count() == 0) {

            Usuario root = new Usuario();
            root.setNombre("Super Admin");
            root.setUsername("root");
            root.setPassword("123456"); // luego lo encriptamos
            root.setRol(RolEnum.SUPER_ADMIN);

            root.setEmpresa(null);
            root.setSucursal(null);

            usuarioRepositorio.save(root);

            System.out.println("Usuario ROOT creado automáticamente");
        }

    }
}
