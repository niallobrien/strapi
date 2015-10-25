'use strict';

const request = require('supertest');
const should = require('should');

const strapi = require('../../..');

const Instance = strapi.instance;

describe('session', function () {
  let cookie;

  describe('when options.signed = true', function () {
    describe('when app.keys are set', function () {
      it('should work', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session({}, app));

        app.use(function * (ctx, next) {
          ctx.session.message = 'hi';
          ctx.body = ctx.session;
        });

        request(app.listen())
          .get('/')
          .expect(200, done);
      });
    });

    describe('when app.keys are not set', function () {
      it('should throw', function (done) {
        const app = new Instance();

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session.message = 'hi';
          ctx.body = ctx.session;
        });

        request(app.listen())
          .get('/')
          .expect(500, done);
      });
    });

    describe('when app not set', function () {
      it('should throw', function () {
        const app = new Instance();

        (function () {
          app.use(strapi.middlewares.session());
        }).should.throw('app instance required: `session(opts, app)`');
      });
    });
  });

  describe('when options.signed = false', function () {
    describe('when app.keys are not set', function () {
      it('should work', function (done) {
        const app = new Instance();

        app.use(strapi.middlewares.session({
          signed: false
        }, app));

        app.use(function * (ctx, next) {
          ctx.session.message = 'hi';
          ctx.body = ctx.session;
        });

        request(app.listen())
          .get('/')
          .expect(200, done);
      });
    });
  });

  describe('when the session contains a ;', function () {
    it('should still work', function (done) {
      const app = new Instance();

      app.keys = ['a', 'b'];

      app.use(strapi.middlewares.session(app));

      app.use(function * (ctx, next) {
        if (ctx.method === 'POST') {
          ctx.session.string = ';';
          ctx.status = 204;
        } else {
          ctx.body = ctx.session.string;
        }
      });

      request(app.listen())
        .post('/')
        .expect(204, function (err, res) {
          if (err) {
            return done(err);
          }

          const cookie = res.headers['set-cookie'];

          request(app.listen())
            .get('/')
            .set('Cookie', cookie.join(';'))
            .expect(';', done);
        });
    });
  });

  describe('new session', function () {
    describe('when not accessed', function () {
      it('should not Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.body = 'greetings';
        });

        request(app.listen())
          .get('/')
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            res.header.should.not.have.property('set-cookie');
            done();
          });
      });
    });

    describe('when accessed and not populated', function () {
      it('should not Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session;
          ctx.body = 'greetings';
        });

        request(app.listen())
          .get('/')
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            res.header.should.not.have.property('set-cookie');
            done();
          });
      });
    });

    describe('when populated', function () {
      it('should Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session.message = 'hello';
          ctx.body = '';
        });

        request(app.listen())
          .get('/')
          .expect('Set-Cookie', /koa:sess/)
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            cookie = res.header['set-cookie'].join(';');
            done();
          });
      });

      it('should not Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.body = ctx.session;
        });

        request(app.listen())
          .get('/')
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            res.header.should.not.have.property('set-cookie');
            done();
          });
      });
    });
  });

  describe('saved session', function () {
    describe('when not accessed', function () {
      it('should not Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
          .get('/')
          .set('Cookie', cookie)
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            res.header.should.not.have.property('set-cookie');
            done();
          });
      });
    });

    describe('when accessed but not changed', function () {
      it('should be the same session', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session.message.should.equal('hello');
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
          .get('/')
          .set('Cookie', cookie)
          .expect(200, done);
      });

      it('should not Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session.message.should.equal('hello');
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
          .get('/')
          .set('Cookie', cookie)
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            res.header.should.not.have.property('set-cookie');
            done();
          });
      });
    });

    describe('when accessed and changed', function () {
      it('should Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session.money = '$$$';
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
          .get('/')
          .set('Cookie', cookie)
          .expect('Set-Cookie', /koa:sess/)
          .expect(200, done);
      });
    });
  });

  describe('when session is', function () {
    describe('null', function () {
      it('should expire the session', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session = null;
          ctx.body = 'asdf';
        });

        request(app.listen())
          .get('/')
          .expect('Set-Cookie', /koa:sess/)
          .expect(200, done);
      });
    });

    describe('an empty object', function () {
      it('should not Set-Cookie', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session = {};
          ctx.body = 'asdf';
        });

        request(app.listen())
          .get('/')
          .expect(200, function (err, res) {
            if (err) {
              return done(err);
            }
            res.header.should.not.have.property('set-cookie');
            done();
          });
      });
    });

    describe('an object', function () {
      it('should create a session', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session = {
            message: 'hello'
          };
          ctx.body = 'asdf';
        });

        request(app.listen())
          .get('/')
          .expect('Set-Cookie', /koa:sess/)
          .expect(200, done);
      });
    });

    describe('anything else', function () {
      it('should throw', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session(app));

        app.use(function * (ctx, next) {
          ctx.session = 'asdf';
        });

        request(app.listen())
          .get('/')
          .expect(500, done);
      });
    });
  });

  describe('when an error is thrown downstream and caught upstream', function () {
    it('should still save the session', function (done) {
      const app = new Instance();

      app.keys = ['a', 'b'];

      app.use(function * (ctx, next) {
        try {
          yield * next;
        } catch (err) {
          ctx.status = err.status;
          ctx.body = err.message;
        }
      });

      app.use(strapi.middlewares.session(app));

      app.use(function * (ctx, next) {
        ctx.session.name = 'funny';
        yield * next;
      });

      app.use(function * (ctx, next) {
        ctx.throw(401);
      });

      request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess/)
        .expect(401, done);
    });
  });

  describe('when maxAge present', function () {
    describe('and not expire', function () {
      it('should not expire the session', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session({
          maxAge: 100
        }, app));

        app.use(function * (ctx, next) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }

          ctx.body = ctx.session.message;
        });

        request(app.listen())
          .post('/')
          .expect('Set-Cookie', /koa:sess/)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            const cookie = res.headers['set-cookie'].join(';');

            request(app.listen())
              .get('/')
              .set('cookie', cookie)
              .expect('hi', done);
          });
      });
    });

    describe('and expired', function () {
      it('should expire the sess', function (done) {
        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session({
          maxAge: 100
        }, app));

        app.use(function * (ctx, next) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.status = 200;
            return;
          }

          ctx.body = ctx.session.message || '';
        });

        request(app.listen())
          .post('/')
          .expect('Set-Cookie', /koa:sess/)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            const cookie = res.headers['set-cookie'].join(';');

            setTimeout(function () {
              request(app.listen())
                .get('/')
                .set('cookie', cookie)
                .expect('', done);
            }, 200);
          });
      });
    });
  });

  describe('ctx.session.maxAge', function () {
    it('should return opt.maxAge', function (done) {
      const app = new Instance();

      app.keys = ['a', 'b'];

      app.use(strapi.middlewares.session({
        maxAge: 100
      }, app));

      app.use(function * (ctx, next) {
        ctx.body = ctx.session.maxAge;
      });

      request(app.listen())
        .get('/')
        .expect('100', done);
    });
  });

  describe('ctx.session.maxAge=', function () {
    it('should set sessionOptions.maxAge', function (done) {
      const app = new Instance();

      app.keys = ['a', 'b'];

      app.use(strapi.middlewares.session(app));

      app.use(function * (ctx, next) {
        ctx.session.foo = 'bar';
        ctx.session.maxAge = 100;
        ctx.body = ctx.session.foo;
      });

      request(app.listen())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200, done);
    });
  });

  describe('when get session before enter session middleware', function () {
    it('should work', function (done) {
      const app = new Instance();

      app.keys = ['a', 'b'];
      app.use(function * (ctx, next) {
        ctx.session.foo = 'hi';
        yield next();
      });
      app.use(strapi.middlewares.session({}, app));
      app.use(function * (ctx, next) {
        ctx.body = ctx.session;
      });

      request(app.callback())
        .get('/')
        .expect(200, function (err, res) {
          should.not.exist(err);
          const cookies = res.headers['set-cookie'].join(';');
          cookies.should.containEql('koa:sess=');

          request(app.callback())
            .get('/')
            .set('Cookie', cookies)
            .expect(200, done);
        });
    });
  });

  describe('when valid and beforeSave set', function () {
    it('should ignore session when uid changed', function (done) {
      const app = new Instance();

      app.keys = ['a', 'b'];

      app.use(strapi.middlewares.session({
        valid: function (ctx, sess) {
          return ctx.cookies.get('uid') === sess.uid;
        },
        beforeSave: function (ctx, sess) {
          sess.uid = ctx.cookies.get('uid');
        }
      }, app));

      app.use(function * (ctx, next) {
        if (!ctx.session.foo) {
          ctx.session.foo = Date.now() + '|uid:' + ctx.cookies.get('uid');
        }

        ctx.body = {
          foo: ctx.session.foo,
          uid: ctx.cookies.get('uid')
        };
      });

      request(app.callback())
        .get('/')
        .set('Cookie', 'uid=123')
        .expect(200, function (err, res) {
          should.not.exist(err);
          const data = res.body;
          const cookies = res.headers['set-cookie'].join(';');
          cookies.should.containEql('koa:sess=');

          request(app.callback())
            .get('/')
            .set('Cookie', cookies + ';uid=123')
            .expect(200)
            .expect(data, function (err) {
              should.not.exist(err);

              request(app.callback())
                .get('/')
                .set('Cookie', cookies + ';uid=456')
                .expect(200, function (err, res) {
                  should.not.exist(err);
                  res.body.uid.should.equal('456');
                  res.body.foo.should.not.equal(data.foo);
                  done();
                });
            });
        });
    });
  });

  describe('when options.encode and options.decode are functions', function () {
    describe('they are used to encode/decode stored cookie values', function () {
      it('should work', function (done) {
        let encodeCallCount = 0;
        let decodeCallCount = 0;

        function encode(data) {
          ++encodeCallCount;
          return JSON.stringify({
            enveloped: data
          });
        }

        function decode(data) {
          ++decodeCallCount;
          return JSON.parse(data).enveloped;
        }

        const app = new Instance();

        app.keys = ['a', 'b'];

        app.use(strapi.middlewares.session({
          encode: encode,
          decode: decode
        }, app));

        app.use(function * (ctx, next) {
          ctx.session.counter = (ctx.session.counter || 0) + 1;
          ctx.body = ctx.session;
          return;
        });

        request(app.callback())
          .get('/')
          .expect(function () {
            encodeCallCount.should.above(0, 'encode was not called');
          })
          .expect(200, function (err, res) {
            should.not.exist(err);
            res.body.counter.should.equal(1, 'expected body to be equal to session.counter');
            const cookies = res.headers['set-cookie'].join(';');
            request(app.callback())
              .get('/')
              .set('Cookie', cookies)
              .expect(function () {
                decodeCallCount.should.be.above(1, 'decode was not called');
              })
              .expect(200, function (err, res) {
                should.not.exist(err);
                res.body.counter.should.equal(2);
                done();
              });
          });
      });
    });
  });
});
