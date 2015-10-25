'use strict';

const path = require('path');

const request = require('supertest');

const strapi = require('../../..');

const Instance = strapi.instance;

describe('proxy', function () {
  let server;

  before(function () {
    const app = new Instance();

    app.use(function * (ctx, next) {
      if (ctx.path === '/error') {
        ctx.body = '';
        ctx.status = 500;
        return;
      }

      if (ctx.path === '/postme') {
        ctx.body = ctx.req;
        ctx.set('content-type', ctx.request.header['content-type']);
        ctx.status = 200;
        return;
      }

      if (ctx.querystring) {
        ctx.body = ctx.querystring;
        return;
      }

      yield * next;
    });

    app.use(strapi.middlewares.static(path.resolve(__dirname, 'fixtures')));
    server = app.listen(1234);
  });

  after(function () {
    server.close();
  });

  it('should have option url', function (done) {
    const app = new Instance();
    const router = strapi.middlewares.router();

    router.get('/index.js', strapi.middlewares.proxy({
      url: 'http://localhost:1234/class.js'
    }));

    app.use(router.routes());
    app.use(router.allowedMethods());

    request(app.listen())
      .get('/index.js')
      .expect(200)
      .expect('Content-Type', /javascript/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('define("arale/class/1.0.0/class"');
        done();
      });
  });

  it('should have option url and host', function (done) {
    const app = new Instance();
    const router = strapi.middlewares.router();

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234',
      url: 'class.js'
    }));

    router.get('/index.js', strapi.middlewares.proxy({
      host: 'http://localhost:1234',
      url: 'class.js'
    }));

    app.use(router.routes());
    app.use(router.allowedMethods());

    request(app.listen())
      .get('/index.js')
      .expect(200)
      .expect('Content-Type', /javascript/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('define("arale/class/1.0.0/class"');
        done();
      });
  });

  it('should have option host', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234'
    }));

    request(app.listen())
      .get('/class.js')
      .expect(200)
      .expect('Content-Type', /javascript/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('define("arale/class/1.0.0/class"');
        done();
      });
  });

  it('should have option host and map', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234',
      map: {
        '/index.js': '/class.js'
      }
    }));

    request(app.listen())
      .get('/index.js')
      .expect(200)
      .expect('Content-Type', /javascript/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('define("arale/class/1.0.0/class"');
        done();
      });
  });

  it('should have option host and match', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234',
      match: /^\/[a-z]+\.js$/
    }));

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234'
    }));

    request(app.listen())
      .get('/class.js')
      .expect(200)
      .expect('Content-Type', /javascript/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('define("arale/class/1.0.0/class"');
        done();
      });
  });

  it('url not match for url', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      url: 'class.js'
    }));

    app.use(function * (ctx, next) {
      ctx.body = 'next';
    });

    request(app.listen())
      .get('/index.js')
      .expect(200)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.eql('next');
        done();
      });
  });

  it('url not match for map', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      map: {
        '/index.js': '/class.js'
      }
    }));

    app.use(function * (ctx, next) {
      ctx.body = 'next';
    });

    request(app.listen())
      .get('/index.js')
      .expect(200)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.eql('next');
        done();
      });
  });

  it('option exist', function () {
    (function () {
      strapi.middlewares.proxy();
    }).should.throw();
  });

  it('encoding', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      url: 'http://localhost:1234/index.html',
      encoding: 'gbk'
    }));

    request(app.listen())
      .get('/index.js')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('<div>中国</div>');
        done();
      });
  });

  it('pass query', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      url: 'http://localhost:1234/class.js',
      encoding: 'gbk'
    }));

    request(app.listen())
      .get('/index.js?a=1')
      .expect(200)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.startWith('a=1');
        done();
      });
  });

  it('pass request body', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234'
    }));

    request(app.listen())
      .post('/postme')
      .send({
        foo: 'bar'
      })
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.equal('{"foo":"bar"}');
        done();
      });
  });

  it('pass parsed request body', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.bodyparser());

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234'
    }));

    request(app.listen())
      .post('/postme')
      .send({
        foo: 'bar'
      })
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        res.text.should.equal('{"foo":"bar"}');
        done();
      });
  });

  it('statusCode', function (done) {
    const app = new Instance();

    app.use(strapi.middlewares.proxy({
      host: 'http://localhost:1234'
    }));

    request(app.listen())
      .get('/error')
      .expect(500, done);
  });
});
