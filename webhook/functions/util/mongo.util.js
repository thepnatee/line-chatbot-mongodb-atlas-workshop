const { MongoClient } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
// const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const { GoogleVertexAIEmbeddings } = require("@langchain/google-vertexai"); 
// const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
// const { BaseLanguageModelInput } = require("@langchain/core/language_models/base");
// import { BaseMessage } from "@langchain/core/messages";
// import { VertexAIEmbeddings } from "@langchain/google-vertexai";

const gemini = require('./gemini.util');
const context = require("../context/context");



const uri = 'mongodb+srv://developer:vwRPXAxMTA10XLvG@workshop.kixja.mongodb.net/?retryWrites=true&w=majority&appName=workshop';
const client = new MongoClient(uri);

const connectDB = async () => {
    try {
        await client.connect();
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};


const insertVector = async (data) => {

    try {
        await client.connect();
        const db = client.db("developer");
        const collection = db.collection("disc_embeddings");
        const indexName = "vector_index";



        await Promise.all(data.map(async item => {
            // ตรวจสอบว่าข้อมูลมีอยู่แล้วหรือไม่
            const existingDoc = await collection.findOne({ type: item.type });

            // สร้างเวกเตอร์ฝังตัวโดยใช้ Gemini API
            const embedding = await gemini.getEmbedding(item.description + item.strengths + item.weaknesses + item.work_style);
            if (!embedding) return;

            // บันทึกข้อมูลลง MongoDB Atlas
            if (!existingDoc) {
                await collection.insertOne({
                    type: item.type,
                    description: item.description,
                    strengths: item.strengths,
                    weaknesses: item.weaknesses,
                    work_style: item.work_style,
                    embedding: embedding
                });
                console.log(`✅ Stored embedding for: ${item.type}`);
            }
        }));

        // ตรวจสอบว่ามี Index อยู่แล้วหรือไม่
        const existingIndexes = await collection.listSearchIndexes().toArray();
        const indexExists = existingIndexes.some(idx => idx.name === indexName);

        if (!indexExists) {
            const index = {
                name: indexName,
                type: "vectorSearch",
                definition: {
                    "fields": [
                        {
                            "type": "vector",
                            "path": "embedding",
                            "similarity": "cosine",
                            "numDimensions": 768,
                        }
                    ]
                }
            };
            // สร้าง Index ถ้ายังไม่มี
            const result = await collection.createSearchIndex(index);
            console.log("✅ Created new index:", result);
        } else {
            console.log("✅ Index 'vector_index' already exists. Skipping creation.");
        }
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
};

const vectorSearchQuery = async (query) => {
    console.log(query);
    try {
        await client.connect();
        const db = client.db("developer");
        const collection = db.collection("disc_embeddings");

        // แปลง query เป็น embedding โดยใช้ Gemini API
        const queryEmbedding = await gemini.getEmbedding(query);
        if (!queryEmbedding) {
            console.error("❌ Failed to generate embedding for query");
            return [];
        }

        // ทำ Vector Search Query
        const results = await collection.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    queryVector: queryEmbedding,
                    path: "embedding",
                    numCandidates: 1000,  // จำนวนเอกสารที่พิจารณาก่อนเลือกผลลัพธ์สุดท้าย
                    limit: 10  // ส่งคืนผลลัพธ์สูงสุด 1 รายการ
                }
            },
            {
                $project: {
                    type: 1,
                    description: 1,
                    strengths: 1,
                    weaknesses: 1,
                    work_style: 1,
                    score: { $meta: "vectorSearchScore" }  // เพิ่มคะแนนความคล้ายคลึง
                }
            }
        ]).toArray();

        console.log("✅ Search results:", results);
        return results;
    } catch (err) {
        console.error("❌ Search Error:", err);
        return [];
    } finally {
        await client.close();
    }
};


const vectorSearchQueryGemini = async (query) => {
    console.log(query);
    // try {

    

    await client.connect();


    const { GoogleVertexAIEmbeddings } = await import("@langchain/google-vertexai");
    const { MongoDBAtlasVectorSearch } = await import("@langchain/mongodb");

    // สร้าง Vector Store โดยใช้ Google Vertex AI Embeddings
    const vectorStore = new MongoDBAtlasVectorSearch(
        new GoogleVertexAIEmbeddings(), // ✅ ใช้งานได้แล้ว!
        {
            collection: "disc_embeddings",
            indexName: "vector_index",
            textKey: "text",
            embeddingKey: "embedding",
        }
    );

    const vectorStoreRetriever = vectorStore.asRetriever();
    console.log(`Vector Search Query: ${query}`);

    const history = context.baseLanguageModelInput()
    let prompt = `User question: ฉันเป็นคนที่ชอบเข้าสังคมและทำงานเป็นทีม ฉันเป็น DISC ประเภทไหน?`;
    const rag = true;
    if (rag) {
        const context = await vectorStoreRetriever.invoke("ฉันเป็นคนที่ชอบเข้าสังคมและทำงานเป็นทีม");


        console.log(context);
        //   if (context) {
        //     prompt += `

        //     Context:
        //     ${context?.map(doc => doc.pageContent).join("\n")}
        //   `;
        //   } else {
        //     console.error("Retrieval of context failed");
        //   }
        // }
        // const db = client.db("developer");
        // const collection = db.collection("disc_embeddings");

        // const model = new ChatVertexAI({
        //     model: "gemini-1.5-pro-001",
        //     maxOutputTokens: 2048,
        //     temperature: 0.5,
        //     topP: 0.9,
        //     topK: 20,
        //   });

        // } catch (err) {
        //     console.error("❌ Search Error:", err);
        //     return [];
        // } finally {
        //     await client.close();
    }
};

const disconnectDB = async () => {
    try {
        await client.close();
        console.log("✅ MongoDB Disconnected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Disconnection Error:", error.message);
    }
};

const upsert = async (userId, groupId, data) => {
    try {
        const db = client.db();
        const collection = db.collection("answers");

        const filter = { userId, groupId };
        const updateData = { $set: data };

        const result = await collection.findOneAndUpdate(filter, updateData, {
            returnDocument: "after", // ✅ Return updated document
            upsert: true // ✅ Insert if not exists
        });

        console.log("✅ Upsert Success:", result);
        return result;
    } catch (error) {
        console.error("❌ Upsert Error:", error.message);
        throw error;
    }
};

const findOne = async (userId, groupId) => {
    try {
        const db = client.db();
        const collection = db.collection("answers");

        const filter = { userId };
        if (groupId) {
            filter.groupId = groupId;
        }

        const result = await collection.findOne(filter);

        if (!result) {
            console.log(`⚠️ No document found for userId: ${userId}, groupId: ${groupId || "N/A"}`);
            return null;
        }

        console.log("✅ Found User Data:", result);
        return result;
    } catch (error) {
        console.error("❌ FindOne Error:", error.message);
        throw error;
    }
};

const deleteByGroupId = async (groupId) => {
    try {
        const db = client.db();
        const collection = db.collection("answers");

        const result = await collection.deleteMany({ groupId });

        console.log(`✅ Deleted ${result.deletedCount} documents in groupId: ${groupId}`);
        return result;
    } catch (error) {
        console.error("❌ DeleteByGroupId Error:", error.message);
        throw error;
    } finally {
        await disconnectDB(); // ✅ ปิด Connection หลังใช้งาน
    }
};

module.exports = {
    vectorSearchQueryGemini,
    vectorSearchQuery,
    insertVector,
    connectDB,
    disconnectDB,
    upsert,
    findOne,
    deleteByGroupId
};
