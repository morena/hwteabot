'use strict';

var TeaBot = require("../lib/teabot"),
	token = process.env.BOT_API_KEY,
	//dbPath = process.env.BOT_DB_PATH,
	name = process.env.BOT_NAME;

var teabot = new TeaBot({
	token : token,
	//dbPath : dbPath,
	name : name
});

teabot.run();