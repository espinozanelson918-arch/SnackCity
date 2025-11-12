export interface ReporteModel {
  id?: string;
  fechaInicio: string;        // Rango de fecha inicial (YYYY-MM-DD)
  fechaFin: string;           // Rango de fecha final (YYYY-MM-DD)
  totalVentas: number;        // Suma de todas las ventas en el rango
  totalCompras: number;       // Suma de todas las compras en el rango
  gananciaNeta: number;       // totalVentas - totalCompras
  productoMasVendido?: {
    productoId: string;
    nombre: string;
    cantidadVendida: number;
  };
  fechaGeneracion: string;    // Fecha en la que se generó el reporte
}