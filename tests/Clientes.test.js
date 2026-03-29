// ===================== MOCK DB =====================
jest.mock('../src/config/database.js', () => ({
  query: jest.fn()
}));

// ===================== MOCK BCRYPT =====================
jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));

const pool = require('../src/config/database.js');
const bcrypt = require('bcrypt');

// ===================== IMPORT CONTROLLER =====================
const {
  getAllClients,
  postClient,
  updateClient,
  changeClientStatus
} = require('../src/controllers/ClientesController');

// ===================== HELPER RESPONSE =====================
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res;
};

// ===================== TESTS =====================
describe('Clients Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================== getAllClients =====================
  describe('getAllClients', () => {
    test('Debe retornar todos los clientes', async () => {
      const req = {};
      const res = mockResponse();

      pool.query.mockResolvedValue({
        rows: [
          { idUsuario: 1, nombreUsuario: 'Juan', correo: 'juan@test.com' }
        ]
      });

      await getAllClients(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('Debe manejar error', async () => {
      const req = {};
      const res = mockResponse();

      pool.query.mockRejectedValue(new Error('DB Error'));

      await getAllClients(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ===================== postClient =====================
  describe('postClient', () => {
    test('Debe crear un cliente', async () => {
      const req = {
        body: {
          NombreUsuario: 'Juan',
          Correo: 'juan@test.com',
          Password: '123456',
          TipoDocumento: 'CC',
          NumeroDocumento: '123',
          Direccion: 'Calle 1'
        }
      };

      const res = mockResponse();

      bcrypt.hash.mockResolvedValue('hashedPassword');

      pool.query.mockResolvedValue({
        rowCount: 1
      });

      await postClient(req, res);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debe fallar si no se inserta', async () => {
      const req = {
        body: {
          NombreUsuario: 'Juan',
          Correo: 'juan@test.com',
          Password: '123456',
          TipoDocumento: 'CC',
          NumeroDocumento: '123',
          Direccion: 'Calle 1'
        }
      };

      const res = mockResponse();

      bcrypt.hash.mockResolvedValue('hashedPassword');

      pool.query.mockResolvedValue({
        rowCount: 0
      });

      await postClient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ===================== updateClient =====================
  describe('updateClient', () => {
    test('Debe actualizar cliente', async () => {
      const req = {
        params: { id: 1 },
        body: {
          NombreCliente: 'Juan',
          Correo: 'juan@test.com',
          TipoDocumento: 'CC',
          NumeroDocumento: '123',
          Direccion: 'Calle 1',
          Rol: 1
        }
      };

      const res = mockResponse();

      pool.query.mockResolvedValue({
        rowCount: 1
      });

      await updateClient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe retornar 404 si no existe', async () => {
      const req = {
        params: { id: 99 },
        body: {}
      };

      const res = mockResponse();

      pool.query.mockResolvedValue({
        rowCount: 0
      });

      await updateClient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===================== changeClientStatus =====================
  describe('changeClientStatus', () => {
    test('Debe cambiar estado', async () => {
      const req = { params: { id: 1 } };
      const res = mockResponse();

      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 1
      });

      await changeClientStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    test('Debe retornar 404 si no existe', async () => {
      const req = { params: { id: 999 } };
      const res = mockResponse();

      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      await changeClientStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

});