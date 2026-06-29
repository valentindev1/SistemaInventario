package com.vhela.inventario.servicio.sucursal;

import com.vhela.inventario.dto.sucursal.SucursalCrearDTO;
import com.vhela.inventario.dto.sucursal.SucursalEditarDTO;
import com.vhela.inventario.dto.sucursal.SucursalObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SucursalServicioImpl implements SucursalServicio {

    private final SucursalRepositorio sucursalRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;



    // CREAR
    @Override
    public SucursalObtenerDTO crear(Long usuarioId, SucursalCrearDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede crear sucursales");
        }

        Empresa empresa;

        if (usuario.getRol() == RolEnum.ADMIN) {
            // usar empresa del ADMIN (no del DTO)
            empresa = usuario.getEmpresa();
        } else {
            // SUPER_ADMIN puede usar el nit
            empresa = empresaRepositorio.findByNit(dto.getEmpresaNit())
                    .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        }

        if (sucursalRepositorio.existsByNombreAndEmpresaId(
                dto.getNombre(), empresa.getId())) {

            throw new RuntimeException("Ya existe una sucursal con ese nombre en la empresa");
        }

        Sucursal sucursal = new Sucursal();
        sucursal.setNombre(dto.getNombre());
        sucursal.setCiudad(dto.getCiudad());
        sucursal.setDireccion(dto.getDireccion());
        sucursal.setTelefono(dto.getTelefono());
        sucursal.setEmpresa(empresa);

        return mapToDTO(sucursalRepositorio.save(sucursal));
    }



    // LISTAR
    @Override
    public List<SucursalObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return sucursalRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            return sucursalRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            return List.of(mapToDTO(usuario.getSucursal()));
        }

        throw new RuntimeException("No tiene permisos");
    }

    // ✅ OBTENER POR ID
    @Override
    public SucursalObtenerDTO obtenerPorId(Long usuarioId, Long id) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Sucursal sucursal = sucursalRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return mapToDTO(sucursal);
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (!sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
                throw new RuntimeException("No puede ver esta sucursal");
            }

            return mapToDTO(sucursal);
        }

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            if (!usuario.getSucursal().getId().equals(id)) {
                throw new RuntimeException("Solo puede ver su propia sucursal");
            }

            return mapToDTO(sucursal);
        }

        throw new RuntimeException("No tiene permisos");
    }

    // ✅ LISTAR POR EMPRESA
    @Override
    public List<SucursalObtenerDTO> listarPorEmpresa(Long usuarioId, String empresaNit) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Empresa empresa = empresaRepositorio.findByNit(empresaNit)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return sucursalRepositorio.findByEmpresaId(empresa.getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (!usuario.getEmpresa().getId().equals(empresa.getId())) {
                throw new RuntimeException("No puede ver sucursales de otra empresa");
            }

            return sucursalRepositorio.findByEmpresaId(empresa.getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        throw new RuntimeException("No tiene permisos");
    }

    // ✅ EDITAR
    @Override
    public SucursalObtenerDTO editar(Long usuarioId, Long id, SucursalEditarDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede editar sucursales");
        }

        Sucursal sucursal = sucursalRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        if (usuario.getRol() == RolEnum.ADMIN &&
                !sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {

            throw new RuntimeException("No puede editar sucursales de otra empresa");
        }

        sucursal.setNombre(dto.getNombre());
        sucursal.setCiudad(dto.getCiudad());
        sucursal.setDireccion(dto.getDireccion());
        sucursal.setTelefono(dto.getTelefono());

        return mapToDTO(sucursalRepositorio.save(sucursal));
    }

    // ✅ ELIMINAR
    @Override
    public void eliminar(Long usuarioId, Long id) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede eliminar sucursales");
        }

        Sucursal sucursal = sucursalRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        if (usuario.getRol() == RolEnum.ADMIN &&
                !sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {

            throw new RuntimeException("No puede eliminar sucursales de otra empresa");
        }

        sucursalRepositorio.delete(sucursal);
    }

    // ✅ MAPPER
    private SucursalObtenerDTO mapToDTO(Sucursal sucursal) {

        SucursalObtenerDTO dto = new SucursalObtenerDTO();

        dto.setId(sucursal.getId());
        dto.setNombre(sucursal.getNombre());
        dto.setCiudad(sucursal.getCiudad());
        dto.setDireccion(sucursal.getDireccion());
        dto.setTelefono(sucursal.getTelefono());
        dto.setFechaCreacion(sucursal.getFechaCreacion());

        dto.setEmpresaNit(sucursal.getEmpresa().getNit());
        dto.setEmpresaNombre(sucursal.getEmpresa().getNombre());

        return dto;
    }
}