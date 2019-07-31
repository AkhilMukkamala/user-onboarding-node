module.exports = {
  apps : [{
    name: 'user-onboarding-node',
    script: 'init.js',
    instances: "max",
    exec_mode: "cluster",
    increment_var : 'PORT',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      watch: true,
      PORT: process.env.PORT || 8082,
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    env_production: {
      watch: false,
      PORT: process.env.PORT || 80,
      NODE_ENV: process.env.NODE_ENV || 'production'
    }
  }],

  // deploy : {
  //   production : {
  //     user : 'node',
  //     host : '212.83.163.1',
  //     ref  : 'origin/master',
  //     repo : 'git@github.com:repo.git',
  //     path : '/var/www/production',
  //     'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
  //   }
  // }
};
