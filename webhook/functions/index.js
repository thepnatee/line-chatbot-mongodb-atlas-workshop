const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const line = require('./util/line.util');
const gemini = require('./util/gemini.util');
const context = require('./context/context');
const { insertVector,vectorSearchQuery,vectorSearchQueryGemini, upsert, findOne, deleteByGroupId } = require("./util/mongo.util"); // MongoDB utilities
// const UserAnswers = require("./model/userAnswers.model");

setGlobalOptions({
    region: "asia-northeast1",
    memory: "1GB",
    concurrency: 40
})

exports.receive = onRequest({ invoker: "public" }, async (request, response) => {

    if (request.method !== "POST") {
        return response.status(200).send("Method Not Allowed");
    }
    if (!line.verifySignature(request.headers["x-line-signature"], request.body)) {
        return response.status(401).send("Unauthorized");
    }

    const events = request.body.events
    for (const event of events) {   
        console.log(event);
        await vectorSearchQueryGemini();

        if (event.source.type !== "group") {
            return response.end();
        }

        if (event.type === "join") {
            await line.reply(event.replyToken, [{
                "type": "text",
                "text": "สวัสดีทุกค๊นน มารวมกันทำแบบสอบถามกันเถอะ \r\n หากต้องการเริ่มทำแบบสอบถามใหม่ \n เพียง tag ชื่อ @disc ได้เลย ",
                "quickReply": {
                    "items": [{
                        "type": "action",
                        "action": {
                            "type": "uri",
                            "label": "เริ่มทำแบบทดสอบ",
                            "uri": process.env.LINE_LIFF_DISC + "?groupId=" + event.source.groupId
                        }
                    },
                    {
                        "type": "action",
                        "action": {
                            "type": "message",
                            "label": "Type",
                            "text": "Type"
                        }
                    }
                    ]
                }
            }])
            return response.end();
        }


        if (event.type === "memberJoined") {

            for (let member of event.joined.members) {
                if (member.type === "user") {
                    await line.reply(event.replyToken, [{
                        "type": "textV2",
                        "text": "สวัสดีคุณ {user1}! ยินดีต้อนรับ \n ทุกคน {everyone} มีเพื่อนใหม่เข้ามาอย่าลืมทักทายกันนะ!",
                        "quickReply": {
                            "items": [{
                                "type": "action",
                                "action": {
                                    "type": "uri",
                                    "label": "เริ่มทำแบบทดสอบ",
                                    "uri": process.env.LINE_LIFF_DISC + "?groupId=" + event.source.groupId
                                }
                            },
                            {
                                "type": "action",
                                "action": {
                                    "type": "message",
                                    "label": "Type",
                                    "text": "Type"
                                }
                            }
                            ]
                        },
                        "substitution": {
                            "user1": {
                                "type": "mention",
                                "mentionee": {
                                    "type": "user",
                                    "userId": member.userId
                                }
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

        }

        if (event.type === "message" && event.message.type === "text") {

            if (event.message.text === "ฉันได้ประเมินเรียบร้อยแล้ว" || event.message.text === "Type") {


                // ค้นหาข้อมูลของ userId ที่ส่งมา
                const userData = await findOne(event.source.userId, event.source.groupId);
                console.log(userData);
                if (userData) {
                    await line.reply(event.replyToken, [{
                        "type": "textV2",
                        "text": `คุณ {user1} คุณอยู่ในกลุ่ม ${userData.model} \r\n\r\n รายละเอียด ${userData.description}`,
                        "quickReply": {
                            "items": [{
                                "type": "action",
                                "action": {
                                    "type": "uri",
                                    "label": "ทำแบบทดสอบ",
                                    "uri": process.env.LINE_LIFF_DISC + "?groupId=" + event.source.groupId
                                }
                            },
                            {
                                "type": "action",
                                "action": {
                                    "type": "message",
                                    "label": "Type",
                                    "text": "Type"
                                }
                            }
                            ]
                        },
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
                }else{
                    await line.reply(event.replyToken, [{
                        "type": "textV2",
                        "text": "สวัสดีครับ {user1} เรามาเริ่มทำแบบทดสอบกันดีกว่า",
                        "quickReply": {
                            "items": [{
                                "type": "action",
                                "action": {
                                    "type": "uri",
                                    "label": "เริ่มทำแบบทดสอบ",
                                    "uri": process.env.LINE_LIFF_DISC + "?groupId=" + event.source.groupId
                                }
                            },
                            {
                                "type": "action",
                                "action": {
                                    "type": "message",
                                    "label": "Type",
                                    "text": "Type"
                                }
                            }
                            ]
                        },
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

            if (event.message.mention && event.message.mention.mentionees) {

                for (let mentionee of event.message.mention.mentionees) {
                    if (mentionee.isSelf === true) {

                        await line.reply(event.replyToken, [{
                            "type": "textV2",
                            "text": "สวัสดีครับ {user1} เรามาเริ่มทำแบบทดสอบกันดีกว่า",
                            "quickReply": {
                                "items": [{
                                    "type": "action",
                                    "action": {
                                        "type": "uri",
                                        "label": "เริ่มทำแบบทดสอบ",
                                        "uri": process.env.LINE_LIFF_DISC + "?groupId=" + event.source.groupId
                                    }
                                },
                                {
                                    "type": "action",
                                    "action": {
                                        "type": "message",
                                        "label": "Type",
                                        "text": "Type"
                                    }
                                }
                                ]
                            },
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

        if (event.type === "leave") {
            await deleteByGroupId(event.source.groupId);
            return res.end();
        }


    }



    return response.end();

});

exports.createVector = onRequest({ cors: true, invoker: "public" }, async (request, response) => {

    // if (request.method !== "POST") {
    //     return response.status(200).send("Method Not Allowed");
    // }

    console.log(context.discDetail())
    await insertVector(context.discDetail())


    const sampleQuery = "มีความอดทนสูง ใจดี และชอบช่วยเหลือผู้อื่น";
    const searchResults = await vectorSearchQuery(sampleQuery);
    console.log("🔍 Sample Query Result:", searchResults);


    return response.end();
})
exports.service = onRequest({ cors: true, invoker: "public" }, async (request, response) => {


    console.log(request.method)
    if (request.method !== "POST") {
        return response.status(200).send("Method Not Allowed");
    }

    console.log(request.headers.authorization)
    console.log(request.headers.groupid)
    const profile = await line.getProfileByIDToken(request.headers.authorization);
    if (!profile || !profile.sub) {
        return response.status(401).json({ error: "Invalid LINE ID Token" });
    }

    const { answers } = request.body;
    if (!answers || !Array.isArray(answers)) {
        return response.status(400).json({ error: "Invalid answers format" });
    }
    const answersMapIndex = answers.map((answer, index) => `${index}.${answer.charAt(0)}`);


    console.log(profile);
    const prompt1 = `จากคำตอบนี้ ${JSON.stringify(answersMapIndex)} 
    ช่วยพิจารณาว่าฉันเป็นกลุ่มใดใน DISC Model โดยให้คำตอบที่โดดเด่นที่สุด 1 Model 
    และอยู่ในรูปแบบ JSON ตัวอย่าง: 
    { "model": "Dominance", "description": "คนประเภท D มักมีลักษณะเป็นผู้นำ ชอบควบคุมสถานการณ์ และรับผิดชอบในการตัดสินใจ พวกเขามักจะมุ่งมั่นและมีจุดยืนที่ชัดเจน" }`;

    console.log(prompt1);

    responseModel = await gemini.question(prompt1)
    const cleanedString = responseModel.replace(/json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedString);
    console.log("gemini ", parsed)

    const userAnswerObject = {
        "groupId": request.headers.groupid,
        "userId": profile.sub,
        "model": parsed.model,
        "description": parsed.description,
        "answers": answers,
    }
    console.log("userAnswerObject ", userAnswerObject)
    await upsert( profile.sub, request.headers.groupid, userAnswerObject);

    console.log({
        message: "User answer saved successfully",
        data: userAnswerObject,
    })
    return response.status(200).json({
        message: "User answer saved successfully",
        data: userAnswerObject,
    });


});