const { getAllStates, postState, putState, deleteState } = require('../src/controllers/EstadosController');
const pool = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getAllStates', () => {

  test('Debe devolver estados', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idEstado: 1, nombreEstado: 'Activo' }] });

    await getAllStates(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('Error DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getAllStates(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('postState', () => {

  test('400 si no envía nombre', async () => {
    const req = { body: {} };
    const res = mockResponse();

    await postState(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si nombre < 3', async () => {
    const req = { body: { NombreEstado: 'AB' } };
    const res = mockResponse();

    await postState(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si no se pudo insertar', async () => {
    const req = { body: { NombreEstado: 'Activo' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await postState(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('201 si se crea', async () => {
    const req = { body: { NombreEstado: 'Activo' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await postState(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 error DB', async () => {
    const req = { body: { NombreEstado: 'Activo' } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await postState(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('putState', () => {

  test('204 actualizado', async () => {
    const req = { params: { id: 1 }, body: { NombreEstado: 'Inactivo' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await putState(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 }, body: { NombreEstado: 'Inactivo' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await putState(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error', async () => {
    const req = { params: { id: 1 }, body: { NombreEstado: 'Inactivo' } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await putState(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('deleteState', () => {

  test('204 eliminado', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await deleteState(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await deleteState(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await deleteState(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});