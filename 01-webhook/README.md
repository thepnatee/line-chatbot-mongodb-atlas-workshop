# 🚀 Firebase Cloud Functions Emulator Setup

## 📖 **Step 1: ติดตั้ง Firebase CLI**
หากยังไม่ได้ติดตั้ง Firebase CLI ให้ติดตั้งก่อน:
```bash
npm install -g firebase-tools
```
ตรวจสอบเวอร์ชัน:
```bash
firebase --version
```

---

## 🔥 **Step 2: เริ่มต้น Firebase Project**
1.  **Login เข้าสู่ Firebase**:
   ```bash
   firebase login
   ```
3. **เริ่มต้น Firebase ในโปรเจกต์**:
   ```bash
   firebase init
   ```
   - เลือก `Functions`
   - เลือกใช้ `JavaScript` หรือ `TypeScript`
   - เลือก `No` สำหรับ ESLint (หรือ `Yes` ถ้าต้องการใช้)
   - ติดตั้ง dependencies (`Yes`)

---

## ⚙ **Step 3: ตั้งค่า Emulator**
1. **ติดตั้ง Emulator สำหรับ Cloud Functions**:
   ```bash
   firebase init emulators
   ```
   - เลือก **"Functions Emulator"**
   - ตั้งค่าพอร์ต (แนะนำค่าเริ่มต้น 5001)
   - เลือก `Yes` หากต้องการบันทึก Emulator UI

2. **แก้ไข `firebase.json`** (ถ้ายังไม่มี)
   ```json
   {
     "emulators": {
       "functions": {
         "host": "localhost",
         "port": 5001
       }
     }
   }
   ```

---

## 🚀 **Step 4: รัน Emulator**
เริ่ม Emulator สำหรับ Functions:
```bash
firebase emulators:start --only functions
```

ถ้าต้องการรันทั้งหมด (รวม Firestore, Auth, Hosting ฯลฯ):
```bash
firebase emulators:start
```

---

## 🎯 **Step 5: Deploy Cloud Functions**
เมื่อพัฒนาเสร็จแล้วให้ Deploy ขึ้น Firebase Cloud:
```bash
firebase deploy --only functions
```
ตรวจสอบว่า Deploy สำเร็จโดยใช้:
```bash
firebase functions:list
```

---

## ✅ **จบ!**
ตอนนี้คุณสามารถ **พัฒนาและทดสอบ Cloud Functions บนเครื่อง** ได้โดยไม่ต้องใช้ Firebase Cloud จริง! 🚀🔥