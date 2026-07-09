package com.vhela.inventario.dto.producto.producto;



import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RankingProductosVentasDTO {

    private Long sucursalId;

    private String sucursalNombre;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private List<ProductoRankingVentasDTO> productosMasVendidos;

    private List<ProductoRankingVentasDTO> productosMenosVendidos;
}