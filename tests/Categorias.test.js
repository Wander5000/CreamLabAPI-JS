const { getAllCategories, postCategory, putCategory, deleteCategory } = require('../src/controllers/CategoriasController');
const pool = require('../src/config/database');

// Mock de la base de datos
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

describe('getAllCategories', () => {

  test('Debe devolver todas las categorías', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({
      rows: [
        { idCategoria: 1, nombreCategoria: 'Bebidas', descripcion: 'Bebidas frías' }
      ]
    });

    await getAllCategories(req, res);

    expect(pool.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([
      { idCategoria: 1, nombreCategoria: 'Bebidas', descripcion: 'Bebidas frías' }
    ]);
  });

  test('Debe devolver error 500 si falla la DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await getAllCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('postCategory', () => {

  test('400 si faltan campos', async () => {
    const req = { body: {} };
    const res = mockResponse();

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si el nombre es muy corto', async () => {
    const req = {
      body: { NombreCategoria: 'AB', Descripcion: 'Descripción válida larga' }
    };
    const res = mockResponse();

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si el nombre es muy largo', async () => {
    const req = {
      body: { NombreCategoria: 'NombreCategoriaMuyLargo', Descripcion: 'Descripción válida larga' }
    };
    const res = mockResponse();

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si la descripción es muy corta', async () => {
    const req = {
      body: { NombreCategoria: 'Bebidas', Descripcion: 'Corta' }
    };
    const res = mockResponse();

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si la descripción es muy larga', async () => {
    const req = {
      body: { NombreCategoria: 'Bebidas', Descripcion: 'a'.repeat(201) }
    };
    const res = mockResponse();

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si no se pudo insertar la categoría', async () => {
    const req = {
      body: { NombreCategoria: 'Bebidas', Descripcion: 'Descripción válida larga' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('201 si se crea la categoría correctamente', async () => {
    const req = {
      body: { NombreCategoria: 'Bebidas', Descripcion: 'Descripción válida larga' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 si ocurre un error en la base de datos', async () => {
    const req = {
      body: { NombreCategoria: 'Bebidas', Descripcion: 'Descripción válida larga' }
    };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await postCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('putCategory', () => {

  test('Debe actualizar una categoría', async () => {
    const req = {
      params: { id: 1 },
      body: { NombreCategoria: 'Nueva', Descripcion: 'Nueva descripción' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await putCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('Debe devolver 404 si no existe', async () => {
    const req = {
      params: { id: 999 },
      body: { NombreCategoria: 'Nueva', Descripcion: 'Nueva descripción' }
    };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await putCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Debe devolver 500 si hay error en DB', async () => {
    const req = {
      params: { id: 1 },
      body: { NombreCategoria: 'Nueva', Descripcion: 'Nueva descripción' }
    };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await putCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('deleteCategory', () => {

  test('Debe eliminar una categoría', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('Debe devolver 404 si no existe', async () => {
    const req = { params: { id: 999 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Debe devolver 500 si hay error', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error('DB error'));

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});