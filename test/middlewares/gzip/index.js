'use strict';

const fs = require('fs');

const should = require('should');
const request = require('supertest');

const strapi = require('../../..');

const Instance = strapi.instance;

describe('gzip', function () {
  const options = {};
  const BODY = 'foo bar string, foo bar string, foo bar string, foo bar string, \
    foo bar string, foo bar string, foo bar string, foo bar string, foo bar string, foo bar string, \
    foo bar string, foo bar string, foo bar string, foo bar string, foo bar string, foo bar string';

  let app = new Instance();

  app.use(strapi.middlewares.gzip(options));
  app.use(strapi.middlewares.gzip(options));
  app.use(function * (ctx, next) {
    if (ctx.url === '/404') {
      return yield next();
    }
    if (ctx.url === '/small') {
      return ctx.body = 'foo bar string';
    }
    if (ctx.url === '/string') {
      return ctx.body = BODY;
    }
    if (ctx.url === '/buffer') {
      return ctx.body = new Buffer(BODY);
    }
    if (ctx.url === '/object') {
      return ctx.body = {
        foo: BODY
      };
    }
    if (ctx.url === '/number') {
      return ctx.body = 1984;
    }
    if (ctx.url === '/stream') {
      const stat = fs.statSync(__filename);
      ctx.set('content-length', stat.size);
      return ctx.body = fs.createReadStream(__filename);
    }
    if (ctx.url === '/exists-encoding') {
      ctx.set('content-encoding', 'gzip');
      return ctx.body = new Buffer('gzip');
    }
    if (ctx.url === '/error') {
      return ctx.throw(new Error('mock error'));
    }
  });

  before(function (done) {
    app = app.listen(0, done);
  });

  describe('strapi.middlewares.gzip()', function () {
    it('should work with no options', function () {
      strapi.middlewares.gzip();
    });
  });

  describe('when status 200 and request accept-encoding include gzip', function () {
    it('should return gzip string body', function (done) {
      request(app)
        .get('/string')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(200)
        .expect('content-encoding', 'gzip')
        .expect('content-length', '46')
        .expect(BODY, done);
    });

    it('should return raw string body if body smaller than minLength', function (done) {
      request(app)
        .get('/small')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(200)
        .expect('content-length', '14')
        .expect('foo bar string', function (err, res) {
          should.not.exist(err);
          should.not.exist(res.headers['content-encoding']);
          done();
        });
    });

    it('should return gzip buffer body', function (done) {
      request(app)
        .get('/buffer')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(200)
        .expect('content-encoding', 'gzip')
        .expect('content-length', '46')
        .expect(BODY, done);
    });

    it('should return gzip stream body', function (done) {
      request(app)
        .get('/stream')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(200)
        .expect('Content-Encoding', 'gzip')
        .expect(fs.readFileSync(__filename, 'utf8'),
          function (err, res) {
            should.not.exist(err);
            should.not.exist(res.headers['content-length']);
            done();
          });
    });

    it('should return gzip json body', function (done) {
      request(app)
        .get('/object')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(200)
        .expect('Content-Encoding', 'gzip')
        .expect('content-length', '52')
        .expect({
          foo: BODY
        }, done);
    });

    it('should return number body', function (done) {
      request(app)
        .get('/number')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect('content-length', '4')
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.body.should.equal(1984);
          done();
        });
    });
  });

  describe('when status 200 and request accept-encoding exclude gzip', function () {
    it('should return raw body', function (done) {
      request(app)
        .get('/string')
        .set('Accept-Encoding', 'deflate,sdch')
        .expect(200)
        .expect('content-length', '' + BODY.length)
        .expect(BODY,
          function (err, res) {
            should.not.exist(err);
            should.not.exist(res.headers['content-encoding']);
            done();
          });
    });
  });

  describe('when status non 200', function () {
    it('should return 404', function (done) {
      request(app)
        .get('/404')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(404)
        .expect('Not Found', done);
    });

    it('should return 500', function (done) {
      request(app)
        .get('/error')
        .set('Accept-Encoding', 'gzip,deflate,sdch')
        .expect(500)
        .expect('Internal Server Error', done);
    });
  });
});
