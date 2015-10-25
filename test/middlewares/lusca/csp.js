'use strict';

const assert = require('assert');
const request = require('supertest');

const strapi = require('../../..');

const Instance = strapi.instance;

const mock = require('./mocks/app');

describe('csp', function () {
  it('method', function () {
    assert(typeof strapi.middlewares.lusca.csp === 'function');
  });

  it('header (report)', function (done) {
    const router = strapi.middlewares.router();
    const config = require('./mocks/config/cspReport');

    const app = mock({
      csp: config
    });

    router.get('/', function * () {
      ctx.body = 'hello';
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    request(app.listen())
      .get('/')
      .expect('Content-Security-Policy-Report-Only', 'default-src *; report-uri ' + config.reportUri)
      .expect('hello')
      .expect(200, done);
  });

  it('header (enforce)', function (done) {
    const router = strapi.middlewares.router();
    const config = require('./mocks/config/cspEnforce');

    const app = mock({
      csp: config
    });

    router.get('/', function * () {
      ctx.body = 'hello';
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    request(app.listen())
      .get('/')
      .expect('Content-Security-Policy', 'default-src *; ')
      .expect('hello')
      .expect(200, done);
  });
});
