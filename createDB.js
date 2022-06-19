const DBClient = require("pg");
const { dbUser, dbHost, dbDatabase, dbPassword, dbPort } = require("./config.json");

const db = new DBClient.Client({
	user: dbUser,
	host: dbHost,
	database: dbDatabase,
	password: dbPassword,
	port: dbPort,
});
db.connect();
db.query("CREATE TABLE time_spent(id INT GENERATED ALWAYS AS IDENTITY, user_id BIGINT, server_id BIGINT, hours FLOAT, PRIMARY KEY (id));", (err, res) => {
	console.log(err, res);
	db.end();
});
