var environments = {};

// development (default) environment
environments.development = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'hostname': 'localhost',
    'name': 'development',
    'secretKey': 'secret',
    'maxChecks': 5
};

// production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'hostname': '####',
    'name': 'production',
    'secretKey': '####',
    'maxChecks': 10
};

// get environment name passed as command-line argument
var passedEnvironment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase() : '';

// check if the passed environment is one of the above environments, if not default to 'development'
var exportedEnvironment = typeof(environments[passedEnvironment]) == 'object'? environments[passedEnvironment] : environments.development;

module.exports = exportedEnvironment;