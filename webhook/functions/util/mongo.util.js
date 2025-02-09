const { MongoClient } = require("mongodb");


exports.connectDB = async () => {
    try {
        const uri = process.env.MONGO_URL;
        const client = new MongoClient(uri);
        await client.connect();
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

exports.disconnectDB = async () => {
    try {
        const uri = process.env.MONGO_URL;
        const client = new MongoClient(uri);
        await client.close();
        console.log("✅ MongoDB Disconnected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Disconnection Error:", error.message);
    }
};

exports.upsertUserData = async (userId, groupId, data) => {
    const uri = process.env.MONGO_URL;
    const client = new MongoClient(uri);
    if (!userId || !data) {
        throw new Error("❌ Missing required parameters: userId and data are required.");
    }

    try {
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
    const uri = process.env.MONGO_URL;
    const client = new MongoClient(uri);
    if (!userId) {
        throw new Error("❌ Missing required parameter: userId is required.");
    }

    try {
        const db = client.db();
        const collection = db.collection("user_group");

        const filter = { userId };
        if (groupId) filter.groupId = groupId;

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
    const uri = process.env.MONGO_URL;
    const client = new MongoClient(uri);
    if (!groupId) {
        throw new Error("❌ Missing required parameter: groupId is required.");
    }

    try {
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
        await disconnectDB(); // ✅ ปิด Connection หลังใช้งาน
    }
};
