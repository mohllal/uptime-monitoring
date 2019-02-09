var environments = {};

// development (default) environment
environments.development = {
    'httpPort': process.env.HTTP_PORT || 3000,
    'httpsPort': process.env.HTTPS_PORT || 3001,
    'hostname': 'localhost',
    'name': 'development',
    'secretKey': process.env.SECRET_KEY || 'secret',
    'maxChecks': process.env.MAXIMUM_CHECKS || 5,
    'workerInterval': process.env.WORKER_INTERVAL || 1000 * 60,
    'compressLogsInterval': process.env.COMPRESS_LOGS_INTERVAL || 1000 * 60 * 60 * 24,
    'twilio' : {
        'accountSid': process.env.TWILIO_ACCOUNT_SID || 'AC1f067851db3a2acd71c4a16d3dfedd5d',
        'authToken': process.env.TWILIO_AUTH_TOKEN || 'b7442ceb53329cec5b52a2d87aef4a1f',
        'fromPhone': process.env.TWILIO_FROM_PHONE || '+16129992149'
    }
};

// production environment
environments.production = {
    'httpPort': process.env.HTTP_PORT,
    'httpsPort': process.env.HTTPS_PORT,
    'hostname': process.env.HOST_NAME,
    'name': 'production',
    'secretKey': process.env.SECRET_KEY,
    'maxChecks': process.env.MAXIMUM_CHECKS,
    'workerInterval': process.env.WORKER_INTERVAL,
    'compressLogsInterval': process.env.COMPRESS_LOGS_INTERVAL,
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