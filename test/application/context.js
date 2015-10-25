'use strict';

const assert = require('assert');
const request = require('supertest');

const strapi = require('../..');

const Instance = strapi.instance;

describe('app.context', function () {
  const app1 = new Instance();
  app1.context.msg = 'hello';

  const app2 = new Instance();

  it('should merge properties', function (done) {
    app1.use(function * (ctx, next) {
      assert.equal(ctx.msg, 'hello');
      ctx.status = 204;
    });

    request(app1.listen())
      .get('/')
      .expect(204, done);
  });

  it('should not affect the original prototype', function (done) {
    app2.use(function * (ctx, next) {
      assert.equal(ctx.msg, undefined);
      ctx.status = 204;
    });

    request(app2.listen())
      .get('/')
      .expect(204, done);
  });
});
