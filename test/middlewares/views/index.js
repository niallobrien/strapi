'use strict';

const path = require('path');

const request = require('supertest');

const strapi = require('../../..');

const Instance = strapi.instance;

describe('views', function () {
  it('have a render method', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views());

    app.use(function * (ctx, next) {
      ctx.render.should.ok;
      ctx.render.should.Function;
    });

    request(app.listen())
      .get('/')
      .expect(404, done);
  });

  it('default to html', function (done) {
    const app = new Instance();
    const router = strapi.middlewares.router();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures')));

    router.get('/', function * () {
      yield ctx.render('basic');
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:html/)
      .expect(200, done);
  });

  it('default to ext if a default engine is set', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures'), {
      default: 'jade'
    }));

    app.use(function * (ctx, next) {
      yield ctx.render('basic');
    });

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:jade/)
      .expect(200, done);
  });

  it('set and render state', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures'), {
      default: 'jade'
    }));

    app.use(function * (ctx, next) {
      ctx.state.engine = 'jade';
      yield ctx.render('global-state');
    });

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:jade/)
      .expect(200, done);
  });

  it('set option: root', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures'), {
      root: '../../../test',
      default: 'jade'
    }));

    app.use(function * (ctx, next) {
      ctx.state.engine = 'jade';
      yield ctx.render('global-state');
    });

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:jade/)
      .expect(200, done);
  });

  it('works with circular references in state', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures'), {
      default: 'jade'
    }));

    app.use(function * (ctx, next) {
      ctx.state = {
        a: {},
        app: app
      };

      ctx.state.a.a = ctx.state.a;

      yield ctx.render('global-state', {
        app: app,
        b: ctx.state,
        engine: 'jade'
      });
    });

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:jade/)
      .expect(200, done);
  });

  it('map given engine to given file ext', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures'), {
      map: {
        html: 'lodash'
      }
    }));

    app.use(function * (ctx, next) {
      ctx.state.engine = 'lodash';
      yield ctx.render('lodash');
    });

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:lodash/)
      .expect(200, done);
  });

  it('merges global and local state ', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.views(path.resolve(__dirname, 'fixtures'), {
      default: 'jade'
    }));

    app.use(function * (ctx, next) {
      ctx.state.engine = 'jade';

      yield ctx.render('state', {
        type: 'basic'
      });
    });

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:jade/)
      .expect(200, done);
  });

  it('yields to the next middleware if ctx.render is already defined', function (done) {
    const app = new Instance();

    app.use(function * (ctx, next) {
      ctx.render = true;
      yield next();
    });

    app.use(strapi.middlewares.views());

    app.use(function * (ctx, next) {
      ctx.body = 'hello';
    });

    request(app.listen())
      .get('/')
      .expect('hello')
      .expect(200, done);
  });
});
