const path = require('path');
const config = (module.exports = require('openmrs/default-webpack-config'));
const pathSeparator = path.sep === '\\' ? '\\\\' : '/';
config.scriptRuleConfig.exclude = new RegExp(
  `node_modules${pathSeparator}(?!@openmrs${pathSeparator}esm-patient-common-lib${pathSeparator})`,
);
config.watchConfig.ignored = ['.git', 'test-results', `${path.resolve(__dirname, 'dist')}/**`];
config.overrides.resolve = {
  fallback: {
    crypto: false,
    stream: false,
    os: false,
    path: false,
    zlib: false,
    https: false,
    http: false,
    util: false,
    url: false,
  },
  extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss'],
  alias: {
    '@openmrs/esm-framework': '@openmrs/esm-framework/src/internal',
  },
};

module.exports = config;