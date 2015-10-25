'use strict';

const assert = require('assert');
const request = require('supertest');

const strapi = require('../..');

const Instance = strapi.instance;

describe('ctx.state', function () {
  it('should provide a ctx.state namespace', function (done) {
    const app = new Instance();

    app.use(function * (ctx, next) {
      assert.deepEqual(ctx.state, {});
    });

    const server = app.listen();

    request(server)
      .get('/')
      .expect(404)
      .end(done);
  });
});
