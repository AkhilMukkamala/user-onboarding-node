module.exports = {
    development: {
        host : "localhost",
        port : "27017",
        db: "useronboardingdb",
        get connectionString() {
            return `mongodb://${this.host}:${this.port}/${this.db}`
         }
    }
}
