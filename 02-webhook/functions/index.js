const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const messages = require('./message/messages');
const flex = require('./message/flex');
const line = require('./util/line.util');
const mongo = require('./util/mongo.util');
const crypto = require('crypto');
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

    if (request.method !== "POST") {
        return response.status(200).send("Method Not Allowed");
    }
    // TODO: Uncomment this line if you want to verify the signature
    const signature = crypto.createHmac('SHA256', process.env.LINE_MESSAGING_CHANNEL_SECRET).update(request.rawBody).digest('base64').toString();
    if (request.headers['x-line-signature'] !== signature) {
        return res.status(401).send('Unauthorized');
    }

    const events = request.body.events
    for (const event of events) {

        if (event.source.type !== "group") {
            await line.isAnimationLoading(event.source.userId)
        }

        console.log(JSON.stringify(event));

        // TODO:Uncomment
        switch (event.type) {
            case "follow":
                const profile = await line.getProfile(event.source.userId)

                console.log(JSON.stringify(profile));
                console.log(JSON.stringify(event));


                if (event.follow.isUnblocked) {
                    await line.reply(event.replyToken, [messages.welcomeBack(profile)])
                } else {
                    await line.reply(event.replyToken, [messages.welcomeMessage(profile)])
                }
                break;
            case "unfollow":

                console.log(JSON.stringify(event));

                break;
            case "message":


                if (event.message.type === "text") {
                    const profile = await line.getProfile(event.source.userId)

                    switch (event.message.text) {
                        case "demo":

                            await line.replyWithStateless(event.replyToken, [{
                                "type": "text",
                                "text": JSON.stringify(profile)
                            }])


                            break;
                        case "สวัสดี":

                            await line.replyWithStateless(event.replyToken, [messages.welcomeMessage(profile)])


                            break;

                        case "profile":

                            await line.replyWithStateless(event.replyToken, [flex.profile(profile.pictureUrl, profile.displayName)])


                            break;

                        case "vdo":

                            await line.replyWithStateless(event.replyToken, [flex.vdo()])


                            break;

                        case "service":

                            await line.replyWithStateless(event.replyToken, [flex.service()])


                            break;

                        case "bill":

                            await line.replyWithStateless(event.replyToken, [flex.bill()])

                        case "queue":

                            await line.replyWithStateless(event.replyToken, [flex.queue()])


                            break;

                        case "booking":

                            await line.replyWithStateless(event.replyToken, [flex.booking()])


                            break;

                        default:
                            break;
                    }




                }

                /* 
                https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects
                }*/
                if (event.message.type === 'image') {

                    console.log(event);

                    /* ✅ 3.1 Get Content By API  
                    https://developers.line.biz/en/reference/messaging-api/#get-content
                    */
                    const binary = await line.getContent(event.message.id)

                    console.log(binary);


                    return response.end();
                }

                /*
                https://developers.line.biz/en/reference/messaging-api/#message-event
                */
                if (event.message.type === "location") {

                    console.log(event);

                }
                break;
            case "postback":
                const date = event.postback.params.date
                console.log(date);
                if (date) {
                    await line.replyWithStateless(event.replyToken, [messages.postbackDate(date)])
                }


                break;


        }


    }



    return response.end();

});

