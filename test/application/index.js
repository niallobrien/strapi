'use strict';

const assert = require('assert');
const request = require('supertest');

const strapi = require('../..');

const Instance = strapi.instance;

describe('app', function () {
  it('should handle socket errors', function (done) {
    const app = new Instance();

    app.use(function * (ctx, next) {
      ctx.socket.emit('error', new Error('boom'));
    });

    app.on('error', function (err) {
      err.message.should.equal('boom');
      done();
    });

    request(app.listen())
      .get('/')
      .end(function () {});
  });

  it('should not .writeHead when !socket.writable', function (done) {
    const app = new Instance();

    app.use(function * (ctx, next) {
      ctx.socket.writable = false;
      ctx.status = 204;
      ctx.res.writeHead =
      ctx.res.end = function () {
        throw new Error('response sent');
      };
    });

    setImmediate(done);

    request(app.listen())
      .get('/')
      .end(function () {});
  });

  it('should set development env when NODE_ENV missing', function () {
    const NODE_ENV = process.env.NODE_ENV;
    process.env.NODE_ENV = '';

    const app = new Instance();
    process.env.NODE_ENV = NODE_ENV;

    assert.equal(app.env, 'development');
  });
});
