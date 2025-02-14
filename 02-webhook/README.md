# 🚀 LINE Chatbot x MongoDB Atlas
A repo for building a LINE Chatbot using LINE Messaging API and MongoDB Atlas.

## 📌 Prerequisites
Before you begin, ensure you have the following:
* [Node.js v18](https://nodejs.org) or higher
* A channel with a **channel access token** from [LINE Developers console](https://developers.line.biz/en/docs/messaging-api/getting-started/)
* A **MongoDB Atlas cluster** from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and obtain your **MongoDB Connection String**

## ⚙️ Setting Up Environment Variables
Before running the application, configure your `.env` file with the required credentials:
```
CHANNEL_ACCESS_TOKEN=CHANNEL-ACCESS-TOKEN-OF-LINE-MESSAGING-API
MONGO_URL=MONGODB-CONNECTION-STRING
```

## 📖 Documentation
* [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/overview)
* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
* [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)

## 🛠 Installation & Usage
1. Install dependencies:
   ```sh
   cd functions
   ```
   ```sh
   npm install
   ```
2. Set up your `.env` file as mentioned above.
3. Run the application:
   ```sh
   firebase emulators:start
   ```

## 🚀 Deploying to Cloud
If you want to deploy this chatbot using **Cloud Functions for Firebase**:
1. Install Firebase CLI:
   ```sh
   npm install -g firebase-tools
   ```
2. Authenticate and initialize Firebase:
   ```sh
   firebase login
   firebase init functions
   ```
3. Deploy your function:
   ```sh
   firebase deploy --only functions
   ```

✅ Now, your LINE Chatbot is connected to **MongoDB Atlas** and ready to use! 🚀
