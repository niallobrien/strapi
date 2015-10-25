'use strict';

const strapi = require('../..');

const Instance = strapi.instance;

describe('app.inspect()', function () {
  it('should work', function () {
    const app = new Instance();
    const util = require('util');
    util.inspect(app);
  });
});
