const { getAllUsers, postUser, updateUser, changeUserStatus } = require('../src/controllers/UsuariosController');
const pool = require('../src/config/database');
const bcrypt = require('bcrypt');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getAllUsers', () => {

  test('Debe devolver usuarios', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: [{ idUsuario: 1 }] });

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Error DB', async () => {
    const req = {};
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('postUser', () => {

  test('400 si faltan campos', async () => {
    const req = { body: {} };
    const res = mockResponse();

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 nombre corto', async () => {
    const req = {
      body: {
        NombreUsuario: 'AB',
        Correo: 'test@test.com',
        Password: '12345678',
        TipoDocumento: 'CC',
        NumeroDocumento: '123',
        Direccion: 'Calle',
        Rol: 2
      }
    };
    const res = mockResponse();

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 password corta', async () => {
    const req = {
      body: {
        NombreUsuario: 'Usuario',
        Correo: 'test@test.com',
        Password: '123',
        TipoDocumento: 'CC',
        NumeroDocumento: '123',
        Direccion: 'Calle',
        Rol: 2
      }
    };
    const res = mockResponse();

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 insert falla', async () => {
    const req = {
      body: {
        NombreUsuario: 'Usuario',
        Correo: 'test@test.com',
        Password: '12345678',
        TipoDocumento: 'CC',
        NumeroDocumento: '123',
        Direccion: 'Calle',
        Rol: 2
      }
    };
    const res = mockResponse();

    bcrypt.hash.mockResolvedValue('hashed');
    pool.query.mockResolvedValue({ rowCount: 0 });

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('201 usuario creado', async () => {
    const req = {
      body: {
        NombreUsuario: 'Usuario',
        Correo: 'test@test.com',
        Password: '12345678',
        TipoDocumento: 'CC',
        NumeroDocumento: '123',
        Direccion: 'Calle',
        Rol: 2
      }
    };
    const res = mockResponse();

    bcrypt.hash.mockResolvedValue('hashed');
    pool.query.mockResolvedValue({ rowCount: 1 });

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 error bcrypt', async () => {
    const req = {
      body: {
        NombreUsuario: 'Usuario',
        Correo: 'test@test.com',
        Password: '12345678',
        TipoDocumento: 'CC',
        NumeroDocumento: '123',
        Direccion: 'Calle',
        Rol: 2
      }
    };
    const res = mockResponse();

    bcrypt.hash.mockRejectedValue(new Error());

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('500 error DB', async () => {
    const req = {
      body: {
        NombreUsuario: 'Usuario',
        Correo: 'test@test.com',
        Password: '12345678',
        TipoDocumento: 'CC',
        NumeroDocumento: '123',
        Direccion: 'Calle',
        Rol: 2
      }
    };
    const res = mockResponse();

    bcrypt.hash.mockResolvedValue('hashed');
    pool.query.mockRejectedValue(new Error());

    await postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('updateUser', () => {

  test('200 actualizado', async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 1 });

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 }, body: {} };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rowCount: 0 });

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('changeUserStatus', () => {

  test('204 cambia estado', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: { rowCount: 1 } });

    await changeUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('404 no encontrado', async () => {
    const req = { params: { id: 99 } };
    const res = mockResponse();

    pool.query.mockResolvedValue({ rows: { rowCount: 0 } });

    await changeUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('500 error DB', async () => {
    const req = { params: { id: 1 } };
    const res = mockResponse();

    pool.query.mockRejectedValue(new Error());

    await changeUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});