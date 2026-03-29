const {
  getAllCategoriasInsumo,
  postCategoriaInsumo,
  putCategoriaInsumo,
  deleteCategoriaInsumo
} = require('../src/controllers/CategoriasInsumoController');

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

beforeEach(() => {
  jest.clearAllMocks();
});


// =======================
// GET ALL
// =======================
describe('getAllCategoriasInsumo', () => {

  test('Debe devolver categorias', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({
      rows: [{ idCatInsumo: 1, nombreCatInsumo: 'Leche' }]
    });

    await getAllCategoriasInsumo(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('500 error DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getAllCategoriasInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// POST
// =======================
describe('postCategoriaInsumo', () => {

  test('400 si no envía nombre', async () => {
    const req = { body: {} };
    const res = mockResponse();

    await postCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si no se inserta', async () => {
    const req = { body: { NombreCatInsumo: 'Leche' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await postCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('201 creado', async () => {
    const req = { body: { NombreCatInsumo: 'Leche' } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await postCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 error DB', async () => {
    const req = { body: { NombreCatInsumo: 'Leche' } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await postCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// PUT
// =======================
describe('putCategoriaInsumo', () => {

  test('204 actualizado', async () => {
    const req = {
      params: { id: 1 },
      body: { NombreCatInsumo: 'Azucar' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await putCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = {
      params: { id: 99 },
      body: { NombreCatInsumo: 'Azucar' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await putCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = {
      params: { id: 1 },
      body: { NombreCatInsumo: 'Azucar' }
    };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await putCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// DELETE
// =======================
describe('deleteCategoriaInsumo', () => {

  test('204 eliminado', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await deleteCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await deleteCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await deleteCategoriaInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});