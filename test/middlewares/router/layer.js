'use strict';

const http = require('http');

const should = require('should');
const request = require('supertest');

const strapi = require('../../..');

const Instance = strapi.instance;

describe('layer', function () {
  it('composes multiple callbacks/middleware', function (done) {
    const app = new Instance();
    const router = strapi.middlewares.router();

    app.use(router.routes());

    router.get('/:category/:title',
      function * (next) {
        ctx.status = 500;
        yield next();
      },
      function * (next) {
        ctx.status = 204;
        yield next();
      }
    );

    request(app.listen())
      .get('/programming/how-to-node')
      .expect(204)
      .end(function (err) {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  describe('layer#match()', function () {
    it('captures URL path parameters', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      app.use(router.routes());

      router.get('/:category/:title', function * (next) {
        ctx.should.have.property('params');
        ctx.params.should.be.type('object');
        ctx.params.should.have.property('category', 'match');
        ctx.params.should.have.property('title', 'this');
        ctx.status = 204;
      });

      request(app.listen())
        .get('/match/this')
        .expect(204)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('return orginal path parameters when decodeURIComponent throw error', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      app.use(router.routes());

      router.get('/:category/:title', function * (next) {
        ctx.should.have.property('params');
        ctx.params.should.be.type('object');
        ctx.params.should.have.property('category', '100%');
        ctx.params.should.have.property('title', '101%');
        ctx.status = 204;
      });

      request(app.listen())
        .get('/100%/101%')
        .expect(204)
        .end(done);
    });

    it('populates ctx.captures with regexp captures', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      app.use(router.routes());

      router.get(/^\/api\/([^\/]+)\/?/i, function * (next) {
        ctx.should.have.property('captures');
        ctx.captures.should.be.instanceOf(Array);
        ctx.captures.should.have.property(0, '1');
        yield next();
      }, function * (next) {
        ctx.should.have.property('captures');
        ctx.captures.should.be.instanceOf(Array);
        ctx.captures.should.have.property(0, '1');
        ctx.status = 204;
      });

      request(app.listen())
        .get('/api/1')
        .expect(204)
        .end(function (err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('return orginal ctx.captures when decodeURIComponent throw error', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      app.use(router.routes());

      router.get(/^\/api\/([^\/]+)\/?/i, function * (next) {
        ctx.should.have.property('captures');
        ctx.captures.should.be.type('object');
        ctx.captures.should.have.property(0, '101%');
        yield next();
      }, function * (next) {
        ctx.should.have.property('captures');
        ctx.captures.should.be.type('object');
        ctx.captures.should.have.property(0, '101%');
        ctx.status = 204;
      });

      request(app.listen())
        .get('/api/101%')
        .expect(204)
        .end(function (err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('populates ctx.captures with regexp captures include undefiend', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      app.use(router.routes());

      router.get(/^\/api(\/.+)?/i, function * (next) {
        ctx.should.have.property('captures');
        ctx.captures.should.be.type('object');
        ctx.captures.should.have.property(0, undefined);
        yield next();
      }, function * (next) {
        ctx.should.have.property('captures');
        ctx.captures.should.be.type('object');
        ctx.captures.should.have.property(0, undefined);
        ctx.status = 204;
      });

      request(app.listen())
        .get('/api')
        .expect(204)
        .end(function (err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should throw friendly error message when handle not exists', function () {
      const app = new Instance();
      const router = strapi.middlewares.router();

      app.use(router.routes());

      const notexistHandle = undefined;

      (function () {
        router.get('/foo', notexistHandle);
      }).should.throw('get `/foo`: `middleware` must be a function, not `undefined`');

      (function () {
        router.get('foo router', '/foo', notexistHandle);
      }).should.throw('get `foo router`: `middleware` must be a function, not `undefined`');

      (function () {
        router.post('/foo', function () {}, notexistHandle);
      }).should.throw('post `/foo`: `middleware` must be a function, not `undefined`');
    });
  });

  describe('layer#param()', function () {
    it('composes middleware for param fn', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      const route = router.register('/users/:user', ['GET'], [function * (next) {
        ctx.body = ctx.user;
      }]);

      route.param('user', function * (id, next) {
        ctx.user = {
          name: 'John'
        };

        if (!id) {
          return ctx.status = 404;
        }

        yield next();
      });

      router.stack.push(route);
      app.use(router.middleware());

      request(app.listen())
        .get('/users/3')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          res.should.have.property('body');
          res.body.should.have.property('name', 'John');
          done();
        });
    });

    it('ignores params which are not matched', function (done) {
      const app = new Instance();
      const router = strapi.middlewares.router();

      const route = router.register('/users/:user', ['GET'], [function * (next) {
        ctx.body = ctx.user;
      }]);

      route.param('user', function * (id, next) {
        ctx.user = {
          name: 'John'
        };

        if (!id) {
          return ctx.status = 404;
        }

        yield next();
      });

      route.param('title', function * (id, next) {
        ctx.user = {
          name: 'mark'
        };

        if (!id) {
          return ctx.status = 404;
        }

        yield next();
      });

      router.stack.push(route);
      app.use(router.middleware());

      request(app.listen())
        .get('/users/3')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          res.should.have.property('body');
          res.body.should.have.property('name', 'John');
          done();
        });
    });
  });

  describe('layer#url()', function () {
    it('generates route URL', function () {
      const app = new Instance();
      const router = strapi.middlewares.router();

      const route = router.register('/:category/:title', ['get'], [function * () {}], 'books');
      let url = route.url({
        category: 'programming',
        title: 'how-to-node'
      });

      url.should.equal('/programming/how-to-node');
      url = route.url('programming', 'how-to-node');
      url.should.equal('/programming/how-to-node');
    });

    it('escapes using encodeURIComponent()', function () {
      const app = new Instance();
      const router = strapi.middlewares.router();

      const route = router.register('/:category/:title', ['get'], [function * () {}], 'books');
      const url = route.url({
        category: 'programming',
        title: 'how to node'
      });

      url.should.equal('/programming/how%20to%20node');
    });
  });
});
