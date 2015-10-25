'use strict';

const strapi = require('../..');

const Instance = strapi.instance;

describe('app.toJSON()', function () {
  it('should work', function () {
    const app = new Instance();
    const obj = app.toJSON();

    obj.should.eql({
      subdomainOffset: 2,
      env: 'test'
    });
  });
});
