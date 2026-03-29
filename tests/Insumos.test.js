const { getAllInsumos, postInsumo, putInsumo, deleteInsumo } = require('../src/controllers/InsumosController');
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

describe('getAllInsumos', () => {

  test('Debe devolver insumos', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idInsumo: 1 }] });

    await getAllInsumos(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('Error DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getAllInsumos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('postInsumo', () => {

  test('400 campos faltantes', async () => {
    const req = { body: {} };
    const res = mockResponse();

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 nombre corto', async () => {
    const req = {
      body: {
        NombreInsumo: 'AB',
        CategoriaInsumo: 1,
        PrecioUnidad: 10,
        UnidadMedida: 'kg',
        Stock: 10,
        CantidadUnidad: 1
      }
    };
    const res = mockResponse();

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
  

  test('400 precio <= 0', async () => {
    const req = {
      body: {
        NombreInsumo: 'Azucar',
        CategoriaInsumo: 1,
        PrecioUnidad: 0,
        UnidadMedida: 'kg',
        Stock: 10,
        CantidadUnidad: 1
      }
    };
    const res = mockResponse();

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

    test('400 precio <= 0', async () => {
    const req = {
      body: {
        NombreInsumo: 'Azucar',
        CategoriaInsumo: 1,
        PrecioUnidad: -5,
        UnidadMedida: 'kg',
        Stock: 10,
        CantidadUnidad: 1
      }
    };
    const res = mockResponse();

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 insert falla', async () => {
    const req = {
      body: {
        NombreInsumo: 'Azucar',
        CategoriaInsumo: 1,
        PrecioUnidad: 10,
        UnidadMedida: 'kg',
        Stock: 10,
        CantidadUnidad: 1
      }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('201 insert correcto', async () => {
    const req = {
      body: {
        NombreInsumo: 'Azucar',
        CategoriaInsumo: 1,
        PrecioUnidad: 10,
        UnidadMedida: 'kg',
        Stock: 10,
        CantidadUnidad: 1
      }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 error DB', async () => {
    const req = {
      body: {
        NombreInsumo: 'Azucar',
        CategoriaInsumo: 1,
        PrecioUnidad: 10,
        UnidadMedida: 'kg',
        Stock: 10,
        CantidadUnidad: 1
      }
    };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await postInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('putInsumo', () => {

  test('204 actualizado', async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await putInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 }, body: {} };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await putInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error', async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await putInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('deleteInsumo', () => {

  test('204 eliminado', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await deleteInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await deleteInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await deleteInsumo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});