module.exports = function (config) {
  config.set({
    singleRun: false,

    basePath: '.',
    browsers: [
        'Chrome',
        // 'Firefox'
    ],
    frameworks: ['jasmine', 'karma-typescript'],
    files: [
        "node_modules/jquery/dist/jquery.js",
        "dist/validate.js",
        "*.spec.js"
    ],
    preprocessors: {
      '*.ts': ['karma-typescript']
    },
    karmaTypescriptConfig: {
      compilerOptions: {
        target: "es2017",
        module: "es2015",

        // noImplicitAny: true,
        // noImplicitReturns: true,
        // noImplicitThis: true,
        allowSyntheticDefaultImports: true,
        // Compilation target is ES5 but some ES2015 features are enabled using shim.
        // Tell the compiler that those newer features are available.
        lib: ['DOM', 'ES5', 'ScriptHost', 'ES2015.Core', 'ES2015.Iterable']
      }
    },
    reporters: ['progress', 'karma-typescript'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  });
};
