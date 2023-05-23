Setup Instructions

1. Install npm
2. Install postgresql
3. Install yarn
4. Setup the DB:
* Config created with the following fields:


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
* Open Postgres:


`sudo -u postgres psql postgres`
* Create the user and database with fields specified above:


```
CREATE ROLE myuser LOGIN PASSWORD 'mypass';
CREATE DATABASE mydatabase WITH OWNER = myuser;
```
5. yarn install
6. node createDB.js
7. node index.js

Notes:
I currently am running this using pm2 on a raspberry pi
