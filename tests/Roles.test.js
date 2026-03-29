const { getAllRoles, postRol, putRol, deleteRol } = require('../src/controllers/RolesController');
const pool = require('../src/config/database');

// 🎭 Doble de la base de datos
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

// Helper para simular res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getAllRoles', () => {

  test('Debe devolver todos los roles', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({
      rows: [{ idRol: 1, nombreRol: 'Admin' }]
    });

    await getAllRoles(req, res);

    expect(pool.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([
      { idRol: 1, nombreRol: 'Admin' }
    ]);
  });

  test('Debe manejar error 500', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await getAllRoles(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('postRol', () => {

  test('Debe fallar si no envían NombreRol', async () => {
    const req = { body: {} };
    const res = mockResponse();

    await postRol(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'El nombre del rol es requerido'
    });
  });

  test('Debe crear el rol correctamente', async () => {
    const req = { body: { NombreRol: 'Admin' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await postRol(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO "Roles" ("NombreRol") VALUES ($1)',
      ['Admin']
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Debe fallar si no se inserta', async () => {
    const req = { body: { NombreRol: 'Admin' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await postRol(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Debe manejar error 500', async () => {
    const req = { body: { NombreRol: 'Admin' } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await postRol(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('putRol', () => {

  test('Debe actualizar un rol', async () => {
    const req = {
      params: { id: 1 },
      body: { NombreRol: 'User' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await putRol(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('Debe devolver 404 si no existe', async () => {
    const req = {
      params: { id: 999 },
      body: { NombreRol: 'User' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await putRol(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Debe manejar error 500', async () => {
    const req = {
      params: { id: 1 },
      body: { NombreRol: 'User' }
    };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await putRol(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('deleteRol', () => {

  test('Debe eliminar un rol', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await deleteRol(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('Debe devolver 404 si no existe', async () => {
    const req = { params: { id: 999 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await deleteRol(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Debe manejar error 500', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await deleteRol(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});