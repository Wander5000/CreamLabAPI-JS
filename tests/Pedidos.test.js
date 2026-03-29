// ===================== MOCK DB =====================
jest.mock('../src/config/database.js', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const pool = require('../src/config/database.js');

// ===================== IMPORT CONTROLLER =====================
const {
  getAllPedidos,
  getPedidoById,
  postPedido,
  putPedido,
  anularPedido
} = require('../src/controllers/PedidosController');

// ===================== HELPERS =====================
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

// ===================== TESTS =====================
describe('Pedidos Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================== getAllPedidos =====================
  describe('getAllPedidos', () => {
    test('Debe agrupar pedidos correctamente', async () => {
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
            NombreEstado: 'Activo',
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
            NombreEstado: 'Activo',
            IdDetalle: 11,
            Producto: 'Gaseosa',
            Cantidad: 1,
            PrecioUnitario: 10,
            Subtotal: 10
          }
        ]
      });

      await getAllPedidos(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const data = res.json.mock.calls[0][0];
      expect(data.length).toBe(1);
      expect(data[0].detalles.length).toBe(2);
    });
  });

  // ===================== getPedidoById =====================
  describe('getPedidoById', () => {

    test('Debe retornar un pedido con insumos', async () => {
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
            NombreEstado: 'Activo',
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

      await getPedidoById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const pedido = res.json.mock.calls[0][0];
      expect(pedido.detalles.length).toBe(1);
      expect(pedido.detalles[0].insumos.length).toBe(1);
    });

    test('Debe retornar 404 si no existe', async () => {
      const req = { params: { id: 99 } };
      const res = mockResponse();

      pool.query.mockResolvedValue({ rows: [] });

      await getPedidoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

  });

  // ===================== putPedido =====================
  describe('putPedido', () => {
    test('Debe actualizar pedido', async () => {
      const req = {
        params: { id: 1 },
        body: { Observaciones: 'Test', Estado: 2 }
      };
      const res = mockResponse();

      pool.query.mockResolvedValue({});

      await putPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===================== anularPedido =====================
  describe('anularPedido', () => {
    test('Debe anular pedido y devolver stock', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      pool.query.mockResolvedValue({});

      await anularPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===================== postPedido =====================
  describe('postPedido', () => {

    test('Debe crear un pedido correctamente', async () => {
      const req = {
        body: {
          Usuario: 1,
          MetodoPago: 'Efectivo',
          Descuento: 0,
          Observaciones: '',
          Estado: 1,
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

      await postPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe fallar si hay stock insuficiente', async () => {
      const req = {
        body: {
          Usuario: 1,
          MetodoPago: 'Efectivo',
          Descuento: 0,
          Observaciones: '',
          Estado: 1,
          Detalles: [
            { Producto: 1, Cantidad: 20, Insumos: [] }
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
        }); // productos

      await postPedido(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  });

});