// ===================== MOCK DB =====================
jest.mock('../src/config/database.js', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const pool = require('../src/config/database.js');

// ===================== IMPORT CONTROLLER =====================
const {
  getAllVentas,
  getVentabyId,
  postVenta,
  putVenta
} = require('../src/controllers/VentasController');

// ===================== HELPER RESPONSE =====================
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

// ===================== TESTS =====================
describe('Ventas Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================== getAllVentas =====================
  describe('getAllVentas', () => {
    test('Debe agrupar ventas correctamente', async () => {
      const req = {};
      const res = mockResponse();

      pool.query.mockResolvedValue({
        rows: [
          {
            IdVenta: 1,
            NombreUsuario: 'Juan',
            Fecha: '2025-01-01',
            MetodoPago: 'Efectivo',
            Descuento: 0,
            Total: 100,
            Observaciones: '',
            NombreEstado: 'Pagado',
            IdDetalle: 10,
            Producto: 'Pizza',
            Cantidad: 2,
            PrecioUnitario: 20,
            Subtotal: 40
          },
          {
            IdVenta: 1,
            NombreUsuario: 'Juan',
            Fecha: '2025-01-01',
            MetodoPago: 'Efectivo',
            Descuento: 0,
            Total: 100,
            Observaciones: '',
            NombreEstado: 'Pagado',
            IdDetalle: 11,
            Producto: 'Gaseosa',
            Cantidad: 1,
            PrecioUnitario: 10,
            Subtotal: 10
          }
        ]
      });

      await getAllVentas(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const data = res.json.mock.calls[0][0];
      expect(data.length).toBe(1);
      expect(data[0].detalles.length).toBe(2);
    });
  });

  // ===================== getVentabyId =====================
  describe('getVentabyId', () => {

    test('Debe retornar una venta con insumos', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      pool.query.mockResolvedValue({
        rows: [
          {
            IdVenta: 1,
            NombreUsuario: 'Juan',
            MetodoPago: 'Efectivo',
            Descuento: 0,
            Total: 100,
            Observaciones: '',
            NombreEstado: 'Pagado',
            IdDetalle: 10,
            Producto: 'Pizza',
            Cantidad: 2,
            PrecioUnitario: 20,
            Subtotal: 40,
            IdInsumo: 5,
            NombreInsumo: 'Queso'
          }
        ]
      });

      await getVentabyId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const venta = res.json.mock.calls[0][0];
      expect(venta.detalles.length).toBe(1);
      expect(venta.detalles[0].insumos.length).toBe(1);
    });

    test('Debe retornar 404 si no existe', async () => {
      const req = { params: { id: 99 } };
      const res = mockResponse();

      pool.query.mockResolvedValue({ rows: [] });

      await getVentabyId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

  });

  // ===================== putVenta =====================
  describe('putVenta', () => {
    test('Debe actualizar venta', async () => {
      const req = {
        params: { id: 1 },
        body: { Observaciones: 'Actualizado', Estado: 2 }
      };
      const res = mockResponse();

      pool.query.mockResolvedValue({});

      await putVenta(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===================== postVenta =====================
  describe('postVenta', () => {

    test('Debe crear una venta correctamente', async () => {
      const req = {
        body: {
          Usuario: 1,
          MetodoPago: 'Efectivo',
          Descuento: 0,
          Observaciones: '',
          Estado: 4,
          Detalles: [
            { Producto: 1, Cantidad: 2, Insumos: [] }
          ]
        }
      };

      const res = mockResponse();

      const mockTransaction = {
        query: jest.fn(),
        release: jest.fn()
      };

      pool.connect.mockResolvedValue(mockTransaction);

      mockTransaction.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({
          rows: [{ IdProducto: 1, PrecioUnidad: 10, Stock: 10 }]
        }) // productos
        .mockResolvedValueOnce({ rows: [{ IdVenta: 1 }] }) // insert venta
        .mockResolvedValueOnce({ rows: [{ IdDetalle: 1 }] }) // insert detalle
        .mockResolvedValueOnce() // update stock
        .mockResolvedValueOnce(); // COMMIT

      await postVenta(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe fallar si hay stock insuficiente', async () => {
      const req = {
        body: {
          Usuario: 1,
          MetodoPago: 'Efectivo',
          Descuento: 0,
          Observaciones: '',
          Estado: 4,
          Detalles: [
            { Producto: 1, Cantidad: 50, Insumos: [] }
          ]
        }
      };

      const res = mockResponse();

      const mockTransaction = {
        query: jest.fn(),
        release: jest.fn()
      };

      pool.connect.mockResolvedValue(mockTransaction);

      mockTransaction.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({
          rows: [{ IdProducto: 1, PrecioUnidad: 10, Stock: 5 }]
        });

      await postVenta(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  });

});