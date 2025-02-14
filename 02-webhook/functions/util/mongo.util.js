const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config(); // โหลดค่าจาก .env
const uri = `${process.env.MONGO_URL}`
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

exports.connectDB = async () => {
    try {
        await client.connect();
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

exports.disconnectDB = async () => {
    try {
        await client.close();
        console.log("✅ MongoDB Disconnected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Disconnection Error:", error.message);
    }
};

exports.upsertUserData = async (groupId, userId,  data) => {
    if (!userId || !data) {
        throw new Error("❌ Missing required parameters: userId and data are required.");
    }

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection("user_group");

        const filter = { userId, groupId };
        const updateData = { $set: data };

        const result = await collection.findOneAndUpdate(filter, updateData, {
            returnDocument: "after", // ✅ คืนค่าข้อมูลที่อัปเดต
            upsert: true // ✅ สร้างเอกสารใหม่ถ้ายังไม่มี
        });


        await client.close();
        console.log("✅ Upsert Success:", result);
        return result;
    } catch (error) {
        console.error("❌ Error in upsertUserData:", error.message);
        throw error;
    }
};


exports.getUserData = async (userId, groupId = null) => {

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection("user_group");

        // const filter = { userId };
        // if (groupId) filter.groupId = groupId;

        const filter = { userId, groupId };
        const result = await collection.findOne(filter);

        if (!result) {
            console.log(`⚠️ No document found for userId: ${userId}, groupId: ${groupId || "N/A"}`);
            return null;
        }

        console.log("✅ Found User Data:", result);
        await client.close();
        return result;
    } catch (error) {
        console.error("❌ Error in getUserData:", error.message);
        throw error;
    }
};


exports.deleteDataByGroupId = async (groupId) => {
    if (!groupId) {
        throw new Error("❌ Missing required parameter: groupId is required.");
    }

    try {

        await client.connect();
        const db = client.db();
        const collection = db.collection("user_group");

        const result = await collection.deleteMany({ groupId });

        console.log(`✅ Deleted ${result.deletedCount} documents in groupId: ${groupId}`);
        await client.close();
        return result;
    } catch (error) {
        console.error("❌ Error in deleteDataByGroupId:", error.message);
        throw error;
    } finally {
        await this.disconnectDB(); // ✅ ปิด Connection หลังใช้งาน
    }
};

exports.deleteDataByGroupAndUserId = async (groupId, userId) => {
    if (!groupId || !userId) {
        throw new Error("❌ Missing required parameters: groupId and userId are required.");
    }

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection("user_group");

        const result = await collection.deleteOne({ groupId, userId });

        console.log(`✅ Deleted ${result.deletedCount} document(s) in groupId: ${groupId}, userId: ${userId}`);
        return result;
    } catch (error) {
        console.error("❌ Error in deleteDataByGroupAndUserId:", error.message);
        throw error;
    } finally {
        await this.disconnectDB(); // ✅ ปิด Connection หลังใช้งาน
    }
};
