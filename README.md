# vault-manager
User management, SSH Managment and Password management

# Installation Steps

1. Change Host IP in /app/vaultApp/vaultController.js
2. Change config.js
    module.exports = {
        vault_host: 'vault_host_ip',
        vault_port: 'vault_port',
        app_host: 'app host ip',
        app_port: 5555,
        rootToken: 'vault_root_token',
        default_user_ttl: client_token_validity,
        default_user_max_ttl: client_token_max_validity
    }
3. Creates Admin user for login from config.js on first run
    Will create automatically based on data mention in config.js -> adminUser.
    
    var adminUser = {
                      data : {
                                name : 'admin',
                                macId : '',
                                email : 'admin@abc.com',
                                role : 'role_it',
                                ssh : true
                              }
                    };

4. Use "npm start" to start server and "npm stop" to stop server.
