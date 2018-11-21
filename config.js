var adminUser = {
                  data : {
                            name : 'admin',
                            macId : '',
                            email : 'admin@abc.com',
                            role : 'role_it',
                            ssh : true
                          }
                };

var user_roles = ["role_manager", "role_architect", "role_developer", "role_dba", "role_avp" ,"role_ps", "role_devops","role_it","role_qa","role_infosec","role_network","role_config"];
var teams = ["dba", "dev", "qa", "ps", "devops", "infosec" ,"network", "config","it"];
var environments = ["prod", "non-prod"];
var sectors = ["india","other"];

var admins =  {
                  userAdmins : ["role_it"],
                  sshAdmins : ["role_it"],
                  pwdAdmins : ["role_architect"]
              };

var cidr_list = {
                  "all": "99.1.0.0/16"
                };

var ips = {
"server_grp1" : {
                  "server1": "a.b.c.251"
              },
"server_grp2" : {
                  "server1" : "a.b.c.1",
                  "server2" : "a.b.c.2",
                  "server3" : "a.b.c.3",
                  "server4" : "a.b.c.4",
                  "server5" : "a.b.c.5",
                  "server6" : "a.b.c.6",
                  "server7" : "a.b.c.7",
                  "server8" : "a.b.c.8",
                  "server9" : "a.b.c.9",
                  "server10" : "a.b.c.10",
                  "server11" : "a.b.c.11",
                  "server12" : "a.b.c.12",
                  "server14" : "a.b.c.14"
              },
"server_grp3" : {
                  "serverX1" : "a.b.c.151",
                  "serverX2" : "a.b.c.152",
                  "serverX3" : "a.b.c.153",
                  "serverX4" : "a.b.c.154",
                  "serverX5" : "a.b.c.155"
              },
"server_grp4" :       {
                  "mon1" : "a.b.c.121",
                  "mon2" : "a.b.c.122"
              },
"db" :        {
                  "db1" : "a.b.c.241",
                  "db2" : "a.b.c.242",
                  "db3" : "a.b.c.243"
              }
};

module.exports = {
    vault_host: 'VAULT_HOST_SERVER_IP',
    vault_port: 'VAULT_HOST_PORT_IP',
    app_host: 'APP_HOST_SERVER_IP',
    app_port: 'APP_HOST_PORT_IP',
    rootToken: 'VAULT_ROOT_TOKEN',
    default_user_ttl: 3000,
    default_user_max_ttl: 3000,
    cidr_list : cidr_list,
    ips : ips,
    user_roles : user_roles,
    teams : teams,
    environments : environments,
    admins : admins,
    sectors : sectors,
    admin_data : adminUser,
    create_admin : false,
    enable_mac_validation : false
}
