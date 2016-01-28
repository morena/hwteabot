'use strict';

var TeaBot = require("../lib/teabot"),
	token = process.env.BOT_API_KEY,
	//dbPath = process.env.BOT_DB_PATH,
	name = process.env.BOT_NAME;

var hwteabot = new TeaBot({
	token : token,
	//dbPath : dbPath,
	name : name
});

hwteabot.run();