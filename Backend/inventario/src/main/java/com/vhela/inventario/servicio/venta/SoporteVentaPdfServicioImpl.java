package com.vhela.inventario.servicio.venta;



import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.vhela.inventario.dto.venta.soporte.SoporteVentaDTO;
import com.vhela.inventario.dto.venta.soporte.SoporteVentaItemDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class SoporteVentaPdfServicioImpl implements SoporteVentaPdfServicio {

    @Override
    public byte[] generarPdf(SoporteVentaDTO soporte) {

        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, outputStream);

            document.open();

            Font tituloFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font subtituloFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            Paragraph titulo = new Paragraph("SOPORTE DE VENTA", tituloFont);
            titulo.setAlignment(Element.ALIGN_CENTER);
            document.add(titulo);

            document.add(new Paragraph(" "));

            Paragraph empresa = new Paragraph(soporte.getEmpresaNombre(), subtituloFont);
            empresa.setAlignment(Element.ALIGN_CENTER);
            document.add(empresa);

            Paragraph sucursal = new Paragraph(
                    soporte.getSucursalNombre()
                            + " | "
                            + soporte.getSucursalDireccion()
                            + " | Tel: "
                            + soporte.getSucursalTelefono(),
                    normalFont
            );
            sucursal.setAlignment(Element.ALIGN_CENTER);
            document.add(sucursal);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Venta: " + soporte.getNumeroVenta(), boldFont));

            String fecha = soporte.getFechaVenta() != null
                    ? soporte.getFechaVenta().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : "Sin fecha";

            String hora = soporte.getHoraVenta() != null
                    ? soporte.getHoraVenta().format(DateTimeFormatter.ofPattern("HH:mm"))
                    : "Sin hora";

            document.add(new Paragraph("Fecha: " + fecha + "    Hora: " + hora, normalFont));
            document.add(new Paragraph("Vendedor: " + soporte.getVendedorNombre(), normalFont));
            document.add(new Paragraph("Cliente: " + soporte.getClienteNombre(), normalFont));
            document.add(new Paragraph("Documento: " + soporte.getClienteDocumento(), normalFont));

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Productos vendidos", subtituloFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 4f, 1f, 2f, 2f});

            agregarCeldaHeader(table, "Código", boldFont);
            agregarCeldaHeader(table, "Producto", boldFont);
            agregarCeldaHeader(table, "Cant.", boldFont);
            agregarCeldaHeader(table, "Precio", boldFont);
            agregarCeldaHeader(table, "Subtotal", boldFont);

            for (SoporteVentaItemDTO item : soporte.getItems()) {
                agregarCelda(table, item.getCodigoProducto(), normalFont);
                agregarCelda(table, item.getNombreProducto(), normalFont);
                agregarCeldaCentro(table, String.valueOf(item.getCantidad()), normalFont);
                agregarCeldaDerecha(table, formatoMoneda(item.getPrecioUnitario()), normalFont);
                agregarCeldaDerecha(table, formatoMoneda(item.getSubtotal()), normalFont);
            }

            document.add(table);

            document.add(new Paragraph(" "));

            PdfPTable resumen = new PdfPTable(2);
            resumen.setWidthPercentage(45);
            resumen.setHorizontalAlignment(Element.ALIGN_RIGHT);

            agregarCelda(resumen, "Subtotal", boldFont);
            agregarCeldaDerecha(resumen, formatoMoneda(soporte.getSubtotal()), normalFont);

            agregarCelda(resumen, "Descuento", boldFont);
            agregarCeldaDerecha(resumen, formatoMoneda(soporte.getDescuento()), normalFont);

            agregarCelda(resumen, "Total pagado", boldFont);
            agregarCeldaDerecha(resumen, formatoMoneda(soporte.getTotal()), boldFont);

            document.add(resumen);

            document.add(new Paragraph(" "));
            Paragraph gracias = new Paragraph("Gracias por su compra", normalFont);
            gracias.setAlignment(Element.ALIGN_CENTER);
            document.add(gracias);

            document.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generando soporte de venta en PDF", e);
        }
    }

    private void agregarCeldaHeader(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void agregarCelda(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void agregarCeldaCentro(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void agregarCeldaDerecha(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private String formatoMoneda(BigDecimal valor) {
        BigDecimal valorSeguro = valor == null ? BigDecimal.ZERO : valor;

        NumberFormat formato = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));
        formato.setMaximumFractionDigits(0);

        return formato.format(valorSeguro);
    }
}