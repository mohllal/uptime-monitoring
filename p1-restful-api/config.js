var environments = {};

// development (default) environment
environments.development = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'hostname': 'localhost',
    'name': 'development',
    'secretKey': 'secret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid': process.env.TWILIO_ACCOUNT_SID || 'AC1f067851db3a2acd71c4a16d3dfedd5d',
        'authToken': process.env.TWILIO_AUTH_TOKEN || 'b7442ceb53329cec5b52a2d87aef4a1f',
        'fromPhone': process.env.TWILIO_FROM_PHONE || '+16129992149'
    }
};

// production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'hostname': '####',
    'name': 'production',
    'secretKey': '####',
    'maxChecks': 10,
    'twilio': {
        'accountSid': process.env.TWILIO_ACCOUNT_SID,
        'authToken': process.env.TWILIO_AUTH_TOKEN,
        'fromPhone': process.env.TWILIO_FROM_PHONE
    }
};

// get environment name passed as command-line argument
var passedEnvironment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase() : '';

// check if the passed environment is one of the above environments, if not default to 'development'
var exportedEnvironment = typeof(environments[passedEnvironment]) == 'object'? environments[passedEnvironment] : environments.development;

module.exports = exportedEnvironment;