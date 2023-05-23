const { dbUser, dbHost, dbDatabase, dbPassword, dbPort } = require("./config.json");
const DBClient = require("pg");

// Manages all of the currently connected users and handles the retreiving of their data from the db
class ConnectionManager {
    constructor() {
        this.connected = {}
        this.pool = new DBClient.Pool({
            user: dbUser,
	        host: dbHost,
	        database: dbDatabase,
	        password: dbPassword,
	        port: dbPort
        });
        this.pool.connect();
    }

    addUser(userId, serverId) {
    	const currentTime = new Date();
        this.pool.query(`SELECT * FROM time_spent WHERE(user_id=${userId} AND server_id=${serverId})`, (err, res) => {
		    console.log(err);
		    if (res.rowCount === 0) {
		    	this.pool.query(`INSERT INTO time_spent (user_id, server_id, hours) VALUES (${userId}, ${serverId}, 0)`, (err2, res2) => {
		    		console.log(err2, res2);
		    	});
		    } else if (res.rowCount === 1) {
		    	this.connected[userId] = [res.rows[0].hours, currentTime, serverId];
		    } else {
		    	console.log('Duplicate Entry, Something went wrong');
		    	return;
		    }
	    });
    }

    deleteUser(userId, serverId){
	    if (this.connected[userId] != undefined) {
	    	const currentTime = new Date();
	    	const updatedTime = this.getTimeSpent(userId, currentTime);
	    	this.pool.query(`UPDATE time_spent SET hours=${updatedTime} WHERE(user_id=${userId} AND server_id=${serverId})`, (err) => {
	    		console.log(err);
	    	});
			console.log(this.connected);
	    	delete this.connected[userId];
			console.log(this.connected);
	    }
    }
    
    async refreshUser(userId, serverId){
	    if (this.connected[userId] != undefined) {
		    const currentTime = new Date();
		    const updatedTime = this.getTimeSpent(userId, currentTime);	
		    const response = await this.pool.query(`UPDATE time_spent SET hours=${updatedTime} WHERE(user_id=${userId} AND server_id=${serverId})`);
		    this.connected[userId] = [updatedTime, currentTime, serverId];
		    return response;
	    }
    }

	async getUser(userId, serverId){
		const response = await this.pool.query(`SELECT user_id, server_id, hours FROM time_spent WHERE(user_id=${userId} AND server_id=${serverId})`);
		let timeSpentString = "";
		for (const user of response.rows) {
			const seconds = Math.floor((user.hours * 60 * 60) % 60);
			const minutes = Math.floor((user.hours * 60) % 60);
			const hours = Math.floor(user.hours);
			timeSpentString = `${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
		}
		return timeSpentString;
	}
	
	async refreshAll(){
		for (const user in this.connected) {
			const serverid = this.connected[user][2];
			await this.refreshUser(user, serverid);
		}
	}

	getTimeSpent(user, currentTime){
		const timeSpent = Math.abs(this.connected[user][1] - currentTime) / (1000 * 60 * 60);
		const currentTotal = this.connected[user][0];
		return Math.abs(currentTotal + timeSpent);
	}

	async getLeaderboardResponse(interaction){
		const response = await this.pool.query(`SELECT user_id, server_id, hours FROM time_spent WHERE(server_id=${interaction.guild.id})ORDER BY hours DESC LIMIT 5`);
		
		let leaderboard = "";
		let i = 0;
		for (const user of response.rows) {
			i++;
			const seconds = Math.floor((user.hours * 60 * 60) % 60);
			const minutes = Math.floor((user.hours * 60) % 60);
			const hours = Math.floor(user.hours);
			const username = await interaction.guild.members.fetch(user.user_id);
			leaderboard = leaderboard + `#${i}:${username}\t\t\t${hours} hours,\t${minutes} minutes,\t${seconds} seconds\n`;
		}	
		return leaderboard;
	}

	isUserConnected(userId){
		return userId in this.connected;
	}
}

module.exports = ConnectionManager;