package com.vhela.inventario.servicio.usuario;

import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioResponseDTO;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioServicioImpl implements UsuarioServicio {


    private final UsuarioRepositorio usuarioRepositorio;


    @Override
    public UsuarioResponseDTO crear(UsuarioCrearDTO dto) {
        if (usuarioRepositorio.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Ya existe un usuario con ese username");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(dto.getPassword());
        usuario.setRol(convertirRol(dto.getRol()));


        return mapToResponse(usuarioRepositorio.save(usuario));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listar() {
        return usuarioRepositorio.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerPorId(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("No existe el usuario"));
    }

    @Override
    public UsuarioResponseDTO editar(Long usuarioId, UsuarioEditarDTO dto) {
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("No existe el usuario"));

        usuario.setNombre(dto.getNombre());
        usuario.setPassword(dto.getPassword());
        usuario.setRol(convertirRol(dto.getRol()));

        return mapToResponse(usuario);
    }

    @Override
    public void eliminar(Long usuarioId) {
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("No existe el usuario"));

        usuarioRepositorio.delete(usuario);
    }


    private RolEnum convertirRol(String rol) {
        try {
            return RolEnum.valueOf(rol);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RuntimeException("Rol invalido");
        }
    }


    private UsuarioResponseDTO mapToResponse(Usuario usuario) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();

        dto.setId(usuario.getId());
        dto.setNombre(usuario.getNombre());
        dto.setUsername(usuario.getUsername());
        dto.setRol(usuario.getRol().name());

        return dto;
    }
}