exports.group = onRequest(async (request, response) => {

    if (request.method !== "POST") {
        return response.status(200).send("Method Not Allowed");
    }

    // TODO: Uncomment this line if you want to verify the signature
    const signature = crypto.createHmac('SHA256', process.env.LINE_MESSAGING_CHANNEL_SECRET).update(request.rawBody).digest('base64').toString();
    if (request.headers['x-line-signature'] !== signature) {
        return res.status(401).send('Unauthorized');
    }


    const events = request.body.events
    for (const event of events) {

        if (event.source.type !== "group") {
            return response.status(200).send("Permission is Faled");
        }

        console.log(JSON.stringify(event));

        switch (event.type) {
            case "join":

                await line.reply(event.replyToken, [{
                    "type": "text",
                    "text": `สวัสดีทุกคน`,
                    "sender": {
                        "name": "BOT",
                        "iconUrl": "https://cdn-icons-png.flaticon.com/512/10176/10176915.png "
                    },
                    "quickReply": {
                        "items": [{
                            "type": "action",
                            "action": {
                                "type": "uri",
                                "label": "add friend",
                                "uri": "https://line.me/R/ti/p/@042bjiva"
                            }
                        },
                        {
                            "type": "action",
                            "action": {
                                "type": "uri",
                                "label": "share",
                                "uri": "https://line.me/R/nv/recommendOA/@042bjiva"
                            }
                        }
                        ]
                    }
                }])
                break;
            case "leave":
                console.log(JSON.stringify(event));

                await mongo.deleteDataByGroupId(event.source.groupId)
                break;
            case "memberJoined":

                for (let member of event.joined.members) {
                    if (member.type === "user") {

                        // const groupinfo = await line.getGroupInfoByGroupId(event.source.groupId)
                        const profile = await line.getProfileByGroup(event.source.groupId, member.userId)
                        // "text": `สวัสดีคุณ ${profile.displayName} เข้าสู่กลุ่ม ${groupinfo.groupName} ครับ `,

                        await mongo.upsertUserData( event.source.groupId,member.userId, profile)

                        await line.reply(event.replyToken, [{
                            "type": "textV2",
                            "text": "สวัสดีคุณ {user1}! ยินดีต้อนรับ {emoji1} \n ทุกคน {everyone} มีเพื่อนใหม่เข้ามาอย่าลืมทักทายกันนะ!",
                            "substitution": {
                                "user1": {
                                    "type": "mention",
                                    "mentionee": {
                                        "type": "user",
                                        "userId": member.userId
                                    }
                                },
                                "emoji1": {
                                    "type": "emoji",
                                    "productId": "5ac2280f031a6752fb806d65",
                                    "emojiId": "001"
                                },
                                "everyone": {
                                    "type": "mention",
                                    "mentionee": {
                                        "type": "all"
                                    }
                                }
                            }
                        }])

                    }
                }

                break;
            case "memberLeft":

                for (const member of event.left.members) {
                    if (member.type === "user") {

                        console.log(JSON.stringify(event));

                        await mongo.deleteDataByGroupAndUserId(event.source.groupId, member.userId)

                    }
                }

                break;
            case "message":

                if (event.message.type === "text") {




                    if (event.message.text == "สวัสดี") {

                        await line.reply(event.replyToken, [{
                            "type": "text",
                            "text": `สวัสดีครับ`,
                            "quoteToken": event.message.quoteToken
                        }])

                    }
                   
                    if (event.message.text == "me") {

                        const profile = await line.getProfileByGroup(event.source.groupId, event.source.userId)

                        await mongo.upsertUserData(event.source.groupId,event.source.userId,  profile)

                        const profileMongo = await mongo.getUserData(event.source.userId,event.source.groupId)

                        console.log(JSON.stringify(profile));
                        await line.reply(event.replyToken, [{
                            "type": "text",
                            "text": JSON.stringify(profileMongo)
                        }])

                    }

                    if (event.message.mention && event.message.mention.mentionees) {

                        for (let mentionee of event.message.mention.mentionees) {
                            if (mentionee.isSelf === true || mentionee.type === "all") {

                                await line.reply(event.replyToken, [{
                                    "type": "textV2",
                                    "text": "ว่ายังไงครับ ถามได้เลย {user1}",
                                    "substitution": {
                                        "user1": {
                                            "type": "mention",
                                            "mentionee": {
                                                "type": "user",
                                                "userId": event.source.userId
                                            }
                                        }
                                    }
                                }]);
                            }
                        }
                    }


                }



                break;
        }

    }
    return response.end();

});

exports.mongo = onRequest(async (request, response) => {

    await mongo.connectDB()
    console.log("🎉 MongoDB is ready to use!");
    await mongo.disconnectDB();

    return response.end();

});