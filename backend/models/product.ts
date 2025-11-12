export interface ProductModel {
  id?: string;
  name: string;
  tipo: string;           //refrescos, aguas, energeticas, etc...
  presentacion: string;   // lata, botella, vidrio, etc...
  precio: number;
  stock: number;
}