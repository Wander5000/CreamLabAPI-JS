const {
  getAllProducts,
  getProductById,
  getValidProducts,
  getProductsByCategory,
  postProduct,
  putProduct,
  changeProductState,
  deleteProduct
} = require('../src/controllers/ProductosController');

const pool = require('../src/config/database');
const cloudinary = require('../src/config/cloudinary');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../src/config/cloudinary', () => ({
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn()
  }
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
// GET ALL PRODUCTS
// =======================
describe('getAllProducts', () => {

  test('Debe devolver productos', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idProducto: 1 }] });

    await getAllProducts(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('Error DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getAllProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// GET PRODUCT BY ID
// =======================
describe('getProductById', () => {

  test('Debe devolver producto', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({
      rows: [{
        idProducto: 1,
        nombreProducto: 'Helado',
        categoriaProducto: 'Postres',
        precioUnidad: 5000,
        stock: 10,
        descripcion: '',
        imagen: '',
        estado: true,
        NombreCatInsumo: null
      }]
    });

    await getProductById(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('404 producto no existe', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [] });

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// GET VALID PRODUCTS
// =======================
describe('getValidProducts', () => {

  test('Debe devolver productos válidos', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idProducto: 1 }] });

    await getValidProducts(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('Error DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getValidProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// GET PRODUCTS BY CATEGORY
// =======================
describe('getProductsByCategory', () => {

  test('Debe devolver productos por categoría', async () => {
    const req = { params: { category: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idProducto: 1 }] });

    await getProductsByCategory(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('Error DB', async () => {
    const req = { params: { category: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getProductsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// POST PRODUCT
// =======================
describe('postProduct', () => {

  test('400 CatInsumos inválido', async () => {
    const req = {
      body: {
        NombreProducto: 'Helado',
        CatInsumos: "no es json"
      }
    };
    const res = mockResponse();

    await postProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 CatInsumos no es array', async () => {
  const req = {
    body: {
      NombreProducto: 'Helado',
      CatInsumos: {}
    }
  };
  const res = mockResponse();

  await postProduct(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test('201 producto con insumos', async () => {
  const req = {
    body: {
      NombreProducto: 'Helado',
      Descripcion: 'Test',
      CategoriaProducto: 1,
      PrecioUnidad: 2000,
      Stock: 5,
      CatInsumos: [
        {
          CategoriaInsumo: 1,
          Minimo: 1,
          Maximo: 2,
          Obligatorio: true
        }
      ]
    }
  };
  const res = mockResponse();

  pool.query
    .mockResolvedValueOnce() // BEGIN
    .mockResolvedValueOnce({ rows: [{ IdProducto: 1 }] }) // INSERT producto
    .mockResolvedValueOnce() // INSERT insumo
    .mockResolvedValueOnce(); // COMMIT

  await postProduct(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
});

test('201 producto con imagen', async () => {
  const req = {
    body: {
      NombreProducto: 'Helado',
      Descripcion: 'Test',
      CategoriaProducto: 1,
      PrecioUnidad: 2000,
      Stock: 5,
      CatInsumos: []
    },
    file: {
      buffer: Buffer.from('test'),
      mimetype: 'image/png'
    }
  };
  const res = mockResponse();

  cloudinary.uploader.upload.mockResolvedValue({
    secure_url: 'url',
    public_id: 'id'
  });

  pool.query
    .mockResolvedValueOnce() // BEGIN
    .mockResolvedValueOnce({ rows: [{ IdProducto: 1 }] }) // INSERT
    .mockResolvedValueOnce(); // COMMIT

  await postProduct(req, res);

  expect(cloudinary.uploader.upload).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
});

  test('201 producto creado', async () => {
    const req = {
      body: {
        NombreProducto: 'Helado',
        Descripcion: 'Test',
        CategoriaProducto: 1,
        PrecioUnidad: 2000,
        Stock: 5,
        CatInsumos: []
      }
    };
    const res = mockResponse();

    pool.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ IdProducto: 1 }] }) // INSERT
      .mockResolvedValueOnce(); // COMMIT

    await postProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 error DB', async () => {
    const req = {
      body: {
        NombreProducto: 'Helado',
        CatInsumos: []
      }
    };
    const res = mockResponse();

  pool.query
    .mockResolvedValueOnce() // BEGIN
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce(); // ROLLBACK

    await postProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// PUT PRODUCT
// =======================
describe('putProduct', () => {

  test('200 actualizado', async () => {
    const req = {
      params: { id: 1 },
      body: {
        NombreProducto: 'Nuevo',
        Descripcion: '',
        CategoriaProducto: 1,
        PrecioUnidad: 1000,
        Stock: 10,
        Estado: true
      }
    };
    const res = mockResponse();

    pool.query
      .mockResolvedValueOnce({ rows: [{ Imagen: '', PublicID: '' }] }) // SELECT
      .mockResolvedValueOnce({ rows: [{ idProducto: 1 }] }); // UPDATE

    await putProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 }, body: {} };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [] });

    await putProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 actualizar con imagen nueva', async () => {
  const req = {
    params: { id: 1 },
    body: {
      NombreProducto: 'Nuevo',
      Descripcion: '',
      CategoriaProducto: 1,
      PrecioUnidad: 1000,
      Stock: 10,
      Estado: true
    },
    file: {
      buffer: Buffer.from('test'),
      mimetype: 'image/png'
    }
  };
  const res = mockResponse();

  pool.query
    .mockResolvedValueOnce({ rows: [{ Imagen: 'old', PublicID: 'oldid' }] });

  cloudinary.uploader.destroy.mockResolvedValue();
  cloudinary.uploader.upload.mockResolvedValue({
    secure_url: 'newurl',
    public_id: 'newid'
  });

  pool.query.mockResolvedValueOnce({ rows: [{ idProducto: 1 }] });

  await putProduct(req, res);

  expect(cloudinary.uploader.destroy).toHaveBeenCalled();
  expect(cloudinary.uploader.upload).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
});

  test('500 error DB', async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await putProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// CHANGE PRODUCT STATE
// =======================
describe('changeProductState', () => {

  test('200 cambia estado', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idProducto: 1 }] });

    await changeProductState(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [] });

    await changeProductState(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await changeProductState(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});


// =======================
// DELETE PRODUCT
// =======================
describe('deleteProduct', () => {

  test('200 eliminado', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idProducto: 1 }] });

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [] });

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});