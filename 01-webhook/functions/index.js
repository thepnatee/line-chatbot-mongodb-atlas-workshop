const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");

/**
 * Firebase Functions 2nd Generation
 * https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.globaloptions
 */
setGlobalOptions({
    region: "asia-northeast1",
    memory: "1GB",
    concurrency: 40
})

exports.receive = onRequest({ invoker: "public" }, async (request, response) => {


    const events = request.body
    console.log(events);
    

    return response.end();

});