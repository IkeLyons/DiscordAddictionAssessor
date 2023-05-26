# Discord Addiction Assesor - DAdAss
Find out how much time your friends spend in your Discord channels!

## Commands
* `/time @TargetUser`
  * Learn how long `TargetUser` has spent in discord voice channels!
* `/mytime`
  * Learn how long YOU has spent in discord voice channels!
* `/leaderboard`
  * Get a leaderboard of who spends the most time in your server!

# General Setup Instructions

1. Install npm
2. Install postgresql
3. Install yarn
4. Setup the DB
5. `yarn install`
6. `node createDB.js`
7. `node index.js`

## Setting up the DB

Config file created with the following fields:
```
{
  "token": "",
  "clientID": "",
  "guildID": "",
  "dbUser": "",
  "dbHost": "",
  "dbDatabase": "",
  "dbPassword": "",
  "dbPort": ""
}
```
Open Postgres:

`sudo -u postgres psql postgres`

Create the user and database specified above:

`CREATE ROLE myuser LOGIN PASSWORD 'mypass';`

`CREATE DATABASE mydatabase WITH OWNER = myuser;`

------


## Notes 
(for myself mostly but also you :) )

Hosted using `pm2