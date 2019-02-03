var environments = {};

// development (default) environment
environments.development = {
    'port': 3000,
    'hostname': 'localhost',
    'name': 'development' 
};

// production environment
environments.production = {
    'port': 5000,
    'hostname': '####',
    'name': 'production'
};

// get environment name passed as command-line argument
var passedEnvironment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase() : '';

// check if the passed environment is one of the above environments, if not default to 'development'
var exportedEnvironment = typeof(environments[passedEnvironment]) == 'object'? environments[passedEnvironment] : environments.development;

module.exports = exportedEnvironment;